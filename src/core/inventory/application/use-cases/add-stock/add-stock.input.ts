import {
  IsString,
  IsNotEmpty,
  IsNumber,
  validateSync,
  IsPositive,
} from 'class-validator';

export type AddStockInputConstructorProps = {
  inventory_item_id: string;
  quantity: number;
};

export class AddStockInput {
  @IsString()
  @IsNotEmpty()
  inventory_item_id: string;

  @IsNumber()
  @IsPositive()
  quantity: number;

  constructor(props: AddStockInputConstructorProps) {
    if (!props) return;
    this.inventory_item_id = props.inventory_item_id;
    this.quantity = props.quantity;
  }
}

export class ValidateAddStockInput {
  static validate(input: AddStockInput) {
    return validateSync(input);
  }
}