import { IsString, IsNotEmpty, IsNumber, IsPositive, validateSync } from 'class-validator';
import { ClassValidatorFields } from '../../../../shared/domain/validators/class-validator-fields';

export type UpdateUnitPriceInputConstructorProps = {
  inventory_item_id: string;
  unit_price: number;
};

export class UpdateUnitPriceInput {
  @IsString()
  @IsNotEmpty()
  inventory_item_id: string;

  @IsNumber()
  @IsPositive()
  unit_price: number;

  constructor(props: UpdateUnitPriceInputConstructorProps) {
    if (!props) return;
    this.inventory_item_id = props.inventory_item_id;
    this.unit_price = props.unit_price;
  }
}

export class ValidateUpdateUnitPriceInput {
  static validate(input: UpdateUnitPriceInput) {
    return validateSync(input);
  }
} 