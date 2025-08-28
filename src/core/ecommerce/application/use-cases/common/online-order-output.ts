import { OnlineOrder, OrderStatus } from '../../../domain/online-order.aggregate';

export type OnlineOrderOutput = {
  order_id: string;
  store_id: string;
  client_id: string;
  items: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }>;
  status: OrderStatus;
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
  subtotal: number;
  delivery_fee: number;
  total: number;
  payment_method?: {
    type: string;
    details?: Record<string, any>;
  };
  notes?: string | null;
  estimated_delivery?: Date | null;
  actual_delivery?: Date | null;
  created_at: Date;
  updated_at: Date;
};

export class OnlineOrderOutputMapper {
  static toOutput(entity: OnlineOrder): OnlineOrderOutput {
    return {
      order_id: entity.order_id.id,
      store_id: entity.store_id,
      client_id: entity.client_id.id,
      items: entity.items.map(item => ({
        product_id: item.product_id.id,
        product_name: item.product_name,
        quantity: item.quantity.value,
        unit_price: item.unit_price.value,
        subtotal: item.subtotal.value
      })),
      status: entity.status,
      delivery_address: {
        street: entity.delivery_address.street,
        number: entity.delivery_address.number,
        complement: entity.delivery_address.complement,
        neighborhood: entity.delivery_address.neighborhood,
        city: entity.delivery_address.city,
        state: entity.delivery_address.state,
        zip_code: entity.delivery_address.zip_code,
        latitude: entity.delivery_address.latitude,
        longitude: entity.delivery_address.longitude
      },
      subtotal: entity.subtotal.value,
      delivery_fee: entity.delivery_fee.value,
      total: entity.total.value,
      payment_method: entity.payment_method ? {
        type: entity.payment_method.type,
        details: entity.payment_method.details
      } : undefined,
      notes: entity.notes,
      estimated_delivery: entity.estimated_delivery,
      actual_delivery: entity.actual_delivery,
      created_at: entity.created_at,
      updated_at: entity.updated_at
    };
  }
}
