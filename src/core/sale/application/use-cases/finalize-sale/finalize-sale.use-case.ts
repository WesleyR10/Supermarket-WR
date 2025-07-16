import { IUseCase } from '../../../../shared/application/use-case.interface';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { Sale, SaleId, SaleStatus } from '../../../domain/sale.aggregate';
import { ISaleRepository } from '../../../domain/repositories/sale.repository.interface';
import { SaleOutput, SaleOutputMapper } from '../common/sale-output';
import { FinalizeSaleInput } from './finalize-sale.input';
import { Notification } from '../../../../shared/domain/validators/notification';

export type FinalizeSaleOutput = SaleOutput & {
  change_amount?: number;
};

export class FinalizeSaleUseCase
  implements IUseCase<FinalizeSaleInput, FinalizeSaleOutput>
{
  constructor(private readonly saleRepo: ISaleRepository) {}

  async execute(input: FinalizeSaleInput): Promise<FinalizeSaleOutput> {
    // ✅ Criação direta (validações automáticas do class-validator)
    const saleId = new SaleId(input.sale_id);
    const sale = await this.saleRepo.findById(saleId);

    if (!sale) {
      throw new NotFoundError(input.sale_id, Sale);
    }

    // ✅ Validações de regras de negócio usando Notification
    const notification = new Notification();
    if (sale.sale_status !== SaleStatus.PENDING) {
      notification.addError('Cannot finalize a sale that is not pending', 'sale_status');
    }

    if (sale.items.length === 0) {
      notification.addError('Cannot finalize a sale without items', 'items');
    }
    
    if (notification.hasErrors()) {
      throw new EntityValidationError(notification.toJSON());
    }

    // Definir método de pagamento se fornecido
    if (input.payment_method) {
      sale.setPaymentMethod(input.payment_method);
    }

    // Finalizar venda
    sale.completeSale();

    // ✅ Validações do domínio
    if (sale.notification.hasErrors()) {
      throw new EntityValidationError(sale.notification.toJSON());
    }

    await this.saleRepo.update(sale);

    const output = SaleOutputMapper.toOutput(sale);
    
    // Calcular troco se necessário
    let changeAmount: number | undefined;
    if (input.received_amount && input.received_amount > sale.getFinalTotal()) {
      changeAmount = input.received_amount - sale.getFinalTotal();
    }

    return {
      ...output,
      change_amount: changeAmount
    };
  }
}