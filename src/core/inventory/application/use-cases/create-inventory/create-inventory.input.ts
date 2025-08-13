import { IsString, IsNotEmpty, IsNumber, IsOptional, IsDate, IsBoolean, validateSync } from 'class-validator';

export type CreateInventoryInputConstructorProps = {
  store_id: string;
  product_id: string;
  quantity: number;
  min_stock: number;
  max_stock: number;
  location?: string | null;
  expiry_date?: Date | null;
  batch_number?: string | null;
  supplier_id?: string | null;
  cost_price?: number | null;
  is_active?: boolean;
};

export class CreateInventoryInput {
  @IsString() @IsNotEmpty() store_id: string;
  @IsString() @IsNotEmpty() product_id: string;
  @IsNumber() quantity: number;
  @IsNumber() min_stock: number;
  @IsNumber() max_stock: number;
  @IsOptional() @IsString() location?: string | null;
  @IsOptional() @IsDate() expiry_date?: Date | null;
  @IsOptional() @IsString() batch_number?: string | null;
  @IsOptional() @IsString() supplier_id?: string | null;
  @IsOptional() @IsNumber() cost_price?: number | null;
  @IsOptional() @IsBoolean() is_active?: boolean;

  constructor(props: CreateInventoryInputConstructorProps) {
    Object.assign(this, props);
  }
}

export class ValidateCreateInventoryInput {
  static validate(input: CreateInventoryInput) {
    return validateSync(input);
  }
}