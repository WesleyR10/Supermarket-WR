import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export type ChangePasswordInputConstructorProps = {
  id: string;
  store_id: string;
  current_password: string;
  new_password: string;
};

export class ChangePasswordInput {
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @IsUUID()
  @IsNotEmpty()
  store_id: string;

  @IsString()
  @IsNotEmpty()
  current_password: string;

  @IsString()
  @IsNotEmpty()
  new_password: string;

  constructor(props?: ChangePasswordInputConstructorProps) {
    if (!props) return;
    this.id = props.id;
    this.store_id = props.store_id;
    this.current_password = props.current_password;
    this.new_password = props.new_password;
  }
}