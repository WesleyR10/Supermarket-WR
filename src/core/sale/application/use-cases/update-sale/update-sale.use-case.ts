import { IUseCase } from '../../../../shared/application/use-case.interface';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { Sale, SaleId, SaleStatus, PaymentMethod } from '../../../domain/sale.aggregate';
import { ISaleRepository } from '../../../domain/repositories/sale.repository.interface';
import { SaleOutput, SaleOutputMapper } from '../common/sale-output';
import { UpdateSaleInput } from './update-sale.input';
import { Notification } from '../../../../shared/domain/validators/notification';

export type UpdateSaleOutput = SaleOutput;

export class UpdateSaleUseCase implements IUseCase<UpdateSaleInput, UpdateSaleOutput> {
  constructor(private readonly saleRepo: ISaleRepository) {}

  async execute(input: UpdateSaleInput): Promise<UpdateSaleOutput> {
    const saleId = new SaleId(input.id);
    const sale = await this.saleRepo.findById(saleId);

    if (!sale) {
      throw new NotFoundError(input.id, Sale);
    }

    // Multi-tenant: garantir que a venda pertence à store_id informada
    if (sale.store_id !== input.store_id) {
      throw new EntityValidationError([
        { store_id: ['Sale does not belong to this store'] },
      ]);
    }

    // Não permitir atualização se venda não estiver pendente
    const notification = new Notification();
    if (sale.sale_status !== SaleStatus.PENDING) {
      notification.addError('Cannot update a sale that is not pending', 'sale_status');
    }

    if (notification.hasErrors()) {
      throw new EntityValidationError(notification.toJSON());
    }

    // Atualizações permitidas enquanto pendente
    if (typeof input.customer_id !== 'undefined') {
      sale.customer_id = input.customer_id ?? null;
    }

    if (typeof input.cashier_id !== 'undefined') {
      sale.cashier_id = input.cashier_id;
    }

    if (typeof input.register_number !== 'undefined') {
      sale.register_number = input.register_number;
    }

    if (typeof input.payment_method !== 'undefined') {
      sale.setPaymentMethod(input.payment_method as PaymentMethod);
    }

    if (typeof input.discount_amount !== 'undefined') {
      sale.applyDiscount(input.discount_amount);
    }

    // Atualização de itens (se informados)
    if (input.items && input.items.length > 0) {
      for (const patch of input.items) {
        const existing = sale.items.find(i => i.product_id === patch.product_id);
        if (!existing) {
          // Se item não existe, adiciona como novo
          sale.addItem({
            product_id: patch.product_id,
            quantity: patch.quantity ?? 1,
            unit_price: patch.unit_price ?? 0,
            discount_percentage: patch.discount_percentage ?? 0,
          });
        } else {
          let touched = false;
          if (typeof patch.quantity !== 'undefined') {
            sale.updateItemQuantity(patch.product_id, patch.quantity);
            touched = true;
          }
          if (typeof patch.unit_price !== 'undefined') {
            existing.updateUnitPrice(patch.unit_price);
            touched = true;
          }
          if (typeof patch.discount_percentage !== 'undefined') {
            existing.updateDiscountPercentage(patch.discount_percentage);
            touched = true;
          }
          // Forçar recálculo total se houve alteração no item sem passar pelo updateItemQuantity
          if (touched && typeof patch.quantity === 'undefined') {
            sale.updateItemQuantity(existing.product_id, existing.quantity);
          }
        }
      }
    }

    // Validar entidade com campos relevantes
    sale.validate(['customer_id', 'cashier_id', 'register_number', 'payment_method', 'items', 'discount_amount']);

    if (sale.notification.hasErrors()) {
      throw new EntityValidationError(sale.notification.toJSON());
    }

    await this.saleRepo.update(sale);
    return SaleOutputMapper.toOutput(sale);
  }
}