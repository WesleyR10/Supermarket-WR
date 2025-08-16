import { IUseCase } from '../../../../shared/application/use-case.interface';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { Sale, SaleId, SaleStatus } from '../../../domain/sale.aggregate';
import { ISaleRepository } from '../../../domain/repositories/sale.repository.interface';
import { SaleOutput, SaleOutputMapper } from '../common/sale-output';
import { FinalizeSaleInput } from './finalize-sale.input';
import { Notification } from '../../../../shared/domain/validators/notification';

export type FinalizeSaleOutput = SaleOutput;

export class FinalizeSaleUseCase
  implements IUseCase<FinalizeSaleInput, FinalizeSaleOutput>
{
  constructor(private readonly saleRepo: ISaleRepository) {}

  async execute(input: FinalizeSaleInput): Promise<FinalizeSaleOutput> {
    const saleId = new SaleId(input.sale_id);
    const sale = await this.saleRepo.findById(saleId);

    if (!sale) {
      throw new NotFoundError(input.sale_id, Sale);
    }

    // Multi-tenant: se store_id for informado, validar que a venda pertence à loja
    if (input.store_id && sale.store_id !== input.store_id) {
      throw new EntityValidationError([
        { store_id: ['Sale does not belong to this store'] },
      ]);
    }

    const notification = new Notification();

    if (sale.sale_status !== SaleStatus.PENDING) {
      notification.addError('Cannot finalize a sale that is not pending', 'sale_status');
    }

    if (sale.items.length === 0) {
      notification.addError('Cannot finalize a sale with no items', 'items');
    }

    if (notification.hasErrors()) {
      throw new EntityValidationError(notification.toJSON());
    }

    // Calcular troco quando houver pagamento em dinheiro
    if (input.received_amount !== undefined) {
      sale.calculateChange(input.received_amount);
    }

    sale.finalize(input.payment_method);

    await this.saleRepo.update(sale);

    return SaleOutputMapper.toOutput(sale);
  }
}