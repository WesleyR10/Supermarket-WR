import { IsUUID, IsNotEmpty, validateSync } from 'class-validator';

export type GetOnlineOrderInputConstructorProps = {
  id: string;
  store_id: string;
};

export class GetOnlineOrderInput {
  @IsUUID('4')
  @IsNotEmpty()
  id: string;

  @IsUUID('4')
  @IsNotEmpty()
  store_id: string;

  constructor(props: GetOnlineOrderInputConstructorProps) {
    this.id = props.id;
    this.store_id = props.store_id;
  }
}

export class ValidateGetOnlineOrderInput {
  static validate(input: GetOnlineOrderInput) {
    return validateSync(input);
  }
}