import { IsString, IsNotEmpty, IsOptional, validateSync } from 'class-validator';

export type CancelSaleInputConstructorProps = {
  sale_id: string;
  reason?: string;
};

export class CancelSaleInput {
  @IsString()
  @IsNotEmpty()
  sale_id: string;

  @IsOptional()
  @IsString()
  reason?: string;

  constructor(props: CancelSaleInputConstructorProps) {
    if (!props) return;
    this.sale_id = props.sale_id;
    this.reason = props.reason;
  }
}

export class ValidateCancelSaleInput {
  static validate(input: CancelSaleInput) {
    return validateSync(input);
  }
}