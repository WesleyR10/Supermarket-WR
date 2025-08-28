import { UpdateOnlineOrderUseCase } from '../update-online-order.use-case';
import { OnlineOrderInMemoryRepository } from '../../../../infra/db/in-memory/online-order-in-memory.repository';
import { OnlineOrderFakeBuilder } from '@core/ecommerce/domain/fake-builders/online-order-fake.builder';
import { NotFoundError } from '@core/shared/domain/errors/not-found.error';
import { UpdateOnlineOrderInput } from '../update-online-order.input';
import { OnlineOrder } from '@core/ecommerce/domain/online-order.aggregate';
import { Uuid } from '@core/shared/domain/value-objects/uuid.vo';

describe('UpdateOnlineOrderUseCase Unit Tests', () => {
  let useCase: UpdateOnlineOrderUseCase;
  let repository: OnlineOrderInMemoryRepository;

  beforeEach(() => {
    repository = new OnlineOrderInMemoryRepository();
    useCase = new UpdateOnlineOrderUseCase(repository);
  });

  it('should update an existing order', async () => {
    const order = OnlineOrderFakeBuilder.aOnlineOrder()
      .withStoreId('store-123')

      .build();
    
    await repository.insert(order);

    const input = new UpdateOnlineOrderInput({
      id: order.order_id.id,
      store_id: 'store-123',
      notes: 'Updated notes',
      delivery_address: {
        street: 'Updated Street',
        number: '456',
        complement: 'Updated complement',
        neighborhood: 'Updated neighborhood',
        city: 'Updated city',
        state: 'RJ',
        zip_code: '98765-432',
        latitude: -22.9068,
        longitude: -43.1729,
      },
      estimated_delivery: '2025-12-31T00:00:00.000Z',
    });

    try {
      const output = await useCase.execute(input);
    } catch (error) {
      console.log('Validation errors:', JSON.stringify(error.error, null, 2));
      console.log('Order data:', {
        client_id: order.client_id.id,
        store_id: order.store_id,
        subtotal: order.subtotal.value,
        delivery_fee: order.delivery_fee.value,
        total: order.total.value,
        items_length: order.items.length
      });
      throw error;
    }
    const output = await useCase.execute(input);

    expect(output).toMatchObject({
      order_id: order.order_id.id,
      store_id: 'store-123',
      notes: 'Updated notes',
      delivery_address: {
        street: 'Updated Street',
        number: '456',
        complement: 'Updated complement',
        neighborhood: 'Updated neighborhood',
        city: 'Updated city',
        state: 'RJ',
        zip_code: '98765432',
        latitude: -22.9068,
        longitude: -43.1729,
      },
      estimated_delivery: expect.any(Date),
      updated_at: expect.any(Date),
    });

    const updatedOrder = await repository.findById(order.order_id);
    expect(updatedOrder?.notes).toBe('Updated notes');
  });

  it('should update only notes', async () => {
    const order = OnlineOrderFakeBuilder.aOnlineOrder()
      .withStoreId('store-123')
      .build();
    
    await repository.insert(order);

    const input: UpdateOnlineOrderInput = {
      id: order.order_id.id,
      store_id: 'store-123',
      notes: 'Only notes updated',
    };

    const output = await useCase.execute(input);

    expect(output.notes).toBe('Only notes updated');
    expect(output.delivery_address).toEqual(order.delivery_address);
    expect(output.estimated_delivery).toEqual(order.estimated_delivery);
  });

  it('should update only delivery address', async () => {
    const order = OnlineOrderFakeBuilder.aOnlineOrder()
      .withStoreId('store-123')
      .build();
    
    await repository.insert(order);

    const input: UpdateOnlineOrderInput = {
      id: order.order_id.id,
      store_id: 'store-123',
      delivery_address: {
        street: 'Only address updated',
        number: '789',
        neighborhood: 'Only neighborhood',
        city: 'Only city',
        state: 'MG',
        zip_code: '12345-678',
        latitude: -19.9167,
        longitude: -43.9345,
      },
    };

    const output = await useCase.execute(input);

    expect(output.delivery_address.street).toBe('Only address updated');
    expect(output.notes).toEqual(order.notes);
    expect(output.estimated_delivery).toEqual(order.estimated_delivery);
  });

  it('should update only estimated delivery', async () => {
    const order = OnlineOrderFakeBuilder.aOnlineOrder()
      .withStoreId('store-123')
      .build();
    
    await repository.insert(order);

    const newDate = '2025-12-15T10:00:00Z';
    const input: UpdateOnlineOrderInput = {
        id: order.order_id.id,
        store_id: 'store-123',
        estimated_delivery: newDate,
      };

    try {
      const output = await useCase.execute(input);
    } catch (error) {
      console.log('Validation errors:', JSON.stringify(error.error, null, 2));
      console.log('Order data:', {
        client_id: order.client_id.id,
        store_id: order.store_id,
        subtotal: order.subtotal.value,
        delivery_fee: order.delivery_fee.value,
        total: order.total.value,
        items_length: order.items.length,
        estimated_delivery: newDate
      });
      throw error;
    }
    const output = await useCase.execute(input);

    expect(output.estimated_delivery).toEqual(expect.any(Date));
    expect(output.notes).toEqual(order.notes);
    expect(output.delivery_address).toEqual(order.delivery_address);
  });

  it('should throw error when order does not exist', async () => {
    const input: UpdateOnlineOrderInput = {
        id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        store_id: 'store-123',
        notes: 'Updated notes',
      };

    await expect(useCase.execute(input)).rejects.toThrow(
      new NotFoundError('f47ac10b-58cc-4372-a567-0e02b2c3d479', OnlineOrder)
    );
  });

  it('should throw error when order belongs to different store', async () => {
    const order = OnlineOrderFakeBuilder.aOnlineOrder()
      .withStoreId('store-456')
      .build();
    
    await repository.insert(order);

    const input: UpdateOnlineOrderInput = {
        id: order.order_id.id,
        store_id: 'store-123',
        notes: 'Updated notes',
      };

    await expect(useCase.execute(input)).rejects.toThrow(
      'Entity Validation Error'
    );
  });

  it('should not change other fields when updating', async () => {
    const clientId = new Uuid('123e4567-e89b-12d3-a456-426614174000');
    const order = OnlineOrderFakeBuilder.anOnlineOrder()
      .withStoreId('store-123')
      .withClientId(clientId)
      .build();
    
    await repository.insert(order);

    const input: UpdateOnlineOrderInput = {
        id: order.order_id.id,
        store_id: 'store-123',
        notes: 'Updated notes',
      };

    const output = await useCase.execute(input);

    expect(output.client_id).toBe(clientId.id);
    expect(output.items).toEqual(order.items.map(item => ({
      product_id: item.product_id.id,
      product_name: item.product_name,
      quantity: item.quantity.value,
      unit_price: item.unit_price.value,
      subtotal: item.subtotal.value,
    })));
    expect(output.status).toBe(order.status);
    if (order.payment_method) {
      expect(output.payment_method).toEqual({
        type: order.payment_method.type,
        details: order.payment_method.details
      });
    } else {
      expect(output.payment_method).toBeUndefined();
    }
  });

  it('should handle empty optional fields', async () => {
    const order = OnlineOrderFakeBuilder.anOnlineOrder()
      .withStoreId('store-123')
      .build();
    
    await repository.insert(order);

    const input: UpdateOnlineOrderInput = {
      id: order.order_id.id,
      store_id: 'store-123',
    };

    const output = await useCase.execute(input);

    expect(output.notes).toBeNull();
    expect(output.estimated_delivery).toBeNull();
  });
});