import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  validateSync,
} from 'class-validator';

export type UpdateUnitCostInputConstructorProps = {
  inventory_item_id: string;
  unit_cost: number;
};

export class UpdateUnitCostInput {
  @IsString()
  @IsNotEmpty()
  inventory_item_id: string;

  @IsNumber()
  @IsPositive()
  unit_cost: number;

  constructor(props: UpdateUnitCostInputConstructorProps) {
    if (!props) return;
    this.inventory_item_id = props.inventory_item_id;
    this.unit_cost = props.unit_cost;
  }
}

export class ValidateUpdateUnitCostInput {
  static validate(input: UpdateUnitCostInput) {
    return validateSync(input);
  }
}