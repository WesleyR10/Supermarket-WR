import { IUseCase } from '../../../../shared/application/use-case.interface';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { OnlineOrder, OnlineOrderId, OrderStatus, DeliveryAddress } from '../../../domain/online-order.aggregate';
import { IOnlineOrderRepository } from '../../../domain/online-order.repository';

export type GetOnlineOrderInput = {
  id: string;
};

export type GetOnlineOrderOutput = {
  id: string;
  client_id: string;
  items: Array<{
    product_id: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }>;
  total: number;
  status: OrderStatus;
  delivery_address: DeliveryAddress;
  delivery_fee: number;
  payment_method: string | undefined;
  created_at: Date;
  updated_at: Date;
};

export class GetOnlineOrderUseCase implements IUseCase<GetOnlineOrderInput, GetOnlineOrderOutput> {
  constructor(private onlineOrderRepository: IOnlineOrderRepository) {}

  async execute(input: GetOnlineOrderInput): Promise<GetOnlineOrderOutput> {
    const orderId = new OnlineOrderId(input.id);
    const onlineOrder = await this.onlineOrderRepository.findById(orderId);

    if (!onlineOrder) {
      throw new NotFoundError(input.id, OnlineOrder);
    }

    return {
      id: onlineOrder.order_id.id,
      client_id: onlineOrder.client_id.id,
      items: onlineOrder.items.map((item) => ({
        product_id: item.product_id.id,
        quantity: item.quantity.value,
        unit_price: item.unit_price.value,
        subtotal: item.subtotal.value,
      })),
      total: onlineOrder.total.value,
      status: onlineOrder.status,
      delivery_address: onlineOrder.delivery_address,
      delivery_fee: onlineOrder.delivery_fee.value,
      payment_method: onlineOrder.payment_method?.toString(),
      created_at: onlineOrder.created_at,
      updated_at: onlineOrder.updated_at,
    };
  }
}
