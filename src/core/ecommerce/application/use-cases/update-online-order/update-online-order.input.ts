import { IsUUID, IsOptional, IsString, IsNotEmpty, IsDateString, validateSync, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOnlineOrderDeliveryAddressInput } from '../create-online-order/create-online-order.input';

export type UpdateOnlineOrderInputConstructorProps = {
  id: string;
  store_id: string;
  notes?: string;
  delivery_address?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zip_code: string;
    latitude?: number;
    longitude?: number;
  };
  estimated_delivery?: string;
};

export class UpdateOnlineOrderInput {
  @IsUUID('4')
  @IsNotEmpty()
  id: string;

  @IsUUID('4')
  @IsNotEmpty()
  store_id: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CreateOnlineOrderDeliveryAddressInput)
  delivery_address?: CreateOnlineOrderDeliveryAddressInput;

  @IsOptional()
  @IsDateString()
  estimated_delivery?: string;

  constructor(props: UpdateOnlineOrderInputConstructorProps) {
    this.id = props.id;
    this.store_id = props.store_id;
    this.notes = props.notes;
    this.delivery_address = props.delivery_address ? new CreateOnlineOrderDeliveryAddressInput(props.delivery_address) : undefined;
    this.estimated_delivery = props.estimated_delivery;
  }
}

export class ValidateUpdateOnlineOrderInput {
  static validate(input: UpdateOnlineOrderInput) {
     return validateSync(input);
  }
}