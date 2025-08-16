import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
  IsArray,
  ValidateNested,
  validateSync,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../../../domain/sale.aggregate';

export class SaleItemUpdateInput {
  @IsString()
  @IsNotEmpty()
  product_id: string;

  @IsNumber({ maxDecimalPlaces: 3, allowInfinity: false, allowNaN: false })
  @Type(() => Number)
  @IsOptional()
  quantity?: number;

  @IsNumber({ maxDecimalPlaces: 2, allowInfinity: false, allowNaN: false })
  @Type(() => Number)
  @IsOptional()
  unit_price?: number;

  @IsNumber({ maxDecimalPlaces: 2, allowInfinity: false, allowNaN: false })
  @IsOptional()
  @Type(() => Number)
  discount_percentage?: number;
}

export type UpdateSaleInputConstructorProps = {
  id: string;
  store_id: string;
  customer_id?: string | null;
  cashier_id?: string;
  register_number?: number;
  items?: SaleItemUpdateInput[];
  payment_method?: PaymentMethod;
  discount_amount?: number;
};

export class UpdateSaleInput {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  store_id: string;

  @IsString()
  @IsOptional()
  customer_id?: string | null;

  @IsString()
  @IsOptional()
  cashier_id?: string;

  @IsNumber({ allowInfinity: false, allowNaN: false })
  @IsOptional()
  @Type(() => Number)
  register_number?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemUpdateInput)
  @IsOptional()
  items?: SaleItemUpdateInput[];

  @IsEnum(PaymentMethod)
  @IsOptional()
  payment_method?: PaymentMethod;

  @IsNumber({ maxDecimalPlaces: 2, allowInfinity: false, allowNaN: false })
  @IsOptional()
  @Type(() => Number)
  discount_amount?: number;

  constructor(props: UpdateSaleInputConstructorProps) {
    if (!props) return;
    this.id = props.id;
    this.store_id = props.store_id;
    this.customer_id = props.customer_id;
    this.cashier_id = props.cashier_id;
    this.register_number = props.register_number;
    this.items = props.items;
    this.payment_method = props.payment_method;
    this.discount_amount = props.discount_amount;
  }
}

export class ValidateUpdateSaleInput {
  static validate(input: UpdateSaleInput) {
    return validateSync(input);
  }
}