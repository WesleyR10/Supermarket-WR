import { IsNotEmpty, IsUUID, validateSync } from 'class-validator';

export class RemoveItemFromCartInput {
  @IsUUID(4)
  @IsNotEmpty()
  cart_id: string;

  @IsUUID(4)
  @IsNotEmpty()
  product_id: string;

  constructor(props?: RemoveItemFromCartInput) {
    if (!props) return;
    this.cart_id = props.cart_id;
    this.product_id = props.product_id;
  }
}

export class ValidateRemoveItemFromCartInput {
  static validate(input: RemoveItemFromCartInput) {
    return validateSync(input);
  }
}