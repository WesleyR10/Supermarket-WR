import { Chance } from 'chance';
import { Uuid } from '../../../shared/domain/value-objects/uuid.vo';
import { Money } from '@core/shared/domain/value-objects/money.vo';
import { OrderItemFakeBuilder } from './order-item-fake.builder';
import { DeliveryAddress, OnlineOrder, OrderItem, OrderStatus } from '../online-order.aggregate';
import { DeliveryAddressFakeBuilder } from './delivery-address-fake.builder';

type PropOrFactory<T> = T | ((index: number) => T);

export class OnlineOrderFakeBuilder<TBuild = any> {
  // auto generated in entity
  private _online_order_id: PropOrFactory<Uuid> | undefined = undefined;
  private _client_id: PropOrFactory<Uuid> = (_index) => new Uuid();
  
  private _items: PropOrFactory<OrderItem[]> = (_index) => [OrderItemFakeBuilder.aOrderItem().build()];
  private _delivery_address: PropOrFactory<DeliveryAddress> = (_index) => DeliveryAddressFakeBuilder.aDeliveryAddress().build();
  private _delivery_fee: PropOrFactory<Money> = (_index) => new Money(this.chance.floating({ min: 5, max: 25, fixed: 2 }));
  private _subtotal: PropOrFactory<Money> = (_index) => new Money(0);
  private _total: PropOrFactory<Money> = (_index) => new Money(0);
  private _status: PropOrFactory<OrderStatus> = (_index) => OrderStatus.PENDING;
  private _created_at: PropOrFactory<Date> | undefined = undefined;

  private countObjs: number;
  private chance: Chance.Chance;

  static aOnlineOrder() {
    return new OnlineOrderFakeBuilder<OnlineOrder>();
  }

  static theOnlineOrders(countObjs: number) {
    return new OnlineOrderFakeBuilder<OnlineOrder[]>(countObjs);
  }

  private constructor(countObjs: number = 1) {
    this.countObjs = countObjs;
    this.chance = Chance();
  }

  withOnlineOrderId(valueOrFactory: PropOrFactory<Uuid>) {
    this._online_order_id = valueOrFactory;
    return this;
  }

  withClientId(valueOrFactory: PropOrFactory<Uuid>) {
    this._client_id = valueOrFactory;
    return this;
  }

  withItems(valueOrFactory: PropOrFactory<OrderItem[]>) {
    this._items = valueOrFactory;
    return this;
  }

  withDeliveryAddress(valueOrFactory: PropOrFactory<DeliveryAddress>) {
    this._delivery_address = valueOrFactory;
    return this;
  }

  withDeliveryFee(valueOrFactory: PropOrFactory<Money>) {
    this._delivery_fee = valueOrFactory;
    return this;
  }

  withSubtotal(valueOrFactory: PropOrFactory<Money>) {
    this._subtotal = valueOrFactory;
    return this;
  }

  withTotal(valueOrFactory: PropOrFactory<Money>) {
    this._total = valueOrFactory;
    return this;
  }

  withStatus(valueOrFactory: PropOrFactory<OrderStatus>) {
    this._status = valueOrFactory;
    return this;
  }

  withCreatedAt(valueOrFactory: PropOrFactory<Date>) {
    this._created_at = valueOrFactory;
    return this;
  }

  // Método específico para domínio
  withPendingStatusAndItems() {
    this._status = OrderStatus.PENDING;
    this._items = (_index) => [OrderItemFakeBuilder.aOrderItem().build()];
    return this;
  }

  build(): TBuild {
    const orders = new Array(this.countObjs)
      .fill(undefined)
      .map((_, index) => {
        const order = new OnlineOrder({
          order_id: !this._online_order_id ? undefined : this.callFactory(this._online_order_id, index),
          client_id: this.callFactory(this._client_id, index),
          items: this.callFactory(this._items, index),
          delivery_address: this.callFactory(this._delivery_address, index),
          delivery_fee: this.callFactory(this._delivery_fee, index),
          subtotal: this.callFactory(this._subtotal, index),
          total: this.callFactory(this._total, index),
          status: this.callFactory(this._status, index),
          ...(this._created_at && { created_at: this.callFactory(this._created_at, index) }),
        });
        order.validate();
        return order;
      });
    return (this.countObjs === 1 ? orders[0] : orders) as TBuild;
  }

  private callFactory(factoryOrValue: PropOrFactory<any>, index: number) {
    return typeof factoryOrValue === 'function' ? factoryOrValue(index) : factoryOrValue;
  }
}