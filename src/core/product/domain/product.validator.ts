import { MinLength, MaxLength, Min, Max, Matches, IsNumber, IsString, IsNotEmpty, IsOptional, IsEnum, IsPositive } from 'class-validator';
import { ClassValidatorFields } from '../../shared/domain/validators/class-validator-fields';
import { Notification } from '../../shared/domain/validators/notification';
import { Product} from './product.aggregate';


enum UnitType {
  UNIT = 'unit',       // Unidade
  KG = 'kg',           // Quilograma
  LITER = 'liter',     // Litro
  PACK = 'pack',       // Pacote
  BOX = 'box',         // Caixa
  BOTTLE = 'bottle',   // Garrafa
  CAN = 'can',         // Lata
  TUBE = 'tube',       // Tubo
  METER = 'meter',     // Metro
  DOZEN = 'dozen',     // Dúzia
}

export class ProductRules {
  @IsString()
  @IsNotEmpty()
  category_id: string;

  @MinLength(2, { groups: ['name'] })
  @MaxLength(100, { groups: ['name'] })
  name: string;

  @MaxLength(500, { groups: ['description'] })
  description?: string | null;

  @IsString()
  @IsNotEmpty()
  barcode: string;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsNumber()
  @Min(0, { groups: ['cost_price'] })
  cost_price?: number | null;

  // Campos específicos do domínio de supermercado
  @MaxLength(50, { groups: ['brand'] })
  brand?: string | null;

  @IsEnum(UnitType, { groups: ['unit_type'] })
  unit_type?: UnitType;

  @IsNumber()
  @Min(0, { groups: ['weight'] })
  @Max(50000, { groups: ['weight'] }) // Máximo 50kg
  weight?: number | null;

  @IsNumber()
  @Min(0, { groups: ['volume'] })
  @Max(100000, { groups: ['volume'] }) // Máximo 100 litros
  volume?: number | null;

  @MaxLength(50, { groups: ['dimensions'] })
  dimensions?: string | null;

  @MaxLength(50, { groups: ['supplier_code'] })
  supplier_code?: string | null;

  @Matches(/^\d{8}$/, { groups: ['ncm_code'] })
  ncm_code?: string | null;

  constructor(product: Product) {
    Object.assign(this, product);
  }
}

export class ProductValidator extends ClassValidatorFields {
  validate(notification: Notification, data: any, fields?: string[]): boolean {
    const newFields = fields?.length ? fields : [
      'name',
      'description',
      'barcode',
      'price',
      'cost_price',
      'brand',
      'unit_type',
      'weight',
      'volume',
      'dimensions',
      'supplier_code',
      'ncm_code'
    ];
    
    return super.validate(notification, new ProductRules(data), newFields);
  }
}

export class ProductValidatorFactory {
  static create(): ProductValidator {
    return new ProductValidator();
  }
} 