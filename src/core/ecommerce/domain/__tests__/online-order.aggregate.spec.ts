import { OnlineOrder, OnlineOrderId, OrderStatus, DeliveryAddress, OrderItem } from '../online-order.aggregate';
import { ProductId } from '@core/product/domain/product.aggregate';
import { Money } from '@core/shared/domain/value-objects/money.vo';
import { Uuid } from '@core/shared/domain/value-objects/uuid.vo';
import { Price } from '@core/shared/domain/value-objects/price.vo';
import { Quantity } from '@core/shared/domain/value-objects/quantity.vo';
import { PaymentMethod, PaymentMethodType } from '@core/shared/domain/value-objects/payment-method.vo';

describe('OnlineOrder Aggregate Unit Tests', () => {
  let validProps: any;

  beforeEach(() => {
    validProps = {
      store_id: new Uuid().id,
      client_id: new Uuid().id,
      items: [
        {
          product_id: new Uuid().id,
          product_name: 'Produto Teste',
          quantity: 2,
          unit_price: 25.50,
        }
      ],
      delivery_address: {
        street: 'Rua Teste',
        number: '123',
        complement: 'Apto 45',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zip_code: '01234-567',
        latitude: -23.5505,
        longitude: -46.6333,
      },
      delivery_fee: 5.00,
      payment_method: {
        type: 'CREDIT_CARD',
        details: { installments: 1 }
      },
    };
  });

  describe('constructor', () => {
    it('should create a new order with valid props', () => {
      const order = OnlineOrder.create(validProps);

      expect(order.order_id).toBeInstanceOf(OnlineOrderId);
      expect(order.store_id).toBe(validProps.store_id);
      expect(order.client_id.id).toBe(validProps.client_id);
      expect(order.items).toHaveLength(1);
      expect(order.items[0].product_id).toBeInstanceOf(Uuid);
      expect(order.items[0].product_name).toBe('Produto Teste');
      expect(order.items[0].quantity.value).toBe(2);
      expect(order.items[0].unit_price).toBeInstanceOf(Price);
      expect(order.items[0].unit_price.value).toBe(25.50);
      expect(order.status).toBe(OrderStatus.PENDING);
      expect(order.delivery_address.street).toBe(validProps.delivery_address.street);
      expect(order.delivery_fee).toBeInstanceOf(Money);
      expect(order.delivery_fee.value).toBe(5.00);
      expect(order.subtotal).toBeInstanceOf(Money);
      expect(order.subtotal.value).toBe(51.00); // 2 * 25.50
      expect(order.total).toBeInstanceOf(Money);
      expect(order.total.value).toBe(56.00); // 51.00 + 5.00
      expect(order.payment_method?.type).toBe('CREDIT_CARD');
      expect(order.notes).toBeNull();
      expect(order.estimated_delivery).toBeNull();
      expect(order.actual_delivery).toBeNull();
      expect(order.created_at).toBeInstanceOf(Date);
      expect(order.updated_at).toBeInstanceOf(Date);
    });

    it('should create a new order with optional props', () => {
      const order = OnlineOrder.create({
        ...validProps,
        notes: 'Deixar com porteiro',
        estimated_delivery: new Date('2024-12-31'),
      });

      expect(order.notes).toBe('Deixar com porteiro');
      expect(order.estimated_delivery).toEqual(new Date('2024-12-31'));
    });

    it('should create a new order with custom id', () => {
      const customId = new OnlineOrderId();
      const order = new OnlineOrder({
        order_id: customId,
        client_id: new Uuid(validProps.client_id),
        store_id: validProps.store_id,
        items: [OrderItem.create({
          product_id: new Uuid(validProps.items[0].product_id),
          product_name: validProps.items[0].product_name,
          quantity: new Quantity(validProps.items[0].quantity),
          unit_price: new Price(validProps.items[0].unit_price)
        })],
        delivery_address: DeliveryAddress.create(validProps.delivery_address),
        delivery_fee: new Money(validProps.delivery_fee),
        payment_method: new PaymentMethod(PaymentMethodType.CREDIT_CARD, {}),
      });

      expect(order.order_id.id).toBe(customId.id);
    });
  });

  describe('validation', () => {
    it('should throw error when store_id is empty', () => {
      expect(() => {
        OnlineOrder.create({
          ...validProps,
          store_id: '',
        });
      }).toThrow('store_id should not be empty');
    });

    it('should throw error when client_id is empty', () => {
      expect(() => {
        OnlineOrder.create({
          ...validProps,
          client_id: '',
        });
      }).toThrow('client_id should not be empty');
    });

    it('should throw error when items is empty', () => {
      expect(() => {
        OnlineOrder.create({
          ...validProps,
          items: [],
        });
      }).toThrow('items should not be empty');
    });

    it('should throw error when items has invalid quantity', () => {
      expect(() => {
        OnlineOrder.create({
          ...validProps,
          items: [
            {
              product_id: new Uuid().id,
              product_name: 'Produto Teste',
              quantity: 0,
              unit_price: 25.50,
            }
          ],
        });
      }).toThrow('quantity must be greater than 0');
    });

    it('should throw error when items has invalid unit_price', () => {
      expect(() => {
        OnlineOrder.create({
          ...validProps,
          items: [
            {
              product_id: new Uuid().id,
              product_name: 'Produto Teste',
              quantity: 1,
              unit_price: -10,
            }
          ],
        });
      }).toThrow('unit_price must be greater than 0');
    });

    it('should throw error when delivery_address is invalid', () => {
      expect(() => {
        OnlineOrder.create({
          ...validProps,
          delivery_address: {
            street: '',
            number: '',
            neighborhood: '',
            city: '',
            state: '',
            zip_code: '',
            latitude: -23.5505,
            longitude: -46.6333,
          },
        });
      }).toThrow('street should not be empty');
    });

    it('should throw error when delivery_fee is negative', () => {
      expect(() => {
        OnlineOrder.create({
          ...validProps,
          delivery_fee: -5.00,
        });
      }).toThrow('delivery_fee must be greater than or equal to 0');
    });

    it('should throw error when payment_method is invalid', () => {
      expect(() => {
        OnlineOrder.create({
          ...validProps,
          payment_method: {
            type: 'invalid_method',
            details: {}
          },
        });
      }).toThrow('Invalid payment method type');
    });
  });

  describe('calculations', () => {
    it('should calculate subtotal correctly with single item', () => {
      const order = OnlineOrder.create({
        ...validProps,
        items: [
          {
            product_id: new Uuid().id,
            product_name: 'Produto Teste',
            quantity: 3,
            unit_price: 10.00,
          }
        ],
      });

      expect(order.subtotal.value).toBe(30.00);
    });

    it('should calculate subtotal correctly with multiple items', () => {
      const order = OnlineOrder.create({
        ...validProps,
        items: [
          {
            product_id: new Uuid().id,
            product_name: 'Item 1',
            quantity: 2,
            unit_price: 15.00,
          },
          {
            product_id: new Uuid().id,
            product_name: 'Item 2',
            quantity: 1,
            unit_price: 10.00,
          }
        ],
      });

      expect(order.subtotal.value).toBe(40.00); // (2 * 15) + (1 * 10)
    });

    it('should calculate total correctly', () => {
      const order = OnlineOrder.create({
        ...validProps,
        items: [
          {
            product_id: new Uuid().id,
            product_name: 'Produto Teste',
            quantity: 1,
            unit_price: 100.00,
          }
        ],
        delivery_fee: 15.00,
      });

      expect(order.total.value).toBe(115.00);
    });
  });

  describe('status changes', () => {
    let order: OnlineOrder;

    beforeEach(() => {
      order = OnlineOrder.create(validProps);
    });

    it('should confirm order', () => {
      order.confirm();
      expect(order.status).toBe(OrderStatus.CONFIRMED);
      expect(order.updated_at).toBeInstanceOf(Date);
    });

    it('should start preparation', () => {
      order.confirm();
      order.startPreparing();
      expect(order.status).toBe(OrderStatus.PREPARING);
    });

    it('should mark as out for delivery', () => {
      order.confirm();
      order.startPreparing();
      order.sendForDelivery();
      expect(order.status).toBe(OrderStatus.OUT_FOR_DELIVERY);
    });

    it('should mark as delivered', () => {
      order.confirm();
      order.startPreparing();
      order.sendForDelivery();
      order.markAsDelivered();
      expect(order.status).toBe(OrderStatus.DELIVERED);
      expect(order.actual_delivery).toBeInstanceOf(Date);
    });

    it('should cancel order', () => {
      order.cancel();
      expect(order.status).toBe(OrderStatus.CANCELLED);
    });

    it('should throw error when trying invalid status transition', () => {
      expect(() => {
        order.startPreparing(); // Tentar preparar sem confirmar
      }).toThrow('Invalid status transition from PENDING to PREPARING');
    });
  });

  describe('update methods', () => {
    let order: OnlineOrder;

    beforeEach(() => {
      order = OnlineOrder.create(validProps);
    });

    it('should update notes', () => {
      const newNotes = 'Nova observação';
      order.updateNotes(newNotes);
      expect(order.notes).toBe(newNotes);
      expect(order.updated_at).toBeInstanceOf(Date);
    });

    it('should update delivery address', () => {
      const newAddress = DeliveryAddress.create({
        street: 'Nova Rua',
        number: '456',
        complement: 'Bloco B',
        neighborhood: 'Jardins',
        city: 'São Paulo',
        state: 'SP',
        zip_code: '01234-890',
        latitude: -23.5678,
        longitude: -46.6543,
      });

      order.updateDeliveryAddress(newAddress);
      expect(order.delivery_address).toEqual(newAddress);
    });

    it('should update estimated delivery', () => {
      const newDate = new Date('2024-12-31');
      order.updateEstimatedDelivery(newDate);
      expect(order.estimated_delivery).toEqual(newDate);
    });
  });

  describe('toJSON', () => {
    it('should return correct JSON representation', () => {
      const order = OnlineOrder.create(validProps);
      const json = order.toJSON();

      expect(json).toEqual({
        order_id: order.order_id.id,
        store_id: order.store_id,
        client_id: order.client_id.id,
        items: [
          {
            product_id: order.items[0].product_id.id,
            product_name: order.items[0].product_name,
            quantity: 2,
            unit_price: 25.5,
            subtotal: 51
          }
        ],
        status: order.status,
        delivery_address: {
          street: order.delivery_address.street,
          number: order.delivery_address.number,
          complement: order.delivery_address.complement,
          neighborhood: order.delivery_address.neighborhood,
          city: order.delivery_address.city,
          state: order.delivery_address.state,
          zip_code: order.delivery_address.zip_code,
          latitude: order.delivery_address.latitude,
          longitude: order.delivery_address.longitude
        },
        delivery_fee: order.delivery_fee.value,
        subtotal: order.subtotal.value,
        total: order.total.value,
        payment_method: {
          type: 'CREDIT_CARD',
          details: { installments: 1 }
        },
        notes: order.notes,
        estimated_delivery: order.estimated_delivery,
        actual_delivery: order.actual_delivery,
        created_at: order.created_at,
        updated_at: order.updated_at,
      });
    });
  });
});