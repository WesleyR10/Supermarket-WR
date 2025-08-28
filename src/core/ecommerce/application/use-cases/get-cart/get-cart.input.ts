import { IsNotEmpty, IsUUID, validateSync } from 'class-validator';

export class GetCartInput {
  @IsUUID(4)
  @IsNotEmpty()
  cart_id: string;

  constructor(props?: GetCartInput) {
    if (!props) return;
    this.cart_id = props.cart_id;
  }
}

export class ValidateGetCartInput {
  static validate(input: GetCartInput) {
    return validateSync(input);
  }
}