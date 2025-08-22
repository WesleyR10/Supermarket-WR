import { AggregateRoot } from '../../shared/domain/aggregate-root';
import { ValueObject } from '../../shared/domain/value-object';
import { Uuid } from '../../shared/domain/value-objects/uuid.vo';
import { Money } from '../../shared/domain/value-objects/money.vo';
import { Quantity } from '../../shared/domain/value-objects/quantity.vo';
import { Price } from '../../shared/domain/value-objects/price.vo';
import { PaymentMethod } from '../../shared/domain/value-objects/payment-method.vo';
// import { OnlineOrderValidatorFactory } from './online-order.validator';
import { OrderItemFakeBuilder } from './fake-builders/order-item-fake.builder';
import { DeliveryAddressFakeBuilder } from './fake-builders/delivery-address-fake.builder';
import { OnlineOrderFakeBuilder } from './fake-builders/online-order-fake.builder';

export class OnlineOrderId extends Uuid {}

export enum OrderStatus {
  PENDING = 'PENDING', // Pendente
  CONFIRMED = 'CONFIRMED', // Confirmado
  PREPARING = 'PREPARING', // Preparando
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY', // Saiu para entrega
  DELIVERED = 'DELIVERED', // Entregue
  CANCELLED = 'CANCELLED' // Cancelado
}

export type OrderItemProps = {
  product_id: Uuid;
  product_name: string;
  quantity: Quantity;
  unit_price: Price;
  subtotal: Money;
};

export class OrderItem {
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
  }): OrderItem {
    const subtotal = new Money(
      props.unit_price.value * props.quantity.value
    );

    return new OrderItem(
      props.product_id,
      props.product_name,
      props.quantity,
      props.unit_price,
      subtotal
    );
  }

  updateQuantity(newQuantity: Quantity): OrderItem {
    const newSubtotal = new Money(
      this.unit_price.value * newQuantity.value
    );

    return new OrderItem(
      this.product_id,
      this.product_name,
      newQuantity,
      this.unit_price,
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

  static fake() {
    return OrderItemFakeBuilder;
  }
}

export type DeliveryAddressProps = {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
  latitude?: number;
  longitude?: number;
};

export class DeliveryAddress {
  constructor(
    public readonly street: string,
    public readonly number: string,
    public readonly neighborhood: string,
    public readonly city: string,
    public readonly state: string,
    public readonly zip_code: string,
    public readonly complement?: string,
    public readonly latitude?: number,
    public readonly longitude?: number
  ) {}

  static create(props: DeliveryAddressProps): DeliveryAddress {
    return new DeliveryAddress(
      props.street.trim(),
      props.number.trim(),
      props.neighborhood.trim(),
      props.city.trim(),
      props.state.trim(),
      props.zip_code.replace('-', ''),
      props.complement?.trim(),
      props.latitude,
      props.longitude
    );
  }

  getFormattedAddress(): string {
    const complement = this.complement ? `, ${this.complement}` : '';
    return `${this.street}, ${this.number}${complement}, ${this.neighborhood}, ${this.city} - ${this.state}, ${this.zip_code}`;
  }

  toJSON() {
    return {
      street: this.street,
      number: this.number,
      complement: this.complement,
      neighborhood: this.neighborhood,
      city: this.city,
      state: this.state,
      zip_code: this.zip_code,
      latitude: this.latitude,
      longitude: this.longitude
    };
  }

  static fake() {
    return DeliveryAddressFakeBuilder;
  }
}

export type OnlineOrderConstructorProps = {
  order_id?: OnlineOrderId;
  client_id: Uuid;
  items: OrderItem[];
  status?: OrderStatus;
  delivery_address: DeliveryAddress;
  subtotal?: Money;
  delivery_fee: Money;
  total?: Money;
  payment_method?: PaymentMethod | null;
  notes?: string | null;
  estimated_delivery?: Date | null;
  actual_delivery?: Date | null;
  created_at?: Date;
  updated_at?: Date;
};

export type OnlineOrderCreateCommand = {
  client_id: string;
  items: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
  }>;
  delivery_address: DeliveryAddressProps;
  delivery_fee: number;
  payment_method?: string;
  notes?: string;
  estimated_delivery?: Date;
};

export class OnlineOrder extends AggregateRoot {
  order_id: OnlineOrderId;
  client_id: Uuid;
  items: OrderItem[];
  status: OrderStatus;
  delivery_address: DeliveryAddress;
  subtotal: Money;
  delivery_fee: Money;
  total: Money;
  payment_method: PaymentMethod | null;
  notes: string | null;
  estimated_delivery: Date | null;
  actual_delivery: Date | null;
  created_at: Date;
  updated_at: Date;

  constructor(props: OnlineOrderConstructorProps) {
    super();
    this.order_id = props.order_id ?? new OnlineOrderId();
    this.client_id = props.client_id;
    this.items = props.items;
    this.status = props.status ?? OrderStatus.PENDING;
    this.delivery_address = props.delivery_address;
    this.delivery_fee = props.delivery_fee;
    this.payment_method = props.payment_method ?? null;
    this.notes = props.notes ?? null;
    this.estimated_delivery = props.estimated_delivery ?? null;
    this.actual_delivery = props.actual_delivery ?? null;
    this.created_at = props.created_at ?? new Date();
    this.updated_at = props.updated_at ?? new Date();

    // Calcular subtotal e total se não fornecidos
    this.subtotal = props.subtotal ?? this.calculateSubtotal();
    this.total = props.total ?? this.calculateTotal();
  }

  static create(props: OnlineOrderCreateCommand): OnlineOrder {
    const orderItems = props.items.map(item => OrderItem.create({
      product_id: new Uuid(item.product_id),
      product_name: item.product_name,
      quantity: new Quantity(item.quantity),
      unit_price: new Price(item.unit_price)
    }));

    const order = new OnlineOrder({
      client_id: new Uuid(props.client_id),
      items: orderItems,
      delivery_address: DeliveryAddress.create(props.delivery_address),
      delivery_fee: new Money(props.delivery_fee),
      payment_method: props.payment_method ? PaymentMethod.fromString(props.payment_method) : null,
      notes: props.notes ?? null,
      estimated_delivery: props.estimated_delivery ?? null
    });

    order.validate();
    return order;
  }

  get entity_id(): ValueObject {
    return this.order_id;
  }

  validate(fields?: string[]): boolean {
    // Lazy import to avoid circular dependency at module load time
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const validatorModule = require('./online-order.validator') as any;
    const validator = validatorModule.OnlineOrderValidatorFactory.create();
    return validator.validate(this.notification, this, fields);
  }

  // MÉTODOS DE NEGÓCIO - APENAS REGRAS DE NEGÓCIO

  addItem(item: {
    product_id: Uuid;
    product_name: string;
    quantity: Quantity;
    unit_price: Price;
  }): void {
    if (this.status !== OrderStatus.PENDING) {
      this.notification.addError('Cannot add items to a non-pending order', 'status');
      return;
    }

    const orderItem = OrderItem.create(item);
    this.items.push(orderItem);
    this.recalculateAmounts();
    this.updated_at = new Date();
  }

  removeItem(productId: Uuid): void {
    if (this.status !== OrderStatus.PENDING) {
      this.notification.addError('Cannot remove items from a non-pending order', 'status');
      return;
    }

    const itemIndex = this.items.findIndex(item => item.product_id.equals(productId));
    if (itemIndex === -1) {
      this.notification.addError('Item not found in order', 'items');
      return;
    }

    this.items.splice(itemIndex, 1);
    
    if (this.items.length === 0) {
      this.notification.addError('Order must have at least one item', 'items');
      return;
    }

    this.recalculateAmounts();
    this.updated_at = new Date();
  }

  updateItemQuantity(productId: Uuid, newQuantity: Quantity): void {
    if (this.status !== OrderStatus.PENDING) {
      this.notification.addError('Cannot update items in a non-pending order', 'status');
      return;
    }

    const itemIndex = this.items.findIndex(item => item.product_id.equals(productId));
    if (itemIndex === -1) {
      this.notification.addError('Item not found in order', 'items');
      return;
    }

    this.items[itemIndex] = this.items[itemIndex].updateQuantity(newQuantity);
    this.recalculateAmounts();
    this.updated_at = new Date();
  }

  confirm(): void {
    if (this.status !== OrderStatus.PENDING) {
      this.notification.addError('Only pending orders can be confirmed', 'status');
      return;
    }

    if (!this.payment_method) {
      this.notification.addError('Payment method is required to confirm order', 'payment_method');
      return;
    }

    this.status = OrderStatus.CONFIRMED;
    this.updated_at = new Date();
  }

  startPreparing(): void {
    if (this.status !== OrderStatus.CONFIRMED) {
      this.notification.addError('Only confirmed orders can start preparation', 'status');
      return;
    }

    this.status = OrderStatus.PREPARING;
    this.updated_at = new Date();
  }

  sendForDelivery(): void {
    if (this.status !== OrderStatus.PREPARING) {
      this.notification.addError('Only orders in preparation can be sent for delivery', 'status');
      return;
    }

    this.status = OrderStatus.OUT_FOR_DELIVERY;
    this.updated_at = new Date();
  }

  markAsDelivered(): void {
    if (this.status !== OrderStatus.OUT_FOR_DELIVERY) {
      this.notification.addError('Only orders out for delivery can be marked as delivered', 'status');
      return;
    }

    this.status = OrderStatus.DELIVERED;
    this.actual_delivery = new Date();
    this.updated_at = new Date();
  }

  cancel(): void {
    if (![OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(this.status)) {
      this.notification.addError('Only pending or confirmed orders can be cancelled', 'status');
      return;
    }

    this.status = OrderStatus.CANCELLED;
    this.updated_at = new Date();
  }

  setPaymentMethod(paymentMethod: PaymentMethod): void {
    if (this.status !== OrderStatus.PENDING) {
      this.notification.addError('Cannot set payment method for a non-pending order', 'status');
      return;
    }

    this.payment_method = paymentMethod;
    this.updated_at = new Date();
  }

  updateDeliveryAddress(newAddress: DeliveryAddress): void {
    if (this.status !== OrderStatus.PENDING) {
      this.notification.addError('Cannot update delivery address for a non-pending order', 'status');
      return;
    }

    this.delivery_address = newAddress;
    this.updated_at = new Date();
  }

  updateNotes(notes: string | null): void {
    if (this.status !== OrderStatus.PENDING) {
      this.notification.addError('Cannot update notes for a non-pending order', 'status');
      return;
    }

    this.notes = notes;
    this.updated_at = new Date();
  }

  updateEstimatedDelivery(estimatedDelivery: Date | null): void {
    if (this.status !== OrderStatus.PENDING) {
      this.notification.addError('Cannot update estimated delivery for a non-pending order', 'status');
      return;
    }

    this.estimated_delivery = estimatedDelivery;
    this.updated_at = new Date();
  }

  isPending(): boolean {
    return this.status === OrderStatus.PENDING;
  }

  isConfirmed(): boolean {
    return this.status === OrderStatus.CONFIRMED;
  }

  isDelivered(): boolean {
    return this.status === OrderStatus.DELIVERED;
  }

  isCancelled(): boolean {
    return this.status === OrderStatus.CANCELLED;
  }

  canBeModified(): boolean {
    return [OrderStatus.PENDING].includes(this.status);
  }

  canBeCancelled(): boolean {
    return [OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(this.status);
  }

  hasPaymentMethod(): boolean {
    return this.payment_method !== null;
  }

  isReadyForConfirmation(): boolean {
    return this.items.length > 0 && this.hasPaymentMethod() && this.total.value > 0;
  }

  getItemCount(): number {
    return this.items.reduce((count, item) => count + item.quantity.value, 0);
  }

  getUniqueItemsCount(): number {
    const uniqueProductIds = new Set(this.items.map(item => item.product_id.id));
    return uniqueProductIds.size;
  }

  hasItem(productId: Uuid): boolean {
    return this.items.some(item => item.product_id.equals(productId));
  }

  getItem(productId: Uuid): OrderItem | null {
    return this.items.find(item => item.product_id.equals(productId)) ?? null;
  }

  isExpressDelivery(): boolean {
    // Entrega expressa quando não há estimativa definida (entrega imediata)
    return this.estimated_delivery === null;
  }

  isScheduledDelivery(): boolean {
    return this.estimated_delivery !== null;
  }

  getDeliveryTimeEstimate(): string {
    if (this.isExpressDelivery()) {
      return '30-60 minutes';
    }

    if (!this.estimated_delivery) {
      return 'N/A';
    }

    const now = new Date();
    const diffMs = this.estimated_delivery.getTime() - now.getTime();
    const diffMin = Math.max(0, Math.round(diffMs / 60000));

    if (diffMin <= 60) {
      return `${diffMin} minutes`;
    }

    const hours = Math.floor(diffMin / 60);
    const minutes = diffMin % 60;
    return `${hours}h ${minutes}m`;
  }

  private calculateSubtotal(): Money {
    const total = this.items.reduce((sum, item) => sum + item.subtotal.value, 0);
    return new Money(total);
  }

  private calculateTotal(): Money {
    return new Money(this.subtotal.value + this.delivery_fee.value);
  }

  private recalculateAmounts(): void {
    this.subtotal = this.calculateSubtotal();
    this.total = this.calculateTotal();
  }

  static fake() {
    return OnlineOrderFakeBuilder;
  }

  toJSON() {
    return {
      order_id: this.order_id.id,
      client_id: this.client_id.id,
      items: this.items.map(item => item.toJSON()),
      status: this.status,
      delivery_address: this.delivery_address.toJSON(),
      subtotal: this.subtotal.value,
      delivery_fee: this.delivery_fee.value,
      total: this.total.value,
      payment_method: this.payment_method?.toString() ?? null,
      notes: this.notes,
      estimated_delivery: this.estimated_delivery?.toISOString() ?? null,
      actual_delivery: this.actual_delivery?.toISOString() ?? null,
      created_at: this.created_at.toISOString(),
      updated_at: this.updated_at.toISOString()
    };
  }
}
