import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
  IsArray,
  IsDate,
  ValidateNested,
  validateSync,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod, SaleStatus } from '../../../domain/sale.aggregate';

export class SaleItemInput {
  @IsString()
  @IsNotEmpty()
  product_id: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  unit_price: number;

  @IsNumber()
  @IsOptional()
  discount_percentage?: number;
}

export type CreateSaleInputConstructorProps = {
  customer_id?: string | null;
  cashier_id: string;
  store_id: string;
  register_number: number;
  items: SaleItemInput[];
  payment_method: PaymentMethod;
  discount_amount?: number;
};

export class CreateSaleInput {
  @IsString()
  @IsOptional()
  customer_id?: string | null;

  @IsString()
  @IsNotEmpty()
  cashier_id: string;

  @IsString()
  @IsNotEmpty()
  store_id: string;

  @IsNumber()
  register_number: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemInput)
  items: SaleItemInput[];

  @IsEnum(PaymentMethod)
  payment_method: PaymentMethod;

  @IsNumber()
  @IsOptional()
  discount_amount?: number;

  constructor(props: CreateSaleInputConstructorProps) {
    if (!props) return;
    this.customer_id = props.customer_id;
    this.cashier_id = props.cashier_id;
    this.store_id = props.store_id;
    this.register_number = props.register_number;
    this.items = props.items;
    this.payment_method = props.payment_method;
    this.discount_amount = props.discount_amount;
  }
}

export class ValidateCreateSaleInput {
  static validate(input: CreateSaleInput) {
    return validateSync(input);
  }
} 