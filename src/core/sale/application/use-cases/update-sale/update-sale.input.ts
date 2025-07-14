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
import { PaymentMethod, SaleStatus } from '../../../domain/sale.aggregate';

export class SaleItemUpdateInput {
  @IsString()
  @IsNotEmpty()
  product_id: string;

  @IsNumber()
  @IsOptional()
  quantity?: number;

  @IsNumber()
  @IsOptional()
  unit_price?: number;

  @IsNumber()
  @IsOptional()
  discount_percentage?: number;
}

export type UpdateSaleInputConstructorProps = {
  id: string;
  customer_id?: string | null;
  cashier_id?: string;
  store_id?: string;
  register_number?: number;
  items?: SaleItemUpdateInput[];
  payment_method?: PaymentMethod;
  sale_status?: SaleStatus;
  discount_amount?: number;
};

export class UpdateSaleInput {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsOptional()
  customer_id?: string | null;

  @IsString()
  @IsOptional()
  cashier_id?: string;

  @IsString()
  @IsOptional()
  store_id?: string;

  @IsNumber()
  @IsOptional()
  register_number?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemUpdateInput)
  @IsOptional()
  items?: SaleItemUpdateInput[];

  @IsEnum(PaymentMethod)
  @IsOptional()
  payment_method?: PaymentMethod;

  @IsEnum(SaleStatus)
  @IsOptional()
  sale_status?: SaleStatus;

  @IsNumber()
  @IsOptional()
  discount_amount?: number;

  constructor(props: UpdateSaleInputConstructorProps) {
    if (!props) return;
    this.id = props.id;
    this.customer_id = props.customer_id;
    this.cashier_id = props.cashier_id;
    this.store_id = props.store_id;
    this.register_number = props.register_number;
    this.items = props.items;
    this.payment_method = props.payment_method;
    this.sale_status = props.sale_status;
    this.discount_amount = props.discount_amount;
  }
}

export class ValidateUpdateSaleInput {
  static validate(input: UpdateSaleInput) {
    return validateSync(input);
  }
} 