import { IsNotEmpty, IsString, IsUUID, IsNumber, IsPositive, IsOptional, validateSync } from 'class-validator';

export class AddItemToCartInput {
  @IsUUID(4)
  @IsNotEmpty()
  cart_id: string;

  @IsUUID(4)
  @IsNotEmpty()
  product_id: string;

  @IsString()
  @IsOptional()
  product_name?: string;

  @IsNumber()
  @IsPositive()
  quantity: number;

  @IsNumber()
  @IsPositive()
  @IsOptional()
  unit_price?: number;

  constructor(props?: AddItemToCartInput) {
    if (!props) return;
    this.cart_id = props.cart_id;
    this.product_id = props.product_id;
    this.product_name = props.product_name;
    this.quantity = props.quantity;
    this.unit_price = props.unit_price;
  }
}

export class ValidateAddItemToCartInput {
  static validate(input: AddItemToCartInput) {
    return validateSync(input);
  }
}