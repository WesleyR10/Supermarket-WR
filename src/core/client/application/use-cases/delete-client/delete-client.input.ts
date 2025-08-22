import { IsNotEmpty, IsUUID, validateSync } from 'class-validator';

export type DeleteClientInputConstructorProps = {
  id: string;
  stores_id: string;
};

export class DeleteClientInput {
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @IsUUID()
  @IsNotEmpty()
  stores_id: string;

  constructor(props?: DeleteClientInputConstructorProps) {
    if (!props) return;
    this.id = props.id;
    this.stores_id = props.stores_id;
  }
}

export class ValidateDeleteClientInput {
  static validate(input: DeleteClientInput) {
    return validateSync(input);
  }
}