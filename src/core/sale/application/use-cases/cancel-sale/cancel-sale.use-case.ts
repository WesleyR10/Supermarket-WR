import { IUseCase } from '../../../../shared/application/use-case.interface';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { Sale, SaleId } from '../../../domain/sale.aggregate';
import { ISaleRepository } from '../../../domain/repositories/sale.repository.interface';
import { SaleOutput, SaleOutputMapper } from '../common/sale-output';
import { CancelSaleInput } from './cancel-sale.input';
import { Notification } from '../../../../shared/domain/validators/notification';

export type CancelSaleOutput = SaleOutput;

export class CancelSaleUseCase
  implements IUseCase<CancelSaleInput, CancelSaleOutput>
{
  constructor(private readonly saleRepo: ISaleRepository) {}

  async execute(input: CancelSaleInput): Promise<CancelSaleOutput> {
    // ✅ Criação direta (validações automáticas do class-validator)
    const saleId = new SaleId(input.sale_id);
    const sale = await this.saleRepo.findById(saleId);

    if (!sale) {
      throw new NotFoundError(input.sale_id, Sale);
    }

    // ✅ Validações de regras de negócio usando Notification
    const notification = new Notification();
    if (!sale.canBeCancelled()) {
      notification.addError('Cannot cancel a sale that is not pending', 'sale_status');
    }
    
    if (notification.hasErrors()) {
      throw new EntityValidationError(notification.toJSON());
    }

    // Cancelar venda
    sale.cancelSale();

    await this.saleRepo.update(sale);

    return SaleOutputMapper.toOutput(sale);
  }
}