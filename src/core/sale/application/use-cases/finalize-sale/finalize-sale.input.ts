import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, Min, validateSync } from 'class-validator';
import { PaymentMethod } from '../../../domain/sale.aggregate';

export type FinalizeSaleInputConstructorProps = {
  sale_id: string;
  store_id: string;
  payment_method?: PaymentMethod;
  received_amount?: number;
};

export class FinalizeSaleInput {
  @IsString()
  @IsNotEmpty()
  sale_id: string;

  @IsString()
  @IsNotEmpty()
  store_id: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  payment_method?: PaymentMethod;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  received_amount?: number;

  constructor(props: FinalizeSaleInputConstructorProps) {
    if (!props) return;
    this.sale_id = props.sale_id;
    this.store_id = props.store_id;
    this.payment_method = props.payment_method;
    this.received_amount = props.received_amount;
  }
}

export class ValidateFinalizeSaleInput {
  static validate(input: FinalizeSaleInput) {
    return validateSync(input);
  }
}