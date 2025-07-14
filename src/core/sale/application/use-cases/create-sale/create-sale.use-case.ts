import { IUseCase } from '../../../../shared/application/use-case.interface';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';
import { FieldsErrors } from '../../../../shared/domain/validators/validator-fields-interface';
import { Sale } from '../../../domain/sale.aggregate';
import { ISaleRepository } from '../../../domain/repositories/sale.repository.interface';
import { CreateSaleInput } from './create-sale.input';
import { CreateSaleOutput } from './create-sale.output';

export class CreateSaleUseCase
  implements IUseCase<CreateSaleInput, CreateSaleOutput>
{
  constructor(private readonly saleRepo: ISaleRepository) {}

  async execute(input: CreateSaleInput): Promise<CreateSaleOutput> {
    // Validações de sintaxe e formato (Use Case responsibility)
    this.validateInput(input);

    // Criação da entidade (Domain responsibility)
    const entity = Sale.create(input);

    // Validações de domínio específicas do supermercado
    this.validateBusinessRules(entity);

    if (entity.notification.hasErrors()) {
      const errors = this.convertNotificationToFieldsErrors(entity.notification.toJSON());
      throw new EntityValidationError([errors]);
    }

    // Persistência
    await this.saleRepo.insert(entity);

    return this.toOutput(entity);
  }

  private convertNotificationToFieldsErrors(
    notificationErrors: Array<string | { [key: string]: string[] }>
  ): FieldsErrors {
    const fieldsErrors: FieldsErrors = {};

    notificationErrors.forEach((error) => {
      if (typeof error === 'string') {
        if (!fieldsErrors['_general']) {
          fieldsErrors['_general'] = [];
        }
        fieldsErrors['_general'].push(error);
      } else {
        Object.entries(error).forEach(([field, messages]) => {
          if (!fieldsErrors[field]) {
            fieldsErrors[field] = [];
          }
          fieldsErrors[field].push(...messages);
        });
      }
    });

    return fieldsErrors;
  }

  private validateInput(input: CreateSaleInput): void {
    const errors: string[] = [];

    // Validações de sintaxe (formato, tipos, etc.)
    if (!input.cashier_id || typeof input.cashier_id !== 'string') {
      errors.push('Cashier ID is required and must be a string');
    }

    if (!input.store_id || typeof input.store_id !== 'string') {
      errors.push('Store ID is required and must be a string');
    }

    if (typeof input.total_amount !== 'number' || input.total_amount <= 0) {
      errors.push('Total amount must be a positive number');
    }

    if (input.discount_amount !== undefined) {
      if (typeof input.discount_amount !== 'number') {
        errors.push('Discount amount must be a number');
      } else if (input.discount_amount < 0) {
        errors.push('Discount amount cannot be negative');
      } else if (input.discount_amount > input.total_amount) {
        errors.push('Discount amount cannot exceed total amount');
      }
    }

    if (input.tax_amount !== undefined) {
      if (typeof input.tax_amount !== 'number') {
        errors.push('Tax amount must be a number');
      } else if (input.tax_amount < 0) {
        errors.push('Tax amount cannot be negative');
      }
    }

    if (!input.payment_method || !Object.values(Sale.PaymentMethod).includes(input.payment_method)) {
      errors.push('Payment method is required and must be valid');
    }

    if (!input.sale_status || !Object.values(Sale.SaleStatus).includes(input.sale_status)) {
      errors.push('Sale status is required and must be valid');
    }

    if (!input.items || !Array.isArray(input.items) || input.items.length === 0) {
      errors.push('Items are required and must be a non-empty array');
    }

    if (typeof input.register_number !== 'number' || input.register_number <= 0) {
      errors.push('Register number must be a positive number');
    }

    if (input.register_number > 100) {
      errors.push('Register number cannot exceed 100');
    }

    if (!input.sale_date || !(input.sale_date instanceof Date)) {
      errors.push('Sale date is required and must be a valid date');
    }

    // Validar itens da venda
    if (input.items) {
      input.items.forEach((item, index) => {
        if (!item.product_id || typeof item.product_id !== 'string') {
          errors.push(`Item ${index + 1}: Product ID is required and must be a string`);
        }

        if (typeof item.quantity !== 'number' || item.quantity <= 0) {
          errors.push(`Item ${index + 1}: Quantity must be a positive number`);
        }

        if (typeof item.unit_price !== 'number' || item.unit_price <= 0) {
          errors.push(`Item ${index + 1}: Unit price must be a positive number`);
        }

        if (item.discount_percentage !== undefined) {
          if (typeof item.discount_percentage !== 'number') {
            errors.push(`Item ${index + 1}: Discount percentage must be a number`);
          } else if (item.discount_percentage < 0 || item.discount_percentage > 100) {
            errors.push(`Item ${index + 1}: Discount percentage must be between 0 and 100`);
          }
        }
      });
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
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

    const tolerance = 0.01; // Tolerância de 1 centavo para diferenças de arredondamento
    if (Math.abs(calculatedTotal - entity.total_amount) > tolerance) {
      entity.notification.addError(
        'Total amount does not match calculated total from items',
        'total_amount'
      );
    }

    // Regra: Verificar se o imposto está correto (ICMS brasileiro)
    const expectedTax = entity.calculateICMSTax();
    if (Math.abs(expectedTax - entity.tax_amount) > tolerance) {
      entity.notification.addError(
        'Tax amount does not match expected ICMS calculation',
        'tax_amount'
      );
    }
  }

  private toOutput(entity: Sale): CreateSaleOutput {
    return {
      id: entity.sale_id.id,
      customer_id: entity.customer_id,
      cashier_id: entity.cashier_id,
      total_amount: entity.total_amount,
      discount_amount: entity.discount_amount,
      tax_amount: entity.tax_amount,
      payment_method: entity.payment_method,
      sale_status: entity.sale_status,
      items: entity.items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_percentage: item.discount_percentage,
        total_price: item.total_price,
      })),
      store_id: entity.store_id,
      register_number: entity.register_number,
      sale_date: entity.sale_date,
      created_at: entity.created_at,
    };
  }
} 