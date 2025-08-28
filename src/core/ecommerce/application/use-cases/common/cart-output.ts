import { Transform } from 'class-transformer';
import { Cart, CartStatus, CartItem } from '../../../domain/cart.aggregate';

export type CartItemOutput = {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
};

export type CartOutput = {
  cart_id: string;
  client_id: string;
  store_id: string;
  items: CartItemOutput[];
  status: CartStatus;
  subtotal: number;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
};

export class CartOutputMapper {
  static toOutput(entity: Cart): CartOutput {
    const { cart_id, client_id, store_id, items, status, subtotal, expires_at, created_at, updated_at } = entity.toJSON();
    
    return {
      cart_id,
      client_id,
      store_id,
      items: items.map((item: any) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        subtotal: item.subtotal
      })),
      status,
      subtotal,
      expires_at: new Date(expires_at),
      created_at: new Date(created_at),
      updated_at: new Date(updated_at)
    };
  }
}