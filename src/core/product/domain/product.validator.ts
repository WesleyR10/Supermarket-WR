import { MinLength, MaxLength, Min, IsPositive, IsNotEmpty, IsString } from 'class-validator';
import { ClassValidatorFields } from '../../shared/domain/validators/class-validator-fields';
import { Notification } from '../../shared/domain/validators/notification';
import { Product } from './product.aggregate';

export class ProductRules {
  @IsString({ groups: ['store_id'] })
  @IsNotEmpty({ groups: ['store_id'] })
  store_id: string;

  @IsString({ groups: ['category_id'] })
  @IsNotEmpty({ groups: ['category_id'] })
  category_id: string;

  @MinLength(2, { groups: ['name'] })
  @MaxLength(100, { groups: ['name'] })
  name: string;

  @IsPositive({ groups: ['price'] })
  price: number;

  @Min(0, { groups: ['cost_price'] })
  cost_price?: number | null;

  // Seguindo padrão do address.validator.ts - sem decorators
  unit_type?: string;
  
  @Min(0, { groups: ['weight'] })
  weight?: number | null;

  @Min(0, { groups: ['volume'] })
  volume?: number | null;

  @MaxLength(20, { groups: ['ncm_code'] })
  ncm_code?: string | null;

  constructor(product: Product) {
    Object.assign(this, product);
  }
}

export class ProductValidator extends ClassValidatorFields {
  validate(notification: Notification, data: any, fields?: string[]): boolean {
    const requiredFields = ['store_id', 'category_id', 'name', 'price'];
        
    if (data.cost_price !== undefined && data.cost_price !== null) {
      requiredFields.push('cost_price');
    }
    
    // Garantir que campos obrigatórios sempre sejam validados
    const fieldsToValidate = fields?.length 
      ? [...new Set([...requiredFields, ...fields])] // Merge sem duplicatas
      : requiredFields;
    
    return super.validate(notification, new ProductRules(data), fieldsToValidate);
  }
}

export class ProductValidatorFactory {
  static create(): ProductValidator {
    return new ProductValidator();
  }
}