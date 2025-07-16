import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  Max,
  validateSync,
  IsUUID,
} from 'class-validator';

export type AddItemToSaleInputConstructorProps = {
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  discount_percentage?: number;
};

export class AddItemToSaleInput {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  sale_id: string;

  @IsString()
  @IsNotEmpty()
  @IsUUID() 
  product_id: string;

  @IsNumber()
  @Min(0.01)
  quantity: number;

  @IsNumber()
  @Min(0.01)
  unit_price: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  discount_percentage?: number;

  constructor(props: AddItemToSaleInputConstructorProps) {
    if (!props) return;
    this.sale_id = props.sale_id;
    this.product_id = props.product_id;
    this.quantity = props.quantity;
    this.unit_price = props.unit_price;
    this.discount_percentage = props.discount_percentage;
  }
}

export class ValidateAddItemToSaleInput {
  static validate(input: AddItemToSaleInput) {
    return validateSync(input);
  }
}