import { IsNotEmpty, IsUUID, validateSync } from 'class-validator';

export type DeleteClientInputConstructorProps = {
  id: string;
  store_id: string;
};

export class DeleteClientInput {
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @IsUUID()
  @IsNotEmpty()
  store_id: string;

  constructor(props?: DeleteClientInputConstructorProps) {
    if (!props) return;
    this.id = props.id;
    this.store_id = props.store_id;
  }
}

export class ValidateDeleteClientInput {
  static validate(input: DeleteClientInput) {
    return validateSync(input);
  }
}