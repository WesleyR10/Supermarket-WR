import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsEnum,
  validateSync,
} from 'class-validator';
import { AddressType } from '../../../domain/address.aggregate';

export type CreateAddressInputConstructorProps = {
  client_id?: string | null;
  store_id?: string | null;
  supplier_id?: string | null;
  street: string;
  number: string;
  complement?: string | null;
  neighborhood: string;
  city: string;
  state: string;
  zipcode: string;
  label?: string | null;
  address_type: AddressType;
  is_primary?: boolean;
};

export class CreateAddressInput {
  @IsString()
  @IsOptional()
  client_id?: string | null;

  @IsString()
  @IsOptional()
  store_id?: string | null;

  @IsString()
  @IsOptional()
  supplier_id?: string | null;

  @IsString()
  @IsNotEmpty()
  street: string;

  @IsString()
  @IsNotEmpty()
  number: string;

  @IsString()
  @IsOptional()
  complement?: string | null;

  @IsString()
  @IsNotEmpty()
  neighborhood: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  state: string;

  @IsString()
  @IsNotEmpty()
  zipcode: string;

  @IsString()
  @IsOptional()
  label?: string | null;

  @IsEnum(AddressType)
  @IsNotEmpty()
  address_type: AddressType;

  @IsBoolean()
  @IsOptional()
  is_primary?: boolean;

  constructor(props: CreateAddressInputConstructorProps) {
    if (!props) return;
    this.client_id = props.client_id;
    this.store_id = props.store_id;
    this.supplier_id = props.supplier_id;
    this.street = props.street;
    this.number = props.number;
    this.complement = props.complement;
    this.neighborhood = props.neighborhood;
    this.city = props.city;
    this.state = props.state;
    this.zipcode = props.zipcode;
    this.label = props.label;
    this.address_type = props.address_type;
    this.is_primary = props.is_primary;
  }
}

export class ValidateCreateAddressInput {
  static validate(input: CreateAddressInput) {
    return validateSync(input);
  }
} 