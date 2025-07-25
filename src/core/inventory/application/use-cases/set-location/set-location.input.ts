import {
  IsString,
  IsNotEmpty,
  validateSync,
} from 'class-validator';

export type SetLocationInputConstructorProps = {
  inventory_item_id: string;
  location_code: string;
};

export class SetLocationInput {
  @IsString()
  @IsNotEmpty()
  inventory_item_id: string;

  @IsString()
  @IsNotEmpty()
  location_code: string;

  constructor(props: SetLocationInputConstructorProps) {
    if (!props) return;
    this.inventory_item_id = props.inventory_item_id;
    this.location_code = props.location_code;
  }
}

export class ValidateSetLocationInput {
  static validate(input: SetLocationInput) {
    return validateSync(input);
  }
}