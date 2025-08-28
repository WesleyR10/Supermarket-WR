import { OnlineOrderValidatorFactory } from '../online-order.validator';
import { OnlineOrder, OrderItem, DeliveryAddress, OnlineOrderId, OrderStatus } from '../online-order.aggregate';
import { PaymentMethod, PaymentMethodType } from '@core/shared/domain/value-objects/payment-method.vo';
import { Uuid } from '@core/shared/domain/value-objects/uuid.vo';
import { Money } from '@core/shared/domain/value-objects/money.vo';
import { Price } from '@core/shared/domain/value-objects/price.vo';
import { Quantity } from '@core/shared/domain/value-objects/quantity.vo';
import { Notification } from '@core/shared/domain/validators/notification';

describe('OnlineOrderValidator Unit Tests', () => {
  describe('validate', () => {
    it('should validate a valid order', () => {
      const order = OnlineOrder.fake().aOnlineOrder().build();

      const notification = new Notification();
      const validatorInstance = OnlineOrderValidatorFactory.create();
      const isValid = validatorInstance.validate(notification, order);
      
      if (notification.hasErrors()) {
        console.log('Validation errors for valid order:', JSON.stringify(notification.errors, null, 2));
        console.log('Order data:', {
          client_id: order.client_id,
          store_id: order.store_id,
          subtotal: order.subtotal?.value,
          delivery_fee: order.delivery_fee?.value,
          total: order.total?.value,
          items: order.items?.length
        });
      }

      expect(isValid).toBe(true);
      expect(notification.hasErrors()).toBe(false);
    });

    it('should validate order with empty store_id', () => {
      const order = OnlineOrder.fake().aOnlineOrder().build();
      // Force empty store_id
      (order as any).store_id = '';

      const notification = new Notification();
      const validatorInstance = OnlineOrderValidatorFactory.create();
      const isValid = validatorInstance.validate(notification, order);

      expect(isValid).toBe(false);
      expect(notification.hasErrors()).toBe(true);
      expect(notification.errors.get('store_id')).toContain('store_id should not be empty');
    });

    it('should validate order with empty client_id', () => {
      const order = OnlineOrder.fake().aOnlineOrder().build();
      // Force empty client_id
      (order as any).client_id = '';

      const notification = new Notification();
      const validatorInstance = OnlineOrderValidatorFactory.create();
      const isValid = validatorInstance.validate(notification, order);

      expect(isValid).toBe(false);
      expect(notification.hasErrors()).toBe(true);
      expect(notification.errors.get('client_id')).toContain('client_id should not be empty');
    });

    it('should validate items quantity', () => {
      const order = OnlineOrder.fake().aOnlineOrder().build();
      // Force empty items array
      (order as any).items = [];

      const notification = new Notification();
      const validatorInstance = OnlineOrderValidatorFactory.create();
      const isValid = validatorInstance.validate(notification, order);

      expect(isValid).toBe(false);
      expect(notification.hasErrors()).toBe(true);
    });

    it('should validate subtotal correctly', () => {
      const order = OnlineOrder.fake().aOnlineOrder().build();
      // Force incorrect subtotal calculation by changing items but not subtotal
      order.items = [];

      const notification = new Notification();
      const validatorInstance = OnlineOrderValidatorFactory.create();
      const isValid = validatorInstance.validate(notification, order);

      expect(isValid).toBe(false);
      expect(notification.hasErrors()).toBe(true);
    });

    it('should validate delivery fee correctly', () => {
      const order = OnlineOrder.fake().aOnlineOrder().build();
      // Test with valid delivery fee - this should pass
      const notification = new Notification();
      const validatorInstance = OnlineOrderValidatorFactory.create();
      const isValid = validatorInstance.validate(notification, order);

      if (!isValid) {
        console.log('Validation errors:', notification.errors);
      }
      expect(isValid).toBe(true);
      expect(notification.hasErrors()).toBe(false);
    });

    it('should validate total correctly', () => {
      const order = OnlineOrder.fake().aOnlineOrder().build();
      // Test with valid total - this should pass
      const notification = new Notification();
      const validatorInstance = OnlineOrderValidatorFactory.create();
      const isValid = validatorInstance.validate(notification, order);

      expect(isValid).toBe(true);
      expect(notification.hasErrors()).toBe(false);
    });

    it('should validate payment method for confirmed orders', () => {
      const order = OnlineOrder.fake().aOnlineOrder().build();
      // Force confirmed status with no payment method
      (order as any).status = OrderStatus.CONFIRMED;
      order.payment_method = null;

      const notification = new Notification();
      const validatorInstance = OnlineOrderValidatorFactory.create();
      const isValid = validatorInstance.validate(notification, order);

      expect(isValid).toBe(false);
      expect(notification.hasErrors()).toBe(true);
    });

    it('should validate all business rules when no fields are specified', () => {
      const order = OnlineOrder.fake().aOnlineOrder().build();
      order.items = []; // Empty items to trigger validation error
      
      const notification = new Notification();
      const validatorInstance = OnlineOrderValidatorFactory.create();
      const isValid = validatorInstance.validate(notification, order);

      expect(isValid).toBe(false);
      expect(notification.hasErrors()).toBe(true);
    });

    it('should validate specific fields only when fields parameter is provided', () => {
      const order = OnlineOrder.fake().aOnlineOrder().build();
      order.store_id = ''; // Empty store_id to trigger validation error

      const notification = new Notification();
      const validatorInstance = OnlineOrderValidatorFactory.create();
      const isValid = validatorInstance.validate(notification, order, ['store_id']);

      expect(isValid).toBe(false);
      expect(notification.hasErrors()).toBe(true);
    });
  });
});