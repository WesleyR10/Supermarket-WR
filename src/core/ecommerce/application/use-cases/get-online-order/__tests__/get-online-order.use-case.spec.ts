import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';
import { OnlineOrder, OnlineOrderId } from '../../../../domain/online-order.aggregate';
import { OnlineOrderInMemoryRepository } from '../../../../domain/repositories/online-order-in-memory.repository';
import { GetOnlineOrderUseCase } from '../get-online-order.use-case';

describe('GetOnlineOrderUseCase Unit Tests', () => {
  let useCase: GetOnlineOrderUseCase;
  let repository: OnlineOrderInMemoryRepository;

  beforeEach(() => {
    repository = new OnlineOrderInMemoryRepository();
    useCase = new GetOnlineOrderUseCase(repository);
  });

  it('should throw error when online order not found', async () => {
    const orderId = new OnlineOrderId();
    await expect(() => useCase.execute({ id: orderId.id })).rejects.toThrow(
      new NotFoundError(orderId.id, OnlineOrder)
    );
  });

  it('should return an online order', async () => {
    const onlineOrder = OnlineOrder.fake().anOnlineOrder().build();
    repository.items = [onlineOrder];

    const output = await useCase.execute({ id: onlineOrder.order_id.id });

    expect(output).toStrictEqual({
      id: onlineOrder.order_id.id,
      client_id: onlineOrder.client_id.id,
      items: onlineOrder.items.map(item => ({
        product_id: item.product_id.id,
        quantity: item.quantity.value,
        unit_price: item.unit_price.value,
        total: item.total.value,
      })),
      total_amount: onlineOrder.total_amount.value,
      status: onlineOrder.status,
      delivery_address: onlineOrder.delivery_address,
      delivery_fee: onlineOrder.delivery_fee.value,
      payment_method: onlineOrder.payment_method.value,
      created_at: onlineOrder.created_at,
      updated_at: onlineOrder.updated_at,
    });
  });
});
