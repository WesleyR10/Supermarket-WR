import { IUseCase } from '../../../../shared/application/use-case.interface';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { Sale, SaleId, SaleStatus } from '../../../domain/sale.aggregate';
import { ISaleRepository } from '../../../domain/repositories/sale.repository.interface';
import { SaleOutput, SaleOutputMapper } from '../common/sale-output';
import { ApplyDiscountInput } from './apply-discount.input';
import { Notification } from '../../../../shared/domain/validators/notification';

export type ApplyDiscountOutput = SaleOutput;

export class ApplyDiscountUseCase
  implements IUseCase<ApplyDiscountInput, ApplyDiscountOutput>
{
  constructor(private readonly saleRepo: ISaleRepository) {}

  async execute(input: ApplyDiscountInput): Promise<ApplyDiscountOutput> {
    // ✅ Criação direta (validações automáticas do class-validator)
    const saleId = new SaleId(input.sale_id);
    const sale = await this.saleRepo.findById(saleId);

    if (!sale) {
      throw new NotFoundError(input.sale_id, Sale);
    }

    // ✅ Validações de regras de negócio usando Notification
    const notification = new Notification();
    if (sale.sale_status !== SaleStatus.PENDING) {
      notification.addError('Cannot apply discount to a sale that is not pending', 'sale_status');
    }

    // ✅ Validação de regras de negócio específicas do desconto

    if (input.discount_percentage && input.discount_amount) {
      notification.addError('Cannot provide both discount_percentage and discount_amount', 'discount');
    }
    
    if (notification.hasErrors()) {
      throw new EntityValidationError(notification.toJSON());
    }

    // Aplicar desconto
    if (input.discount_percentage !== undefined) {
      const discountAmount = sale.total_amount * (input.discount_percentage / 100);
      sale.applyDiscount(discountAmount);
    } else if (input.discount_amount !== undefined) {
      sale.applyDiscount(input.discount_amount);
    }


    await this.saleRepo.update(sale);

    return SaleOutputMapper.toOutput(sale);
  }
}