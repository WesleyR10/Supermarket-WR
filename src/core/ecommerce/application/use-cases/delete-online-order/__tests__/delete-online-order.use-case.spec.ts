import { DeleteOnlineOrderUseCase } from '../delete-online-order.use-case';
import { OnlineOrderInMemoryRepository } from '../../../../infra/db/in-memory/online-order-in-memory.repository';
import { NotFoundError } from '@core/shared/domain/errors/not-found.error';
import { DeleteOnlineOrderInput } from '../delete-online-order.input';
import { OnlineOrder } from '@core/ecommerce/domain/online-order.aggregate';
import { OrderStatus } from '@core/ecommerce/domain/online-order.aggregate';
import { OnlineOrderFakeBuilder } from '@core/ecommerce/domain';

describe('DeleteOnlineOrderUseCase Unit Tests', () => {
  let useCase: DeleteOnlineOrderUseCase;
  let repository: OnlineOrderInMemoryRepository;

  beforeEach(() => {
    repository = new OnlineOrderInMemoryRepository();
    useCase = new DeleteOnlineOrderUseCase(repository);
  });

  it('should delete an existing order', async () => {
    const order = OnlineOrderFakeBuilder.anOnlineOrder()
      .withStoreId('store-123')
      .build();
    
    await repository.insert(order);

    const input = new DeleteOnlineOrderInput({
      id: order.order_id.id,
      store_id: 'store-123',
    });

    await useCase.execute(input);

    const deletedOrder = await repository.findById(order.order_id);
    expect(deletedOrder).toBeNull();
    expect(repository.items).toHaveLength(0);
  });

  it('should throw error when order does not exist', async () => {
    const input = new DeleteOnlineOrderInput({
      id: '550e8400-e29b-41d4-a716-446655440001',
      store_id: 'store-123',
    });

    await expect(useCase.execute(input)).rejects.toThrow(
      new NotFoundError(['550e8400-e29b-41d4-a716-446655440001'], OnlineOrder)
    );
  });

  it('should throw error when order belongs to different store', async () => {
    const order = OnlineOrderFakeBuilder.anOnlineOrder()
      .withStoreId('store-456')
      .build();
    
    await repository.insert(order);

    const input: DeleteOnlineOrderInput = {
      id: order.order_id.id,
      store_id: 'store-123',
    };

    await expect(useCase.execute(input)).rejects.toThrow(
      new NotFoundError([order.order_id.id], OnlineOrder)
    );
  });

  it('should delete order and maintain others', async () => {
    const order1 = OnlineOrderFakeBuilder.anOnlineOrder()
      .withStoreId('store-123')
      .build();
    
    const order2 = OnlineOrderFakeBuilder.anOnlineOrder()
      .withStoreId('store-123')
      .build();

    await repository.bulkInsert([order1, order2]);

    const input: DeleteOnlineOrderInput = {
      id: order1.order_id.id,
      store_id: 'store-123',
    };

    await useCase.execute(input);

    expect(repository.items).toHaveLength(1);
    expect(repository.items[0].order_id.id).toBe(order2.order_id.id);
  });

  it('should handle deletion of non-existent order gracefully', async () => {
    const order = OnlineOrderFakeBuilder.anOnlineOrder()
      .withStoreId('store-123')
      .build();
    
    await repository.insert(order);

    const input: DeleteOnlineOrderInput = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      store_id: 'store-123',
    };

    await expect(useCase.execute(input)).rejects.toThrow(
      new NotFoundError(['550e8400-e29b-41d4-a716-446655440000'], OnlineOrder)
    );
    expect(repository.items).toHaveLength(1); // Should still have the original order
  });

  it('should delete orders with different statuses', async () => {
    const orders = [
      OnlineOrderFakeBuilder.anOnlineOrder()
        .withStoreId('store-123')
        .withStatus(OrderStatus.PENDING)
        .build(),
      OnlineOrderFakeBuilder.anOnlineOrder()
        .withStoreId('store-123')
        .withStatus(OrderStatus.CONFIRMED)
        .build(),
      OnlineOrderFakeBuilder.anOnlineOrder()
        .withStoreId('store-123')
        .withStatus(OrderStatus.DELIVERED)
        .build(),
    ];

    await repository.bulkInsert(orders);

    const input: DeleteOnlineOrderInput = {
      id: orders[1].order_id.id,
      store_id: 'store-123',
    };

    await useCase.execute(input);

    expect(repository.items).toHaveLength(2);
    expect(repository.items.some(item => item.order_id.id === orders[1].order_id.id)).toBe(false);
  });

  it('should not delete orders from other stores', async () => {
    const store1Order = OnlineOrderFakeBuilder.anOnlineOrder()
      .withStoreId('store-123')
      .build();
    
    const store2Order = OnlineOrderFakeBuilder.anOnlineOrder()
      .withStoreId('store-456')
      .build();

    await repository.bulkInsert([store1Order, store2Order]);

    const input: DeleteOnlineOrderInput = {
      id: store2Order.order_id.id,
      store_id: 'store-123',
    };

    await expect(useCase.execute(input)).rejects.toThrow(
      new NotFoundError([store2Order.order_id.id], OnlineOrder)
    );
    expect(repository.items).toHaveLength(2); // Both orders should still exist
  });
});