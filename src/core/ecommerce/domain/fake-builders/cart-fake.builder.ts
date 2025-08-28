import { Chance } from 'chance';
import { Cart, CartId, CartStatus, CartItem } from '../cart.aggregate';
import { Uuid } from '../../../shared/domain/value-objects/uuid.vo';
import { Money } from '../../../shared/domain/value-objects/money.vo';
import { CartItemFakeBuilder } from './cart-item-fake.builder';

type PropOrFactory<T> = T | ((index: number) => T);

export class CartFakeBuilder<TBuild = any> {
  private _cart_id: PropOrFactory<CartId> | undefined = undefined;
  private _client_id: PropOrFactory<Uuid> | undefined = undefined;
  private _store_id: PropOrFactory<string> | undefined = undefined;
  private _items: PropOrFactory<CartItem[]> | undefined = undefined;
  private _status: PropOrFactory<CartStatus> | undefined = undefined;
  private _subtotal: PropOrFactory<Money> | undefined = undefined;
  private _expires_at: PropOrFactory<Date> | undefined = undefined;
  private _created_at: PropOrFactory<Date> | undefined = undefined;
  private _updated_at: PropOrFactory<Date> | undefined = undefined;

  private countObjs = 1;
  private chance: Chance.Chance;

  static aCart() {
    return new CartFakeBuilder<Cart>();
  }

  static theCarts(countObjs: number) {
    return new CartFakeBuilder<Cart[]>().withCountObjs(countObjs);
  }

  private constructor(countObjs: number = 1) {
    this.countObjs = countObjs;
    this.chance = Chance();
  }

  private withCountObjs(countObjs: number) {
    this.countObjs = countObjs;
    return this;
  }

  withCartId(valueOrFactory: PropOrFactory<CartId>) {
    this._cart_id = valueOrFactory;
    return this;
  }

  withClientId(valueOrFactory: PropOrFactory<Uuid>) {
    this._client_id = valueOrFactory;
    return this;
  }

  withStoreId(valueOrFactory: PropOrFactory<string>) {
    this._store_id = valueOrFactory;
    return this;
  }

  withItems(valueOrFactory: PropOrFactory<CartItem[]>) {
    this._items = valueOrFactory;
    return this;
  }

  withStatus(valueOrFactory: PropOrFactory<CartStatus>) {
    this._status = valueOrFactory;
    return this;
  }

  withSubtotal(valueOrFactory: PropOrFactory<Money>) {
    this._subtotal = valueOrFactory;
    return this;
  }

  withExpiresAt(valueOrFactory: PropOrFactory<Date>) {
    this._expires_at = valueOrFactory;
    return this;
  }

  withCreatedAt(valueOrFactory: PropOrFactory<Date>) {
    this._created_at = valueOrFactory;
    return this;
  }

  withUpdatedAt(valueOrFactory: PropOrFactory<Date>) {
    this._updated_at = valueOrFactory;
    return this;
  }

  withActiveStatus() {
    this._status = CartStatus.ACTIVE;
    return this;
  }

  withAbandonedStatus() {
    this._status = CartStatus.ABANDONED;
    return this;
  }

  withConvertedStatus() {
    this._status = CartStatus.CONVERTED;
    return this;
  }

  withExpiredStatus() {
    this._status = CartStatus.EXPIRED;
    return this;
  }

  withEmptyCart() {
    this._items = [];
    this._subtotal = new Money(0);
    return this;
  }

  withRandomItems(count: number = 3) {
    this._items = CartItemFakeBuilder.theCartItems(count).build();
    return this;
  }

  build(): TBuild {
    const carts = new Array(this.countObjs).fill(undefined).map((_, index) => {
      const items = this.callFactory(this._items, index) ?? CartItemFakeBuilder.theCartItems(2).build();
      const subtotal = this.callFactory(this._subtotal, index) ?? new Money(
        items.reduce((sum: number, item: CartItem) => sum + item.subtotal.value, 0)
      );
      
      const expiresAt = this.callFactory(this._expires_at, index) ?? (() => {
        const date = new Date();
        date.setDate(date.getDate() + 7);
        return date;
      })();

      const clientId = this.callFactory(this._client_id, index) ?? new Uuid();
      
      return new Cart({
        cart_id: this.callFactory(this._cart_id, index) ?? new CartId(),
        client_id: clientId,
        store_id: this.callFactory(this._store_id, index) ?? this.chance.guid(),
        items,
        status: this.callFactory(this._status, index) ?? CartStatus.ACTIVE,
        subtotal,
        expires_at: expiresAt,
        created_at: this.callFactory(this._created_at, index) ?? new Date(),
        updated_at: this.callFactory(this._updated_at, index) ?? new Date()
      });
    });

    return this.countObjs === 1 ? (carts[0] as any) : (carts as any);
  }

  get cart_id() {
    return this.getValue('cart_id');
  }

  get client_id() {
    return this.getValue('client_id');
  }

  get store_id() {
    return this.getValue('store_id');
  }

  get items() {
    return this.getValue('items');
  }

  get status() {
    return this.getValue('status');
  }

  get subtotal() {
    return this.getValue('subtotal');
  }

  get expires_at() {
    return this.getValue('expires_at');
  }

  get created_at() {
    return this.getValue('created_at');
  }

  get updated_at() {
    return this.getValue('updated_at');
  }

  private getValue(prop: any) {
    const optional = ['cart_id', 'client_id', 'store_id', 'items', 'status', 'subtotal', 'expires_at', 'created_at', 'updated_at'];
    const privateProp = `_${prop}` as keyof this;
    if (!optional.includes(prop) || this[privateProp] === undefined) {
      throw new Error(`Property ${prop} not have a factory, use 'with' methods`);
    }
    return this.callFactory(this[privateProp] as any, 0);
  }

  private callFactory(factoryOrValue: PropOrFactory<any>, index: number) {
    return typeof factoryOrValue === 'function' ? factoryOrValue(index) : factoryOrValue;
  }
}