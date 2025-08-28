import { AggregateRoot } from '../../shared/domain/aggregate-root';
import { ValueObject } from '../../shared/domain/value-object';
import { Uuid } from '../../shared/domain/value-objects/uuid.vo';
import { Money } from '../../shared/domain/value-objects/money.vo';
import { Quantity, InvalidQuantityError } from '../../shared/domain/value-objects/quantity.vo';
import { Price } from '../../shared/domain/value-objects/price.vo';
import { InvalidArgumentError } from '../../shared/domain/errors/invalid-argument.error';
import { CartCreatedEvent } from './events/cart-created.event';
import { CartItemAddedEvent } from './events/cart-item-added.event';
import { CartClearedEvent } from './events/cart-cleared.event';
import { CartUpdatedEvent } from './events/cart-updated.event';
import { CartItemRemovedEvent } from './events/cart-item-removed.event';
import { CartFakeBuilder } from './fake-builders/cart-fake.builder';

export class CartId extends Uuid {}

export enum CartStatus {
  ACTIVE = 'ACTIVE', // Carrinho ativo
  ABANDONED = 'ABANDONED', // Carrinho abandonado
  CONVERTED = 'CONVERTED', // Convertido em pedido
  EXPIRED = 'EXPIRED' // Expirado
}

export type CartItemProps = {
  product_id: Uuid;
  product_name: string;
  quantity: Quantity;
  unit_price: Price;
  subtotal: Money;
};

export class CartItem {
  constructor(
    public readonly product_id: Uuid,
    public readonly product_name: string,
    public readonly quantity: Quantity,
    public readonly unit_price: Price,
    public readonly subtotal: Money
  ) {}

  static create(props: {
    product_id: Uuid;
    product_name: string;
    quantity: Quantity;
    unit_price: Price;
  }): CartItem {
    if (!props.product_name || props.product_name.trim() === '') {
      throw new InvalidArgumentError('Product name cannot be empty');
    }

    if (props.quantity.value <= 0) {
      throw new InvalidArgumentError('Quantity must be greater than zero');
    }

    const subtotal = new Money(props.quantity.value * props.unit_price.value);

    return new CartItem(
      props.product_id,
      props.product_name,
      props.quantity,
      props.unit_price,
      subtotal
    );
  }

  updateQuantity(newQuantity: Quantity): CartItem {
    if (newQuantity.value <= 0) {
      throw new InvalidQuantityError('Quantity must be greater than 0');
    }

    const newSubtotal = new Money(newQuantity.value * this.unit_price.value);

    return new CartItem(
      this.product_id,
      this.product_name,
      newQuantity,
      this.unit_price,
      newSubtotal
    );
  }

  updateUnitPrice(newPrice: Price): CartItem {
    const newSubtotal = new Money(this.quantity.value * newPrice.value);

    return new CartItem(
      this.product_id,
      this.product_name,
      this.quantity,
      newPrice,
      newSubtotal
    );
  }

  toJSON() {
    return {
      product_id: this.product_id.id,
      product_name: this.product_name,
      quantity: this.quantity.value,
      unit_price: this.unit_price.value,
      subtotal: this.subtotal.value
    };
  }

  // TODO: Implementar fake builder
  // static fake() {
  //   return CartItemFakeBuilder.aCartItem();
  // }
}

export type CartConstructorProps = {
  cart_id?: CartId;
  client_id: Uuid;
  store_id: string;
  items: CartItem[];
  status?: CartStatus;
  subtotal?: Money;
  expires_at?: Date;
  created_at?: Date;
  updated_at?: Date;
};

export type CartCreateCommand = {
  client_id: string;
  store_id: string;
  expires_at?: Date;
};

export class Cart extends AggregateRoot {
  cart_id: CartId;
  client_id: Uuid;
  store_id: string;
  items: CartItem[];
  status: CartStatus;
  subtotal: Money;
  expires_at: Date;
  created_at: Date;
  updated_at: Date;

  constructor(props: CartConstructorProps) {
    super();
    this.cart_id = props.cart_id ?? new CartId();
    this.client_id = props.client_id;
    this.store_id = props.store_id;
    this.items = props.items ?? [];
    this.status = props.status ?? CartStatus.ACTIVE;
    this.subtotal = props.subtotal ?? new Money(0);
    this.expires_at = props.expires_at ?? this.getDefaultExpirationDate();
    this.created_at = props.created_at ?? new Date();
    this.updated_at = props.updated_at ?? new Date();
  }

  static create(props: CartCreateCommand): Cart {
    // Validações básicas
    if (!props.client_id) {
      throw new InvalidArgumentError('client_id is required');
    }
    if (!props.store_id) {
      throw new InvalidArgumentError('store_id is required');
    }

    const cart = new Cart({
      client_id: new Uuid(props.client_id),
      store_id: props.store_id,
      items: [],
      expires_at: props.expires_at
    });

    cart.applyEvent(new CartCreatedEvent(cart));
    return cart;
  }

  get entity_id(): ValueObject {
    return this.cart_id;
  }

  validate(fields?: string[]): boolean {
    // Lazy import to avoid circular dependency with validator module
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const validatorModule = require('./cart.validator') as any;
    const validator = validatorModule.CartValidatorFactory.create();
    return validator.validate(this.notification, this, fields);
  }

  // Métodos de gestão de itens
  addItem(item: {
    product_id: Uuid;
    product_name: string;
    quantity: Quantity;
    unit_price: Price;
  }): void {
    if (this.status !== CartStatus.ACTIVE) {
      throw new InvalidArgumentError('Cannot add items to inactive cart');
    }

    if (this.isExpired()) {
      throw new InvalidArgumentError('Cannot add items to expired cart');
    }

    const existingItemIndex = this.items.findIndex(
      cartItem => cartItem.product_id.equals(item.product_id)
    );

    if (existingItemIndex >= 0) {
      // Atualiza quantidade do item existente
      const existingItem = this.items[existingItemIndex];
      const newQuantity = new Quantity(existingItem.quantity.value + item.quantity.value);
      this.items[existingItemIndex] = existingItem.updateQuantity(newQuantity);
    } else {
      // Adiciona novo item
      const cartItem = CartItem.create(item);
      this.items.push(cartItem);
    }

    this.recalculateSubtotal();
    this.updated_at = new Date();
    this.applyEvent(new CartUpdatedEvent(this));
    this.applyEvent(new CartItemAddedEvent(this, item.product_id));
  }

  removeItem(productId: Uuid): void {
    if (this.status !== CartStatus.ACTIVE) {
      throw new InvalidArgumentError('Cannot remove items from inactive cart');
    }

    const itemIndex = this.items.findIndex(item => item.product_id.equals(productId));
    if (itemIndex === -1) {
      throw new InvalidArgumentError('Item not found in cart');
    }

    this.items.splice(itemIndex, 1);
    this.recalculateSubtotal();
    this.updated_at = new Date();
    this.applyEvent(new CartUpdatedEvent(this));
    this.applyEvent(new CartItemRemovedEvent(this, productId));
  }

  updateItemQuantity(productId: Uuid, newQuantity: Quantity): void {
    if (this.status !== CartStatus.ACTIVE) {
      throw new InvalidArgumentError('Cannot update items in inactive cart');
    }

    if (newQuantity.value <= 0) {
      this.removeItem(productId);
      return;
    }

    const itemIndex = this.items.findIndex(item => item.product_id.equals(productId));
    if (itemIndex === -1) {
      throw new InvalidArgumentError('Item not found in cart');
    }

    this.items[itemIndex] = this.items[itemIndex].updateQuantity(newQuantity);
    this.recalculateSubtotal();
    this.updated_at = new Date();
  }

  clear(): void {
    if (this.status !== CartStatus.ACTIVE) {
      throw new InvalidArgumentError('Cannot clear inactive cart');
    }

    this.items = [];
    this.recalculateSubtotal();
    this.updated_at = new Date();
    this.applyEvent(new CartUpdatedEvent(this));
    this.applyEvent(new CartClearedEvent(this));
  }

  // Métodos de status
  markAsAbandoned(): void {
    if (this.status === CartStatus.CONVERTED) {
      throw new InvalidArgumentError('Cannot abandon converted cart');
    }

    this.status = CartStatus.ABANDONED;
    this.updated_at = new Date();
  }

  markAsConverted(): void {
    if (this.status !== CartStatus.ACTIVE) {
      throw new InvalidArgumentError('Only active carts can be converted');
    }

    if (this.items.length === 0) {
      throw new InvalidArgumentError('Cannot convert empty cart');
    }

    this.status = CartStatus.CONVERTED;
    this.updated_at = new Date();
  }

  markAsExpired(): void {
    if (this.status === CartStatus.CONVERTED) {
      throw new InvalidArgumentError('Cannot expire converted cart');
    }

    this.status = CartStatus.EXPIRED;
    this.updated_at = new Date();
  }

  // Métodos de consulta
  isEmpty(): boolean {
    return this.items.length === 0;
  }

  isActive(): boolean {
    return this.status === CartStatus.ACTIVE;
  }

  isExpired(): boolean {
    return this.status === CartStatus.EXPIRED || new Date() > this.expires_at;
  }

  isAbandoned(): boolean {
    return this.status === CartStatus.ABANDONED;
  }

  isConverted(): boolean {
    return this.status === CartStatus.CONVERTED;
  }

  canBeModified(): boolean {
    return this.status === CartStatus.ACTIVE && !this.isExpired();
  }

  getItemCount(): number {
    return this.items.reduce((total, item) => total + item.quantity.value, 0);
  }

  getUniqueItemsCount(): number {
    return this.items.length;
  }

  hasItem(productId: Uuid): boolean {
    return this.items.some(item => item.product_id.equals(productId));
  }

  getItem(productId: Uuid): CartItem | null {
    return this.items.find(item => item.product_id.equals(productId)) || null;
  }

  // Métodos privados
  private recalculateSubtotal(): void {
    const total = this.items.reduce((sum, item) => sum + item.subtotal.value, 0);
    this.subtotal = new Money(total);
  }

  private getDefaultExpirationDate(): Date {
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7); // 7 dias por padrão
    return expirationDate;
  }

   static fake() {
     return CartFakeBuilder.aCart();
   }

  toJSON() {
    return {
      cart_id: this.cart_id.id,
      client_id: this.client_id.id,
      store_id: this.store_id,
      items: this.items.map(item => item.toJSON()),
      status: this.status,
      subtotal: this.subtotal.value,
      expires_at: this.expires_at.toISOString(),
      created_at: this.created_at.toISOString(),
      updated_at: this.updated_at.toISOString()
    };
  }
}