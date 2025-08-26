import { IsEmail, IsNotEmpty, IsString, IsUUID, Length } from 'class-validator';

export type AuthenticateInputConstructorProps = {
  store_id: string;
  email: string;
  password: string;
};

export class AuthenticateInput {
  @IsUUID()
  @IsNotEmpty()
  store_id: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 255)
  password: string;

  constructor(props?: AuthenticateInputConstructorProps) {
    if (!props) return;
    this.store_id = props.store_id;
    this.email = props.email;
    this.password = props.password;
  }
}