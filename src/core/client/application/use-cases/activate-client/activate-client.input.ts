import { IsNotEmpty, IsUUID, validateSync } from 'class-validator';

export type ActivateClientInputConstructorProps = {
  id: string;
  store_id: string;
};

export class ActivateClientInput {
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @IsUUID()
  @IsNotEmpty()
  store_id: string;

  constructor(props?: ActivateClientInputConstructorProps) {
    if (!props) return;
    this.id = props.id;
    this.store_id = props.store_id;
  }
}

export class ValidateActivateClientInput {
  static validate(input: ActivateClientInput) {
    return validateSync(input);
  }
}