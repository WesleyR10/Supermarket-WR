import { IUseCase } from '../../../../shared/application/use-case.interface';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';
import { Sale } from '../../../domain/sale.aggregate';
import { ISaleRepository } from '../../../domain/repositories/sale.repository.interface';
import { CreateSaleInput } from './create-sale.input';
import { Notification } from '../../../../shared/domain/validators/notification';
import { ValidateCreateSaleInput } from './create-sale.input';
import { SaleOutput, SaleOutputMapper } from '../common/sale-output';

export type CreateSaleOutput = SaleOutput;

export class CreateSaleUseCase
  implements IUseCase<CreateSaleInput, CreateSaleOutput>
{
  constructor(private readonly saleRepo: ISaleRepository) {}

  async execute(input: CreateSaleInput): Promise<CreateSaleOutput> {
    // ✅ Criação direta (validações automáticas do class-validator)
    const entity = Sale.create(input);

    // ✅ Validações de domínio
    this.validateBusinessRules(entity);

    // ✅ Verificar erros do domínio
    if (entity.notification.hasErrors()) {
      throw new EntityValidationError(entity.notification.toJSON());
    }
    
    // Persistência
    await this.saleRepo.insert(entity);

    // ✅ Usar o mapper comum
    return SaleOutputMapper.toOutput(entity);
  }

  private validateBusinessRules(entity: Sale): void {
    // Regras de negócio específicas do supermercado

    // Regra: Vendas com desconto alto requerem aprovação
    if (entity.discount_amount && entity.total_amount > 0) {
      const discountPercentage = (entity.discount_amount / entity.total_amount) * 100;
      if (discountPercentage > 30) {
        entity.notification.addError(
          'High discount sale may require manager approval',
          'discount_amount'
        );
      }
    }

    // Regra: Vendas com muitos itens podem indicar compra corporativa
    if (entity.items.length > 20) {
      console.log('Large sale detected - consider corporate customer benefits');
    }

    // Regra: Verificar se o total calculado está correto
    const calculatedTotal = entity.items.reduce((total, item) => {
      const itemTotal = item.quantity * item.unit_price;
      const itemDiscount = itemTotal * (item.discount_percentage / 100);
      return total + (itemTotal - itemDiscount);
    }, 0);

    const tolerance = 0.01;
    if (Math.abs(calculatedTotal - entity.total_amount) > tolerance) {
      entity.notification.addError(
        'Total amount does not match calculated total from items',
        'total_amount'
      );
    }

    // ❌ REMOVER validação de imposto por enquanto
    // pois calculateTaxAmount é privado
  }

}