import { Chance } from 'chance';
import { CartItem } from '../cart.aggregate';
import { Uuid } from '../../../shared/domain/value-objects/uuid.vo';
import { Quantity } from '../../../shared/domain/value-objects/quantity.vo';
import { Price } from '../../../shared/domain/value-objects/price.vo';
import { Money } from '../../../shared/domain/value-objects/money.vo';

type PropOrFactory<T> = T | ((index: number) => T);

export class CartItemFakeBuilder<TBuild = any> {
  private _product_id: PropOrFactory<Uuid> | undefined = undefined;
  private _product_name: PropOrFactory<string> | undefined = undefined;
  private _quantity: PropOrFactory<Quantity> | undefined = undefined;
  private _unit_price: PropOrFactory<Price> | undefined = undefined;
  private _subtotal: PropOrFactory<Money> | undefined = undefined;

  private countObjs = 1;
  private chance: Chance.Chance;

  static aCartItem() {
    return new CartItemFakeBuilder<CartItem>();
  }

  static theCartItems(countObjs: number) {
    return new CartItemFakeBuilder<CartItem[]>().withCountObjs(countObjs);
  }

  private constructor(countObjs: number = 1) {
    this.countObjs = countObjs;
    this.chance = Chance();
  }

  private withCountObjs(countObjs: number) {
    this.countObjs = countObjs;
    return this;
  }

  withProductId(valueOrFactory: PropOrFactory<Uuid>) {
    this._product_id = valueOrFactory;
    return this;
  }

  withProductName(valueOrFactory: PropOrFactory<string>) {
    this._product_name = valueOrFactory;
    return this;
  }

  withQuantity(valueOrFactory: PropOrFactory<Quantity>) {
    this._quantity = valueOrFactory;
    return this;
  }

  withUnitPrice(valueOrFactory: PropOrFactory<Price>) {
    this._unit_price = valueOrFactory;
    return this;
  }

  withSubtotal(valueOrFactory: PropOrFactory<Money>) {
    this._subtotal = valueOrFactory;
    return this;
  }

  build(): TBuild {
    const cartItems = new Array(this.countObjs).fill(undefined).map((_, index) => {
      const quantity = this.callFactory(this._quantity, index) ?? new Quantity(this.chance.integer({ min: 1, max: 10 }));
      const unitPrice = this.callFactory(this._unit_price, index) ?? new Price(this.chance.floating({ min: 1, max: 100, fixed: 2 }));
      const subtotal = this.callFactory(this._subtotal, index) ?? new Money(quantity.value * unitPrice.value);

      return new CartItem(
        this.callFactory(this._product_id, index) ?? new Uuid(),
        this.callFactory(this._product_name, index) ?? this.chance.word({ length: 10 }),
        quantity,
        unitPrice,
        subtotal
      );
    });

    return this.countObjs === 1 ? (cartItems[0] as any) : (cartItems as any);
  }

  get product_id() {
    return this.getValue('product_id');
  }

  get product_name() {
    return this.getValue('product_name');
  }

  get quantity() {
    return this.getValue('quantity');
  }

  get unit_price() {
    return this.getValue('unit_price');
  }

  get subtotal() {
    return this.getValue('subtotal');
  }

  private getValue(prop: any) {
    const optional = ['product_id', 'product_name', 'quantity', 'unit_price', 'subtotal'];
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