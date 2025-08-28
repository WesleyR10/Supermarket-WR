import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  validateSync,
  IsUUID,
  IsObject,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOnlineOrderItemInput {
  @IsUUID()
  @IsNotEmpty()
  product_id: string;

  @IsString()
  @IsNotEmpty()
  product_name: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  unit_price: number;

  constructor(props: {
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
  }) {
    Object.assign(this, props);
  }
}

export class CreateOnlineOrderDeliveryAddressInput {
  @IsString()
  @IsNotEmpty()
  street: string;

  @IsString()
  @IsNotEmpty()
  number: string;

  @IsString()
  @IsOptional()
  complement?: string;

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
  zip_code: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  constructor(props: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zip_code: string;
    latitude?: number;
    longitude?: number;
  }) {
    Object.assign(this, props);
  }
}

export class CreateOnlineOrderPaymentMethodInput {
  @IsString()
  @IsNotEmpty()
  type: string;

  @IsOptional()
  details?: any;

  constructor(props: {
    type: string;
    details?: any;
  }) {
    Object.assign(this, props);
  }
}

export type CreateOnlineOrderInputConstructorProps = {
  store_id: string;
  client_id: string;
  items: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
  }>;
  delivery_address: {
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
  delivery_fee: number;
  payment_method?: {
    type: string;
    details?: any;
  };
  notes?: string;
  estimated_delivery?: string;
};

export class CreateOnlineOrderInput {
  @IsUUID()
  @IsNotEmpty()
  store_id: string;

  @IsUUID()
  @IsNotEmpty()
  client_id: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOnlineOrderItemInput)
  items: CreateOnlineOrderItemInput[];

  @IsObject()
  @ValidateNested()
  @Type(() => CreateOnlineOrderDeliveryAddressInput)
  delivery_address: CreateOnlineOrderDeliveryAddressInput;

  @IsNumber()
  delivery_fee: number;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CreateOnlineOrderPaymentMethodInput)
  payment_method?: CreateOnlineOrderPaymentMethodInput;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  estimated_delivery?: string;

  constructor(props: CreateOnlineOrderInputConstructorProps) {
    this.store_id = props.store_id;
    this.client_id = props.client_id;
    this.items = props.items.map(item => new CreateOnlineOrderItemInput(item));
    this.delivery_address = new CreateOnlineOrderDeliveryAddressInput(props.delivery_address);
    this.delivery_fee = props.delivery_fee;
    this.payment_method = props.payment_method ? new CreateOnlineOrderPaymentMethodInput(props.payment_method) : undefined;
    this.notes = props.notes;
    this.estimated_delivery = props.estimated_delivery;
  }
}

export class ValidateCreateOnlineOrderInput {
  static validate(input: CreateOnlineOrderInput) {
   return validateSync(input);
  }
}
