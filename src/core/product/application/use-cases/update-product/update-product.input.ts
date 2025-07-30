import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsEnum,
  validateSync,
} from 'class-validator';
import { UnitType } from '../../../domain/product.aggregate';

export type UpdateProductInputConstructorProps = {
  id: string;
  store_id: string; // ADICIONADO
  name?: string;
  description?: string | null;
  barcode?: string;
  price?: number;
  cost_price?: number | null;
  is_active?: boolean;
  brand?: string | null;
  unit_type?: UnitType;
  weight?: number | null;
  volume?: number | null;
  dimensions?: string | null;
  supplier_code?: string | null;
  ncm_code?: string | null;
  requires_weighing?: boolean;
};

export class UpdateProductInput {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString() // ADICIONADO
  @IsNotEmpty()
  store_id: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string | null;

  @IsString()
  @IsOptional()
  barcode?: string;

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsNumber()
  @IsOptional()
  cost_price?: number | null;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsString()
  @IsOptional()
  brand?: string | null;

  @IsEnum(UnitType)
  @IsOptional()
  unit_type?: UnitType;

  @IsNumber()
  @IsOptional()
  weight?: number | null;

  @IsNumber()
  @IsOptional()
  volume?: number | null;

  @IsString()
  @IsOptional()
  dimensions?: string | null;

  @IsString()
  @IsOptional()
  supplier_code?: string | null;

  @IsString()
  @IsOptional()
  ncm_code?: string | null;

  @IsBoolean()
  @IsOptional()
  requires_weighing?: boolean;

  constructor(props?: UpdateProductInputConstructorProps) {
    if (!props) return;
    this.id = props.id;
    this.store_id = props.store_id; // ADICIONADO
    this.name = props.name;
    this.description = props.description;
    this.barcode = props.barcode;
    this.price = props.price;
    this.cost_price = props.cost_price;
    this.is_active = props.is_active;
    this.brand = props.brand;
    this.unit_type = props.unit_type;
    this.weight = props.weight;
    this.volume = props.volume;
    this.dimensions = props.dimensions;
    this.supplier_code = props.supplier_code;
    this.ncm_code = props.ncm_code;
    this.requires_weighing = props.requires_weighing;
  }
}

export class ValidateUpdateProductInput {
  static validate(input: UpdateProductInput) {
    return validateSync(input);
  }
}