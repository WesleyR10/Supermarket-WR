import { IUseCase } from '../../../../shared/application/use-case.interface';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';
import { Sale } from '../../../domain/sale.aggregate';
import { ISaleRepository } from '../../../domain/repositories/sale.repository.interface';
import { SaleOutput, SaleOutputMapper } from '../common/sale-output';
import { CreateSaleInput, ValidateCreateSaleInput } from './create-sale.input';

export class CreateSaleUseCase implements IUseCase<CreateSaleInput, SaleOutput> {
  constructor(private readonly saleRepository: ISaleRepository) {}

  async execute(input: CreateSaleInput): Promise<SaleOutput> {
    // ✅ Validar entrada usando class-validator
    const inputErrors = ValidateCreateSaleInput.validate(input);
    if (inputErrors.length > 0) {
      throw new EntityValidationError(inputErrors);
    }

    // ✅ Criar Sale usando método factory que aplica notification pattern
    const sale = Sale.create({
      customer_id: input.customer_id,
      cashier_id: input.cashier_id,
      store_id: input.store_id,
      register_number: input.register_number,
      items: input.items,
      payment_method: input.payment_method,
      discount_amount: input.discount_amount,
      tax_rate: input.tax_rate,
    });

    // ✅ Verificar erros de domínio usando notification pattern
    if (sale.notification.hasErrors()) {
      throw new EntityValidationError(sale.notification.toJSON());
    }

    // ✅ Persistir entidade
    await this.saleRepository.insert(sale);

    // ✅ Retornar output mapeado
    return SaleOutputMapper.toOutput(sale);
  }
}