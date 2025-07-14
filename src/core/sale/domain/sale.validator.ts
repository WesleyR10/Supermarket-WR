import { Min, Max, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { Sale } from './sale.aggregate';
import { ClassValidatorFields } from '../../shared/domain/validators/class-validator-fields';
import { Notification } from '../../shared/domain/validators/notification';

export class SaleRules {
  @Min(0.01, { groups: ['total_amount'] })
  @Max(100000, { groups: ['total_amount'] })
  total_amount: number;

  @Min(0, { groups: ['discount_amount'] })
  discount_amount?: number;

  @Min(0, { groups: ['tax_amount'] })
  tax_amount?: number;

  @ArrayMinSize(1, { groups: ['items'] })
  @ArrayMaxSize(100, { groups: ['items'] })
  items: any[];

  @Min(1, { groups: ['register_number'] })
  @Max(100, { groups: ['register_number'] })
  register_number: number;

  constructor(sale: Sale) {
    Object.assign(this, sale);
  }
}

export class SaleValidator extends ClassValidatorFields {
  validate(notification: Notification, data: any, fields?: string[]): boolean {
    const newFields = fields?.length ? fields : [
      'total_amount',
      'discount_amount',
      'tax_amount',
      'items',
      'register_number'
    ];
    
    return super.validate(notification, new SaleRules(data), newFields);
  }
}

export class SaleValidatorFactory {
  static create(): SaleValidator {
    return new SaleValidator();
  }
} 