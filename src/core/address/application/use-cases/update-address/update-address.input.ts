import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsEnum,
  validateSync,
} from 'class-validator';
import { AddressType, AddressStatus } from '../../../domain/address.aggregate';

export type UpdateAddressInputConstructorProps = {
  id: string;
  client_id?: string | null;
  store_id?: string | null;
  supplier_id?: string | null;

  street?: string;
  number?: string;
  complement?: string | null;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  
  address_type?: AddressType;
  is_primary?: boolean;
  status?: AddressStatus;
};

export class UpdateAddressInput {
  @IsString()
  @IsNotEmpty()
  id: string;

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
  @IsOptional()
  street?: string;

  @IsString()
  @IsOptional()
  number?: string;

  @IsString()
  @IsOptional()
  complement?: string | null;

  @IsString()
  @IsOptional()
  neighborhood?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  zipcode?: string;

  @IsEnum(AddressType)
  @IsOptional()
  address_type?: AddressType;

  @IsBoolean()
  @IsOptional()
  is_primary?: boolean;

  @IsEnum(AddressStatus)
  @IsOptional()
  status?: AddressStatus;

  constructor(props?: UpdateAddressInputConstructorProps) {
    if (!props) return;
    this.id = props.id;
    props.client_id !== undefined && (this.client_id = props.client_id);
    props.store_id !== undefined && (this.store_id = props.store_id);
    props.supplier_id !== undefined && (this.supplier_id = props.supplier_id);
    props.street && (this.street = props.street);
    props.number && (this.number = props.number);
    props.complement !== undefined && (this.complement = props.complement);
    props.neighborhood && (this.neighborhood = props.neighborhood);
    props.city && (this.city = props.city);
    props.state && (this.state = props.state);
    props.zipcode && (this.zipcode = props.zipcode);
    props.address_type && (this.address_type = props.address_type);
    props.is_primary !== null &&
      props.is_primary !== undefined &&
      (this.is_primary = props.is_primary);
    props.status && (this.status = props.status);
  }
}

export class ValidateUpdateAddressInput {
  static validate(input: UpdateAddressInput) {
    return validateSync(input);
  }
} 