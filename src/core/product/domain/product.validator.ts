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

  @IsString({ groups: ['barcode'] })
  @IsNotEmpty({ groups: ['barcode'] })
  barcode: string;

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
    const defaultFields = ['store_id', 'category_id', 'name', 'barcode', 'price'];
    
    // Só incluir cost_price na validação se ele estiver presente
    if (data.cost_price !== undefined && data.cost_price !== null) {
      defaultFields.push('cost_price');
    }
    
    const newFields = fields?.length ? fields : defaultFields;
    return super.validate(notification, new ProductRules(data), newFields);
  }
}

export class ProductValidatorFactory {
  static create(): ProductValidator {
    return new ProductValidator();
  }
}