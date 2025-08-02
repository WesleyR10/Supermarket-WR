import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsEnum,
  IsUUID,
  validateSync,
} from 'class-validator';
import { UnitType } from '../../../domain/product.aggregate';

export type CreateProductInputConstructorProps = {
  store_id: string;
  category_id: string;
  name: string;
  barcode?: string | null; 
  price: number;
  description?: string | null;
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

export class CreateProductInput {
  @IsUUID()
  @IsNotEmpty()
  store_id: string;

  @IsString()
  @IsNotEmpty()
  category_id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string | null;

  @IsString()
  @IsOptional() 
  barcode?: string | null;

  @IsNumber()
  price: number;

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

  constructor(props?: CreateProductInputConstructorProps) {
    if (!props) return;
    this.store_id = props.store_id; 
    this.category_id = props.category_id;
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

export class ValidateCreateProductInput {
  static validate(input: CreateProductInput) {
    return validateSync(input);
  }
}