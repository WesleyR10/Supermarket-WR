import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsDate,
  validateSync,
} from 'class-validator';

export type CreateInventoryInputConstructorProps = {
  product_id: string;
  store_id: string;
  quantity: number;
  min_stock: number;
  max_stock: number;
  unit_cost: number;
  unit_price: number;
  supplier_id?: string | null;
  location_code?: string | null;
  expiry_date?: Date | null;
  batch_number?: string | null;
  is_active?: boolean;
};

export class CreateInventoryInput {
  @IsString()
  @IsNotEmpty()
  product_id: string;

  @IsString()
  @IsNotEmpty()
  store_id: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  min_stock: number;

  @IsNumber()
  max_stock: number;

  @IsNumber()
  unit_cost: number;

  @IsNumber()
  unit_price: number;

  @IsString()
  @IsOptional()
  supplier_id?: string | null;

  @IsString()
  @IsOptional()
  location_code?: string | null;

  @IsDate()
  @IsOptional()
  expiry_date?: Date | null;

  @IsString()
  @IsOptional()
  batch_number?: string | null;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  constructor(props: CreateInventoryInputConstructorProps) {
    if (!props) return;
    this.product_id = props.product_id;
    this.store_id = props.store_id;
    this.quantity = props.quantity;
    this.min_stock = props.min_stock;
    this.max_stock = props.max_stock;
    this.unit_cost = props.unit_cost;
    this.unit_price = props.unit_price;
    this.supplier_id = props.supplier_id;
    this.location_code = props.location_code;
    this.expiry_date = props.expiry_date;
    this.batch_number = props.batch_number;
    this.is_active = props.is_active;
  }
}

export class ValidateCreateInventoryInput {
  static validate(input: CreateInventoryInput) {
    return validateSync(input);
  }
} 