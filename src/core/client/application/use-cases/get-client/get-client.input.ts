import { IsNotEmpty, IsUUID, validateSync } from 'class-validator';

export type GetClientInputConstructorProps = {
  id: string;
  stores_id: string;
};

export class GetClientInput {
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @IsUUID()
  @IsNotEmpty()
  stores_id: string;

  constructor(props?: GetClientInputConstructorProps) {
    if (!props) return;
    this.id = props.id;
    this.stores_id = props.stores_id;
  }
}

export class ValidateGetClientInput {
  static validate(input: GetClientInput) {
    return validateSync(input);
  }
}