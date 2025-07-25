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
    props.name !== undefined && (this.name = props.name);
    props.description !== undefined && (this.description = props.description);
    props.barcode !== undefined && (this.barcode = props.barcode);
    props.price !== undefined && (this.price = props.price);
    props.cost_price !== undefined && (this.cost_price = props.cost_price);
    props.is_active !== undefined && (this.is_active = props.is_active);
    props.brand !== undefined && (this.brand = props.brand);
    props.unit_type !== undefined && (this.unit_type = props.unit_type);
    props.weight !== undefined && (this.weight = props.weight);
    props.volume !== undefined && (this.volume = props.volume);
    props.dimensions !== undefined && (this.dimensions = props.dimensions);
    props.supplier_code !== undefined && (this.supplier_code = props.supplier_code);
    props.ncm_code !== undefined && (this.ncm_code = props.ncm_code);
    props.requires_weighing !== undefined && (this.requires_weighing = props.requires_weighing);
  }
}

export class ValidateUpdateProductInput {
  static validate(input: UpdateProductInput) {
    return validateSync(input);
  }
}