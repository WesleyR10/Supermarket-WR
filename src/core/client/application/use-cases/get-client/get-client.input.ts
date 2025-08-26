import { IsNotEmpty, IsUUID, validateSync } from 'class-validator';

export type GetClientInputConstructorProps = {
  id: string;
  store_id: string;
};

export class GetClientInput {
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @IsUUID()
  @IsNotEmpty()
  store_id: string;

  constructor(props?: GetClientInputConstructorProps) {
    if (!props) return;
    this.id = props.id;
    this.store_id = props.store_id;
  }
}

export class ValidateGetClientInput {
  static validate(input: GetClientInput) {
    return validateSync(input);
  }
}