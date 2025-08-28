import { Chance } from 'chance';
import { Uuid } from '../../../shared/domain/value-objects/uuid.vo';
import { Price } from '../../../shared/domain/value-objects/price.vo';
import { OrderItemFakeBuilder } from './order-item-fake.builder';
import { DeliveryAddress, OnlineOrder, OrderItem, OrderStatus } from '../online-order.aggregate';
import { DeliveryAddressFakeBuilder } from './delivery-address-fake.builder';

type PropOrFactory<T> = T | ((index: number) => T);

export class OnlineOrderFakeBuilder<TBuild = any> {
  // auto generated in entity
  private _online_order_id: PropOrFactory<Uuid> | undefined = undefined;
  private _store_id: PropOrFactory<string> = (_index) => new Uuid().id;
  private _client_id: PropOrFactory<Uuid> = (_index) => new Uuid();
  
  private _items: PropOrFactory<OrderItem[]> = (_index) => [OrderItemFakeBuilder.aOrderItem().build()];
  private _delivery_address: PropOrFactory<DeliveryAddress> = (_index) => DeliveryAddressFakeBuilder.aDeliveryAddress().build();
  private _delivery_fee: PropOrFactory<Price> = (_index) => new Price(this.chance.floating({ min: 5, max: 25, fixed: 2 }));
  private _subtotal: PropOrFactory<Price> = (_index) => new Price(this.chance.floating({ min: 10, max: 100, fixed: 2 }));
  private _total: PropOrFactory<Price> = (_index) => new Price(0); // Will be calculated in build method
  private _status: PropOrFactory<OrderStatus> = (_index) => OrderStatus.PENDING;
  private _created_at: PropOrFactory<Date> | undefined = undefined;

  private countObjs: number;
  private chance: Chance.Chance;

  static aOnlineOrder() {
    return new OnlineOrderFakeBuilder<OnlineOrder>();
  }

  // Alias de compatibilidade com testes: anOnlineOrder()
  static anOnlineOrder() {
    return OnlineOrderFakeBuilder.aOnlineOrder();
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

  withStoreId(valueOrFactory: PropOrFactory<string>) {
    this._store_id = valueOrFactory;
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

  withDeliveryFee(valueOrFactory: PropOrFactory<Price>) {
    this._delivery_fee = valueOrFactory;
    return this;
  }

  withSubtotal(valueOrFactory: PropOrFactory<Price>) {
    this._subtotal = valueOrFactory;
    return this;
  }

  withTotal(valueOrFactory: PropOrFactory<Price>) {
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
    const orders = Array.from({ length: this.countObjs }, (_, index) => {
      const subtotal = this.callFactory(this._subtotal, index);
      const deliveryFee = this.callFactory(this._delivery_fee, index);
      
      // Use the total set by withTotal() if provided, otherwise calculate it
      const total = this._total && typeof this._total !== 'function' && this._total instanceof Price
        ? this._total
        : this.callFactory(this._total, index).value === 0
          ? new Price(subtotal.value + deliveryFee.value)
          : this.callFactory(this._total, index);
      
      const order = new OnlineOrder({
         order_id: this._online_order_id ? this.callFactory(this._online_order_id, index) : undefined,
        store_id: this.callFactory(this._store_id, index),
        client_id: this.callFactory(this._client_id, index),
        items: this.callFactory(this._items, index),
        delivery_address: this.callFactory(this._delivery_address, index),
        delivery_fee: deliveryFee,
        subtotal: subtotal,
        total: total,
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