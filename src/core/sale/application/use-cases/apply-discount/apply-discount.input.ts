import { IsString, IsNotEmpty, IsNumber, Min, Max, IsOptional, validateSync } from 'class-validator';

export type ApplyDiscountInputConstructorProps = {
  sale_id: string;
  discount_percentage?: number;
  discount_amount?: number;
  reason?: string;
};

export class ApplyDiscountInput {
  @IsString()
  @IsNotEmpty()
  sale_id: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discount_percentage?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discount_amount?: number;

  @IsOptional()
  @IsString()
  reason?: string;

  constructor(props: ApplyDiscountInputConstructorProps) {
    if (!props) return;
    this.sale_id = props.sale_id;
    this.discount_percentage = props.discount_percentage;
    this.discount_amount = props.discount_amount;
    this.reason = props.reason;
  }
}

export class ValidateApplyDiscountInput {
  static validate(input: ApplyDiscountInput) {
    return validateSync(input);
  }
}