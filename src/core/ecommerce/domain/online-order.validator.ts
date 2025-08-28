import { ClassValidatorFields } from '../../shared/domain/validators/class-validator-fields';
import { OnlineOrder } from './online-order.aggregate';
import { Notification } from '../../shared/domain/validators/notification';

export class OnlineOrderRules {
  order_id: string;
  client_id: string;
  store_id: string;
  items: any[];
  status: string;
  delivery_address: any;
  subtotal: number;
  delivery_fee: number;
  total: number;
  payment_method: any;
  notes: string | null;
  estimated_delivery: Date | null;

  constructor({
    order_id,
    client_id,
    store_id,
    items,
    status,
    delivery_address,
    subtotal,
    delivery_fee,
    total,
    payment_method,
    notes,
    estimated_delivery,
  }: OnlineOrder) {
    Object.assign(this, {
      order_id,
      client_id,
      store_id,
      items,
      status,
      delivery_address,
      subtotal,
      delivery_fee,
      total,
      payment_method,
      notes,
      estimated_delivery,
    });
  }
}

export class OnlineOrderValidator extends ClassValidatorFields {
  validate(notification: Notification, data: OnlineOrder, fields?: string[]): boolean {
    // Regras de negócio específicas
    this.validateBusinessRules(notification, data);
    
    // Retorna true se não há erros
    return !notification.hasErrors();
  }

  private validateBusinessRules(notification: Notification, data: OnlineOrder): void {
    // Regra: client_id não pode estar vazio
    if (!data.client_id || data.client_id.toString().trim() === '') {
      notification.addError('client_id should not be empty', 'client_id');
    }

    // Regra: store_id não pode estar vazio
    if (!data.store_id || data.store_id.toString().trim() === '') {
      notification.addError('store_id should not be empty', 'store_id');
    }

    // Regra: Subtotal deve ser maior que zero
    if (data.subtotal && data.subtotal.value <= 0) {
      notification.addError('Subtotal must be greater than zero', 'subtotal');
    }

    // Regra: Taxa de entrega deve ser maior ou igual a zero
    if (data.delivery_fee && data.delivery_fee.value < 0) {
      notification.addError('Delivery fee must be greater than or equal to zero', 'delivery_fee');
    }

    // Regra: Total deve ser maior que zero
    if (data.total && data.total.value <= 0) {
      notification.addError('Total must be greater than zero', 'total');
    }

    // Regra: Total deve ser igual a subtotal + taxa de entrega
    if (data.subtotal && data.delivery_fee && data.total) {
      const expectedTotal = data.subtotal.value + data.delivery_fee.value;
      if (Math.abs(data.total.value - expectedTotal) > 0.01) {
        notification.addError('Total must equal subtotal plus delivery fee', 'total');
      }
    }

    // Regra: Deve ter pelo menos um item
    if (!data.items || data.items.length === 0) {
      notification.addError('Order must have at least one item', 'items');
    }

    // Regra: Itens devem ter quantidade maior que zero
    if (data.items) {
      data.items.forEach((item, index) => {
        if (item.quantity && item.quantity.value <= 0) {
          notification.addError(`Item ${index + 1} quantity must be greater than zero`, 'items');
        }
        if (item.unit_price && item.unit_price.value <= 0) {
          notification.addError(`Item ${index + 1} unit price must be greater than zero`, 'items');
        }
      });
    }

    // Regra: Data de entrega estimada deve ser futura (se fornecida)
    if (data.estimated_delivery && data.estimated_delivery <= new Date()) {
      notification.addError('Estimated delivery must be in the future', 'estimated_delivery');
    }

    // Regra: Pedido confirmado deve ter método de pagamento
    if (data.status === 'CONFIRMED' && !data.payment_method) {
      notification.addError('Confirmed order must have a payment method', 'payment_method');
    }

    // Regra: Pedido entregue deve ter data de entrega real
    if (data.status === 'DELIVERED' && !data.actual_delivery) {
      notification.addError('Delivered order must have actual delivery date', 'actual_delivery');
    }
  }
}

export class OnlineOrderValidatorFactory {
  static create(): OnlineOrderValidator {
    return new OnlineOrderValidator();
  }
}