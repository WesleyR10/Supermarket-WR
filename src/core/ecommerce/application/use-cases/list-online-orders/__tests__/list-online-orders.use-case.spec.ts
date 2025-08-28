import { ListOnlineOrdersUseCase } from '../list-online-orders.use-case';
import { OnlineOrderInMemoryRepository } from '../../../../infra/db/in-memory/online-order-in-memory.repository';
import { Price } from '@core/shared/domain/value-objects/price.vo';
import { OnlineOrderFakeBuilder } from '@core/ecommerce/domain/fake-builders/online-order-fake.builder';
import { OrderStatus } from '@core/ecommerce/domain/online-order.aggregate';
import { ListOnlineOrdersInput } from '../list-online-orders.input';
import { Uuid } from '@core/shared/domain/value-objects/uuid.vo';

describe('ListOnlineOrdersUseCase Unit Tests', () => {
  let useCase: ListOnlineOrdersUseCase;
  let repository: OnlineOrderInMemoryRepository;

  beforeEach(() => {
    repository = new OnlineOrderInMemoryRepository();
    useCase = new ListOnlineOrdersUseCase(repository);
  });

  it('should list orders with pagination', async () => {
    const orders = OnlineOrderFakeBuilder.theOnlineOrders(5)
      .withStoreId('store-123')
      .build();
    
    await repository.bulkInsert(orders);

    const input = new ListOnlineOrdersInput({
      store_id: 'store-123',
      page: 1,
      per_page: 3,
    });

    const output = await useCase.execute(input);

    expect(output.items).toHaveLength(3);
    expect(output.total).toBe(5);
    expect(output.current_page).toBe(1);
    expect(output.per_page).toBe(3);
    expect(output.last_page).toBe(2);
  });

  it('should list all orders when no pagination specified', async () => {
    const orders = OnlineOrderFakeBuilder.theOnlineOrders(3)
      .withStoreId('store-123')
      .build();
    
    await repository.bulkInsert(orders);

    const input = new ListOnlineOrdersInput({
      store_id: 'store-123',
    });

    const output = await useCase.execute(input);

    expect(output.items).toHaveLength(3);
    expect(output.total).toBe(3);
    expect(output.current_page).toBe(1);
    expect(output.per_page).toBe(15); // default
  });

  it('should filter by client_id', async () => {
    const clientId1 = new Uuid('550e8400-e29b-41d4-a716-446655440001');
    const clientId2 = new Uuid('550e8400-e29b-41d4-a716-446655440002');
    
    const client1Orders = OnlineOrderFakeBuilder.theOnlineOrders(2)
      .withStoreId('store-123')
      .withClientId(clientId1)
      .build();
    
    const client2Orders = OnlineOrderFakeBuilder.theOnlineOrders(3)
      .withStoreId('store-123')
      .withClientId(clientId2)
      .build();

    await repository.bulkInsert([...client1Orders, ...client2Orders]);

    const input = {
      store_id: 'store-123',
      client_id: clientId1.id,
    };

    const output = await useCase.execute(input);

    expect(output.items).toHaveLength(2);
    expect(output.items.every(item => item.client_id === clientId1.id)).toBe(true);
  });

  it('should filter by status', async () => {
    const pendingOrders = OnlineOrderFakeBuilder.theOnlineOrders(2)
      .withStoreId('store-123')
      .withStatus(OrderStatus.PENDING)
      .build();
    
    const confirmedOrders = OnlineOrderFakeBuilder.theOnlineOrders(3)
      .withStoreId('store-123')
      .withStatus(OrderStatus.CONFIRMED)
      .build();

    await repository.bulkInsert([...pendingOrders, ...confirmedOrders]);

    const input = {
      store_id: 'store-123',
      status: OrderStatus.PENDING,
    };

    const output = await useCase.execute(input);

    expect(output.items).toHaveLength(2);
    expect(output.items.every(item => item.status === OrderStatus.PENDING)).toBe(true);
  });

  it('should filter by client_id and status', async () => {
    const clientId1 = new Uuid('550e8400-e29b-41d4-a716-446655440001');
    const clientId2 = new Uuid('550e8400-e29b-41d4-a716-446655440002');
    
    const orders = [
      OnlineOrderFakeBuilder.theOnlineOrders(2)
        .withStoreId('store-123')
        .withClientId(clientId1)
        .withStatus(OrderStatus.PENDING)
        .build(),
      OnlineOrderFakeBuilder.theOnlineOrders(3)
        .withStoreId('store-123')
        .withClientId(clientId1)
        .withStatus(OrderStatus.CONFIRMED)
        .build(),
      OnlineOrderFakeBuilder.theOnlineOrders(1)
        .withStoreId('store-123')
        .withClientId(clientId2)
        .withStatus(OrderStatus.PENDING)
        .build(),
    ].flat();

    await repository.bulkInsert(orders);

    const input = {
      store_id: 'store-123',
      client_id: clientId1.id,
      status: OrderStatus.PENDING,
    };

    const output = await useCase.execute(input);

    expect(output.items).toHaveLength(2);
    expect(output.items.every(item => 
      item.client_id === clientId1.id && item.status === OrderStatus.PENDING
    )).toBe(true);
  });

  it('should sort by created_at desc by default', async () => {
    const order1 = OnlineOrderFakeBuilder.aOnlineOrder()
      .withStoreId('store-123')
      .withCreatedAt(new Date('2024-01-01'))
      .build();
    
    const order2 = OnlineOrderFakeBuilder.aOnlineOrder()
      .withStoreId('store-123')
      .withCreatedAt(new Date('2024-01-03'))
      .build();
    
    const order3 = OnlineOrderFakeBuilder.aOnlineOrder()
      .withStoreId('store-123')
      .withCreatedAt(new Date('2024-01-02'))
      .build();

    await repository.bulkInsert([order1, order2, order3]);

    const input = {
      store_id: 'store-123',
      sort: 'created_at',
      sort_dir: 'desc' as const,
    };

    const output = await useCase.execute(input);

    expect(output.items).toHaveLength(3);
    expect(output.items[0].created_at).toEqual(new Date('2024-01-03'));
    expect(output.items[1].created_at).toEqual(new Date('2024-01-02'));
    expect(output.items[2].created_at).toEqual(new Date('2024-01-01'));
  });

  it('should sort by total asc', async () => {
    const orders = [
      OnlineOrderFakeBuilder.aOnlineOrder()
        .withStoreId('store-123')
        .withTotal(new Price(50))
        .build(),
      OnlineOrderFakeBuilder.anOnlineOrder()
        .withStoreId('store-123')
        .withTotal(new Price(100))
        .build(),
      OnlineOrderFakeBuilder.anOnlineOrder()
        .withStoreId('store-123')
        .withTotal(new Price(200))
        .build(),
    ];

    await repository.bulkInsert(orders);

    const input = {
      store_id: 'store-123',
      sort: 'total',
      sort_dir: 'asc' as const,
    };

    const output = await useCase.execute(input);

    expect(output.items).toHaveLength(3);
    expect(output.items[0].total).toBe(50);
    expect(output.items[1].total).toBe(100);
    expect(output.items[2].total).toBe(200);
  });

  it('should return empty when no orders exist', async () => {
    const input = {
      store_id: 'store-123',
    };

    const output = await useCase.execute(input);

    expect(output.items).toHaveLength(0);
    expect(output.total).toBe(0);
    expect(output.current_page).toBe(1);
    expect(output.per_page).toBe(15);
    expect(output.last_page).toBe(0);
  });

  it('should not return orders from different stores', async () => {
    const store1Orders = OnlineOrderFakeBuilder.theOnlineOrders(2)
      .withStoreId('store-123')
      .build();
    
    const store2Orders = OnlineOrderFakeBuilder.theOnlineOrders(3)
      .withStoreId('store-456')
      .build();

    await repository.bulkInsert([...store1Orders, ...store2Orders]);

    const input = {
      store_id: 'store-123',
    };

    const output = await useCase.execute(input);

    expect(output.items).toHaveLength(2);
    expect(output.items.every(item => (item as any).store_id === 'store-123')).toBe(true);
  });

  it('should handle pagination correctly', async () => {
    const orders = OnlineOrderFakeBuilder.theOnlineOrders(10)
      .withStoreId('store-123')
      .build();
    
    await repository.bulkInsert(orders);

    const input = {
      store_id: 'store-123',
      page: 2,
      per_page: 3,
    };

    const output = await useCase.execute(input);

    expect(output.items).toHaveLength(3);
    expect(output.current_page).toBe(2);
    expect(output.per_page).toBe(3);
    expect(output.last_page).toBe(4);
    expect(output.total).toBe(10);
  });

  it('should handle invalid page numbers', async () => {
    const orders = OnlineOrderFakeBuilder.theOnlineOrders(5)
      .withStoreId('store-123')
      .build();
    
    await repository.bulkInsert(orders);

    const input = {
      store_id: 'store-123',
      page: 10,
      per_page: 3,
    };

    const output = await useCase.execute(input);

    expect(output.items).toHaveLength(0);
    expect(output.current_page).toBe(10);
    expect(output.last_page).toBe(2);
  });
});