import { IUseCase } from '../../../../shared/application/use-case.interface';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { Sale, SaleId, SaleStatus } from '../../../domain/sale.aggregate';
import { ISaleRepository } from '../../../domain/repositories/sale.repository.interface';
import { SaleOutput, SaleOutputMapper } from '../common/sale-output';
import { AddItemToSaleInput } from './add-item-to-sale.input';
import { Notification } from '../../../../shared/domain/validators/notification';

export type AddItemToSaleOutput = SaleOutput;

export class AddItemToSaleUseCase
  implements IUseCase<AddItemToSaleInput, AddItemToSaleOutput>
{
  constructor(private readonly saleRepo: ISaleRepository) {}

  async execute(input: AddItemToSaleInput): Promise<AddItemToSaleOutput> {
    // ✅ Criação direta (validações automáticas do class-validator)
    const saleId = new SaleId(input.sale_id);
    const sale = await this.saleRepo.findById(saleId);

    if (!sale) {
      throw new NotFoundError(input.sale_id, Sale);
    }

    // ✅ Multi-tenant: garantir que a venda pertence à store_id informada
    if (sale.store_id !== input.store_id) {
      throw new EntityValidationError([
        { store_id: ['Sale does not belong to this store'] },
      ]);
    }

    // ✅ Validações de regras de negócio usando Notification
    const notification = new Notification();
    if (sale.sale_status !== SaleStatus.PENDING) {
      notification.addError('Cannot add items to a sale that is not pending', 'sale_status');
    }
    
    if (notification.hasErrors()) {
      throw new EntityValidationError(notification.toJSON());
    }

    // Adicionar item
    sale.addItem({
      product_id: input.product_id,
      quantity: input.quantity,
      unit_price: input.unit_price || 0,
      discount_percentage: input.discount_percentage || 0
    });

    await this.saleRepo.update(sale);
    return SaleOutputMapper.toOutput(sale);
  }
}