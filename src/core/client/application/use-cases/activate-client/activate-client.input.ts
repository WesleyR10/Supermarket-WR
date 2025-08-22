import { IsNotEmpty, IsUUID, validateSync } from 'class-validator';

export type ActivateClientInputConstructorProps = {
  id: string;
  stores_id: string;
};

export class ActivateClientInput {
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @IsUUID()
  @IsNotEmpty()
  stores_id: string;

  constructor(props?: ActivateClientInputConstructorProps) {
    if (!props) return;
    this.id = props.id;
    this.stores_id = props.stores_id;
  }
}

export class ValidateActivateClientInput {
  static validate(input: ActivateClientInput) {
    return validateSync(input);
  }
}