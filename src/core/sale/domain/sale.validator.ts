import { Min, Max, ArrayMinSize, ArrayMaxSize, ValidateNested, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { Sale } from './sale.aggregate';
import { ClassValidatorFields } from '../../shared/domain/validators/class-validator-fields';
import { Notification } from '../../shared/domain/validators/notification';

// ✅ Simplificar SaleItemRules - remover constructor complexo
export class SaleItemRules {
  @Min(0.01, { groups: ['quantity'] })
  @Max(1000, { groups: ['quantity'] })
  quantity: number;

  @Min(0.01, { groups: ['unit_price'] })
  @Max(10000, { groups: ['unit_price'] })
  unit_price: number;

  @Min(0, { groups: ['discount_percentage'] })
  @Max(100, { groups: ['discount_percentage'] })
  discount_percentage: number;

  // ✅ Constructor simples sem Object.assign
  constructor(quantity: number, unit_price: number, discount_percentage: number) {
    this.quantity = quantity;
    this.unit_price = unit_price;
    this.discount_percentage = discount_percentage;
  }
}

enum PaymentMethod {
  CASH = 'cash',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  PIX = 'pix',
  BANK_TRANSFER = 'bank_transfer',
  FOOD_VOUCHER = 'food_voucher',
  MEAL_VOUCHER = 'meal_voucher'
}

export class SaleRules {
  @IsNotEmpty({ groups: ['store_id'] })
  @IsString({ groups: ['store_id'] })
  store_id: string;

  @IsNotEmpty({ groups: ['cashier_id'] })
  @IsString({ groups: ['cashier_id'] })
  cashier_id: string;

  @Min(0, { groups: ['total_amount'] })
  @Max(100000, { groups: ['total_amount'] })
  total_amount: number;

  @Min(0, { groups: ['discount_amount'] })
  discount_amount?: number;

  @Min(0, { groups: ['tax_amount'] })
  @Max(100000, { groups: ['tax_amount'] })
  tax_amount?: number;

  @Min(0, { groups: ['tax_rate'] })
  @Max(100, { groups: ['tax_rate'] })
  tax_rate?: number;

  @IsEnum(PaymentMethod, { groups: ['payment_method'] })
  payment_method: PaymentMethod;

  @ArrayMinSize(0, { groups: ['items'] })
  @ArrayMaxSize(100, { groups: ['items'] })
  items: any[];

  @Min(1, { groups: ['register_number'] })
  @Max(100, { groups: ['register_number'] })
  register_number: number;

  constructor(sale: Sale) {
    this.store_id = sale.store_id;
    this.cashier_id = sale.cashier_id;
    this.total_amount = sale.total_amount;
    this.discount_amount = sale.discount_amount;
    this.tax_amount = sale.tax_amount;
    this.tax_rate = sale.tax_rate;
    this.payment_method = sale.payment_method;
    this.register_number = sale.register_number;
    this.items = sale.items || [];
  }
}

export class SaleValidator extends ClassValidatorFields {
  validate(notification: Notification, data: any, fields?: string[]): boolean {
    const newFields = fields?.length ? fields : [
      'store_id',
      'cashier_id',
      'total_amount',
      'discount_amount',
      'tax_amount',
      'payment_method',
      'items',
      'register_number'
    ];
    
    if (fields?.includes('items') && data.items) {
      for (const item of data.items) {
        if (!item.product_id || String(item.product_id).trim() === '') {
          notification.addError('product_id should not be empty', 'items');
        }
        if (item.quantity <= 0) {
          notification.addError('quantity must be greater than 0', 'items');
        }
        if (item.unit_price <= 0) {
          notification.addError('unit_price must be greater than 0', 'items');
        }
        if (item.discount_percentage < 0 || item.discount_percentage > 100) {
          notification.addError('discount_percentage must be between 0 and 100', 'items');
        }
      }
    }
    
    return super.validate(notification, new SaleRules(data), newFields);
  }
}

export class SaleValidatorFactory {
  static create(): SaleValidator {
    return new SaleValidator();
  }
}