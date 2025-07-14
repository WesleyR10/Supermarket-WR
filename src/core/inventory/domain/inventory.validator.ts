import { Min, Max, Matches, MaxLength } from 'class-validator';
import { Inventory } from './inventory.aggregate';
import { ClassValidatorFields } from '../../shared/domain/validators/class-validator-fields';
import { Notification } from '../../shared/domain/validators/notification';

export class InventoryRules {
  @Min(0, { groups: ['quantity'] })
  quantity: number;

  @Min(0, { groups: ['minimum_quantity'] })
  minimum_quantity: number;

  @Min(1, { groups: ['maximum_quantity'] })
  @Max(1000000, { groups: ['maximum_quantity'] })
  maximum_quantity: number;

  @Min(0.01, { groups: ['unit_cost'] })
  @Max(10000, { groups: ['unit_cost'] })
  unit_cost: number;

  @Min(0.01, { groups: ['unit_price'] })
  @Max(50000, { groups: ['unit_price'] })
  unit_price: number;

  @Matches(/^[A-Z0-9-]+$/, { groups: ['location_code'] })
  @MaxLength(20, { groups: ['location_code'] })
  location_code?: string | null;

  @Matches(/^[A-Z0-9-]+$/, { groups: ['batch_number'] })
  @MaxLength(50, { groups: ['batch_number'] })
  batch_number?: string | null;

  constructor(inventory: Inventory) {
    Object.assign(this, inventory);
  }
}

export class InventoryValidator extends ClassValidatorFields {
  validate(notification: Notification, data: any, fields?: string[]): boolean {
    const newFields = fields?.length ? fields : [
      'quantity',
      'minimum_quantity',
      'maximum_quantity',
      'unit_cost',
      'unit_price',
      'location_code',
      'batch_number'
    ];
    
    return super.validate(notification, new InventoryRules(data), newFields);
  }
}

export class InventoryValidatorFactory {
  static create(): InventoryValidator {
    return new InventoryValidator();
  }
} 