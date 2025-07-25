import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  validateSync,
} from 'class-validator';

export type RemoveStockInputConstructorProps = {
  inventory_item_id: string;
  quantity: number;
};

export class RemoveStockInput {
  @IsString()
  @IsNotEmpty()
  inventory_item_id: string;

  @IsNumber()
  @IsPositive()
  quantity: number;

  constructor(props: RemoveStockInputConstructorProps) {
    if (!props) return;
    this.inventory_item_id = props.inventory_item_id;
    this.quantity = props.quantity;
  }
}

export class ValidateRemoveStockInput {
  static validate(input: RemoveStockInput) {
    return validateSync(input);
  }
}