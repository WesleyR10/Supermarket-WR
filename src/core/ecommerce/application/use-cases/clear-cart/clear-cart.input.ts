import { IsNotEmpty, IsUUID, validateSync } from 'class-validator';

export class ClearCartInput {
  @IsUUID(4)
  @IsNotEmpty()
  cart_id: string;

  constructor(props?: ClearCartInput) {
    if (!props) return;
    this.cart_id = props.cart_id;
  }
}

export class ValidateClearCartInput {
  static validate(input: ClearCartInput) {
    return validateSync(input);
  }
}