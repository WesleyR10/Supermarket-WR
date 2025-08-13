import { Min, Max, Matches, MaxLength, IsString, IsNotEmpty, ValidateIf } from 'class-validator';
import { Inventory } from './inventory.aggregate';
import { ClassValidatorFields } from '../../shared/domain/validators/class-validator-fields';
import { Notification } from '../../shared/domain/validators/notification';

export class InventoryRules {
  @IsString({ groups: ['store_id'] })
  @IsNotEmpty({ groups: ['store_id'] })
  store_id: string;
  
  @IsString({ groups: ['product_id'] })
  @IsNotEmpty({ groups: ['product_id'] })
  product_id: string;
  
  // Remover validações numéricas - os Value Objects já validam
  // @Min(0, { groups: ['quantity'] })
  // quantity: number;

  // @Min(0, { groups: ['min_stock'] })
  // min_stock: number;

  // @Min(1, { groups: ['max_stock'] })
  // @Max(1000000, { groups: ['max_stock'] })
  // max_stock: number;

  // @ValidateIf(o => o.cost_price !== null && o.cost_price !== undefined)
  // @Min(0.01, { groups: ['cost_price'] })
  // @Max(10000, { groups: ['cost_price'] })
  // cost_price: number | null;

  // Remover location - Value Object já valida
  // @Matches(/^[A-Z0-9-]+$/, { groups: ['location'] })
  // @MaxLength(20, { groups: ['location'] })
  // location?: string | null;

  // @ValidateIf((o) => o.batch_number !== null && o.batch_number !== undefined)
  // @IsString({ groups: ['batch_number'] })
  // @Matches(/^[A-Z0-9-]+$/, { groups: ['batch_number'] })
  // @MaxLength(50, { groups: ['batch_number'] })
  // batch_number?: string | null;

  constructor(inventory: Inventory) {
    Object.assign(this, inventory);
  }
}

export class InventoryValidator extends ClassValidatorFields {
  validate(notification: Notification, data: any, fields?: string[]): boolean {
    const newFields = fields?.length ? fields : [
      'store_id',
      'product_id',
      // Remover 'batch_number' - deixar ser validado condicionalmente via @ValidateIf
    ];
    
    const isValid = super.validate(notification, new InventoryRules(data), newFields);
    
    // Manter validação customizada (pois usa Value Objects já criados)
    if (data.min_stock && data.max_stock && data.min_stock.value >= data.max_stock.value) {
      notification.addError('min_stock must be less than max_stock', 'min_stock');
      return false;
    }
    
    return isValid;
  }
}

export class InventoryValidatorFactory {
  static create(): InventoryValidator {
    return new InventoryValidator();
  }
}