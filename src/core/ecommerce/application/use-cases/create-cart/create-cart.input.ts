import { IsNotEmpty, IsString, IsUUID, IsOptional, IsDateString, validateSync } from 'class-validator';

export class CreateCartInput {
  @IsUUID(4)
  @IsNotEmpty()
  client_id: string;

  @IsString()
  @IsNotEmpty()
  store_id: string;

  @IsOptional()
  @IsDateString()
  expires_at?: string;

  constructor(props?: CreateCartInput) {
    if (!props) return;
    this.client_id = props.client_id;
    this.store_id = props.store_id;
    this.expires_at = props.expires_at;
  }
}

export class ValidateCreateCartInput {
  static validate(input: CreateCartInput) {
    return validateSync(input);
  }
}