import { OnlineOrder, OrderStatus } from '../../../domain/online-order.aggregate';
import { OnlineOrderOutputMapper } from './online-order-output';
import { ProductId } from '@core/product/domain/product.aggregate';
import { ClientId } from '@core/client/domain/client.aggregate';

describe('OnlineOrderOutputMapper Unit Tests', () => {
  it('should convert an online order to output', () => {
    const entity = OnlineOrder.create({
      store_id: 'store-123',
      client_id: new ClientId().id,
      items: [
        {
          product_id: new ProductId().id,
          product_name: 'Arroz Branco 5kg',
          quantity: 2,
          unit_price: 12.99
        },
        {
          product_id: new ProductId().id,
          product_name: 'Feijão Preto 1kg',
          quantity: 1,
          unit_price: 8.50
        }
      ],
      delivery_address: {
        street: 'Rua das Flores',
        number: '123',
        complement: 'Apto 45',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zip_code: '01234567',
        latitude: -23.5505,
        longitude: -46.6333
      },
      delivery_fee: 5.99,
      payment_method: {
        type: 'CREDIT_CARD',
        details: { brand: 'visa', last_digits: '1234' }
      },
      notes: 'Entregar no portão',
      estimated_delivery: new Date('2024-01-15T14:30:00Z')
    });
    
    const output = OnlineOrderOutputMapper.toOutput(entity);
    expect(output).toStrictEqual({
      order_id: entity.order_id.id,
      store_id: 'store-123',
      client_id: entity.client_id.id,
      items: [
        {
          product_id: entity.items[0].product_id.id,
          product_name: 'Arroz Branco 5kg',
          quantity: 2,
          unit_price: 12.99,
          subtotal: 25.98
        },
        {
          product_id: entity.items[1].product_id.id,
          product_name: 'Feijão Preto 1kg',
          quantity: 1,
          unit_price: 8.50,
          subtotal: 8.50
        }
      ],
      status: OrderStatus.PENDING,
      delivery_address: {
        street: 'Rua das Flores',
        number: '123',
        complement: 'Apto 45',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zip_code: '01234567',
        latitude: -23.5505,
        longitude: -46.6333
      },
      subtotal: 34.48,
      delivery_fee: 5.99,
      total: 40.47,
      payment_method: {
        type: 'CREDIT_CARD',
        details: { brand: 'visa', last_digits: '1234' }
      },
      notes: 'Entregar no portão',
      estimated_delivery: new Date('2024-01-15T14:30:00Z'),
      actual_delivery: null,
      created_at: entity.created_at,
      updated_at: entity.updated_at
    });
  });

  it('should convert an online order with minimal data to output', () => {
    const entity = OnlineOrder.create({
      store_id: 'store-456',
      client_id: new ClientId().id,
      items: [
        {
          product_id: new ProductId().id,
          product_name: 'Produto Teste',
          quantity: 1,
          unit_price: 10.00
        }
      ],
      delivery_address: {
        street: 'Rua Teste',
        number: '456',
        neighborhood: 'Bairro Teste',
        city: 'Cidade Teste',
        state: 'TS',
        zip_code: '12345-678'
      },
      delivery_fee: 0
    });
    
    const output = OnlineOrderOutputMapper.toOutput(entity);
    
    expect(output).toStrictEqual({
      order_id: entity.order_id.id,
      store_id: 'store-456',
      client_id: entity.client_id.id,
      items: [
        {
          product_id: entity.items[0].product_id.id,
          product_name: 'Produto Teste',
          quantity: 1,
          unit_price: 10.00,
          subtotal: 10.00
        }
      ],
      status: OrderStatus.PENDING,
      delivery_address: {
        street: 'Rua Teste',
        number: '456',
        complement: undefined,
        neighborhood: 'Bairro Teste',
        city: 'Cidade Teste',
        state: 'TS',
        zip_code: '12345678',
        latitude: undefined,
        longitude: undefined
      },
      subtotal: 10.00,
      delivery_fee: 0,
      total: 10.00,
      payment_method: undefined,
      notes: null,
      estimated_delivery: null,
      actual_delivery: null,
      created_at: entity.created_at,
      updated_at: entity.updated_at
    });
  });

  it('should convert a delivered online order to output', () => {
    const entity = OnlineOrder.create({
      store_id: 'store-789',
      client_id: new ClientId().id,
      items: [
        {
          product_id: new ProductId().id,
          product_name: 'Produto Entregue',
          quantity: 3,
          unit_price: 15.50
        }
      ],
      delivery_address: {
        street: 'Av. Principal',
        number: '789',
        neighborhood: 'Centro',
        city: 'Rio de Janeiro',
        state: 'RJ',
        zip_code: '20000-000'
      },
      delivery_fee: 8.50,
      payment_method: {
        type: 'pix',
        details: { key: 'user@email.com' }
      },
      estimated_delivery: new Date('2024-01-10T16:00:00Z')
    });
    
    // Simula o fluxo completo do pedido até a entrega
    entity.confirm();
    entity.startPreparing();
    entity.sendForDelivery();
    entity.markAsDelivered();
    
    const output = OnlineOrderOutputMapper.toOutput(entity);
    
    expect(output.status).toBe(OrderStatus.DELIVERED);
    expect(output.actual_delivery).toBeInstanceOf(Date);
    expect(output.total).toBe(55.00); // (3 * 15.50) + 8.50
  });
});