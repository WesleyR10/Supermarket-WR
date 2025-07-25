import {
  IsString,
  IsNotEmpty,
  validateSync,
} from 'class-validator';

export type ActivateInventoryInputConstructorProps = {
  inventory_item_id: string;
};

export class ActivateInventoryInput {
  @IsString()
  @IsNotEmpty()
  inventory_item_id: string;

  constructor(props: ActivateInventoryInputConstructorProps) {
    if (!props) return;
    this.inventory_item_id = props.inventory_item_id;
  }
}

export class ValidateActivateInventoryInput {
  static validate(input: ActivateInventoryInput) {
    return validateSync(input);
  }
}