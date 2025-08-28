import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';
import { OnlineOrder, OnlineOrderId } from '../../../../domain/online-order.aggregate';
import { OnlineOrderInMemoryRepository } from '../../../../infra/db/in-memory/online-order-in-memory.repository';
import { GetOnlineOrderUseCase } from '../get-online-order.use-case';
import { GetOnlineOrderInput } from '../get-online-order.input';
import { EntityValidationError } from '../../../../../shared/domain/validators/validation.error';

describe('GetOnlineOrderUseCase Unit Tests', () => {
  let useCase: GetOnlineOrderUseCase;
  let repository: OnlineOrderInMemoryRepository;

  beforeEach(() => {
    repository = new OnlineOrderInMemoryRepository();
    useCase = new GetOnlineOrderUseCase(repository);
  });

  it('should throw error when online order not found', async () => {
    const orderId = new OnlineOrderId();
    const input = new GetOnlineOrderInput({ id: orderId.id, store_id: 'test-store' });
    await expect(() => useCase.execute(input)).rejects.toThrow(
      new NotFoundError(orderId.id, OnlineOrder)
    );
  });

  it('should return an online order', async () => {
    const onlineOrder = OnlineOrder.fake().anOnlineOrder().build();
    repository.items = [onlineOrder];

    const input = new GetOnlineOrderInput({ id: onlineOrder.order_id.id, store_id: onlineOrder.store_id });
    const output = await useCase.execute(input);

    expect(output).toStrictEqual({
      order_id: onlineOrder.order_id.id,
      store_id: onlineOrder.store_id,
      client_id: onlineOrder.client_id.id,
      items: onlineOrder.items.map(item => ({
        product_id: item.product_id.id,
        product_name: item.product_name,
        quantity: item.quantity.value,
        unit_price: item.unit_price.value,
        subtotal: item.subtotal.value,
      })),
      status: onlineOrder.status,
      delivery_address: {
        street: onlineOrder.delivery_address.street,
        number: onlineOrder.delivery_address.number,
        complement: onlineOrder.delivery_address.complement,
        neighborhood: onlineOrder.delivery_address.neighborhood,
        city: onlineOrder.delivery_address.city,
        state: onlineOrder.delivery_address.state,
        zip_code: onlineOrder.delivery_address.zip_code,
        latitude: onlineOrder.delivery_address.latitude,
        longitude: onlineOrder.delivery_address.longitude,
      },
      subtotal: onlineOrder.subtotal.value,
      delivery_fee: onlineOrder.delivery_fee.value,
      total: onlineOrder.total.value,
      payment_method: onlineOrder.payment_method ? {
        type: onlineOrder.payment_method.type,
        details: onlineOrder.payment_method.details
      } : undefined,
      notes: onlineOrder.notes ?? null,
      estimated_delivery: onlineOrder.estimated_delivery,
      actual_delivery: onlineOrder.actual_delivery,
      created_at: onlineOrder.created_at,
      updated_at: onlineOrder.updated_at,
    });
  });
});
