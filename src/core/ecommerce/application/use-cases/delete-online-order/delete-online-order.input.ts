import { IsUUID, IsNotEmpty, validateSync } from 'class-validator';

export type DeleteOnlineOrderInputConstructorProps = {
  id: string;
  store_id: string;
};

export class DeleteOnlineOrderInput {
  @IsUUID('4')
  @IsNotEmpty()
  id: string;

  @IsUUID('4')
  @IsNotEmpty()
  store_id: string;

  constructor(props: DeleteOnlineOrderInputConstructorProps) {
    this.id = props.id;
    this.store_id = props.store_id;
  }
}

export class ValidateDeleteOnlineOrderInput {
  static validate(input: DeleteOnlineOrderInput) {
    return validateSync(input);
  }
}