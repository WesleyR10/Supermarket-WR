import { IsArray, IsDate, IsEnum, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ClassValidatorFields } from '../../shared/domain/validators/class-validator-fields';
import { Cart, CartStatus, CartItem } from './cart.aggregate';
import { Notification } from '../../shared/domain/validators/notification';

export class CartRules {
  @IsString()
  @IsNotEmpty()
  cart_id: string;

  @IsString()
  @IsNotEmpty()
  client_id: string;

  @IsString()
  @IsNotEmpty()
  store_id: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemRules)
  items: CartItemRules[];

  @IsEnum(CartStatus)
  status: CartStatus;

  @IsDate()
  expires_at: Date;

  @IsDate()
  created_at: Date;

  @IsDate()
  updated_at: Date;

  constructor({
    cart_id,
    client_id,
    store_id,
    items,
    status,
    expires_at,
    created_at,
    updated_at
  }: Cart) {
    Object.assign(this, {
      cart_id: cart_id?.value,
      client_id: client_id?.value,
      store_id,
      items: items?.map(item => new CartItemRules(item)) || [],
      status,
      expires_at,
      created_at,
      updated_at
    });
  }
}

export class CartItemRules {
  @IsString()
  @IsNotEmpty()
  product_id: string;

  @IsString()
  @IsNotEmpty()
  product_name: string;

  constructor(item: CartItem) {
    Object.assign(this, {
      product_id: item.product_id?.value,
      product_name: item.product_name
    });
  }
}

export class CartValidator extends ClassValidatorFields<CartRules> {
  validate(notification: Notification, data: any, fields?: string[]): boolean {
    const newFields = fields?.length ? fields : ['cart_id', 'client_id', 'store_id', 'items', 'status', 'expires_at', 'created_at', 'updated_at'];
    return super.validate(notification, new CartRules(data), newFields);
  }
}

export class CartValidatorFactory {
  static create() {
    return new CartValidator();
  }
}