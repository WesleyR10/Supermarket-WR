import { AggregateRoot } from '../../shared/domain/aggregate-root';
import { ValueObject } from '../../shared/domain/value-object';
import { Uuid } from '../../shared/domain/value-objects/uuid.vo';
import { Money } from '../../shared/domain/value-objects/money.vo';
import { Quantity } from '../../shared/domain/value-objects/quantity.vo';
import { Price } from '../../shared/domain/value-objects/price.vo';
import { PaymentMethod, PaymentMethodType } from '../../shared/domain/value-objects/payment-method.vo';
// import { OnlineOrderFakeBuilder } from './online-order-fake.builder';
// import { OnlineOrderValidatorFactory } from './online-order.validator';

export class OnlineOrderId extends Uuid {}

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
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
    // TODO: Implementar validator quando criado
    // const validator = OnlineOrderValidatorFactory.create();
    // return validator.validate(this.notification, this, fields);
    return true;
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
      this.notification.addError('Only confirmed orders can start preparing', 'status');
      return;
    }

    this.status = OrderStatus.PREPARING;
    this.updated_at = new Date();
  }

  sendForDelivery(): void {
    if (this.status !== OrderStatus.PREPARING) {
      this.notification.addError('Only preparing orders can be sent for delivery', 'status');
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
    if ([OrderStatus.DELIVERED, OrderStatus.CANCELLED].includes(this.status)) {
      this.notification.addError('Cannot cancel delivered or already cancelled orders', 'status');
      return;
    }

    this.status = OrderStatus.CANCELLED;
    this.updated_at = new Date();
  }

  setPaymentMethod(paymentMethod: PaymentMethod): void {
    this.payment_method = paymentMethod;
    this.updated_at = new Date();
  }

  updateDeliveryAddress(newAddress: DeliveryAddress): void {
    if (this.status !== OrderStatus.PENDING) {
      this.notification.addError('Cannot update delivery address for non-pending orders', 'status');
      return;
    }

    this.delivery_address = newAddress;
    this.updated_at = new Date();
  }

  updateNotes(notes: string | null): void {
    this.notes = notes;
    this.updated_at = new Date();
  }

  updateEstimatedDelivery(estimatedDelivery: Date | null): void {
    this.estimated_delivery = estimatedDelivery;
    this.updated_at = new Date();
  }

  // REGRAS DE NEGÓCIO ESPECÍFICAS DO E-COMMERCE

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
    return this.status === OrderStatus.PENDING;
  }

  canBeCancelled(): boolean {
    return ![OrderStatus.DELIVERED, OrderStatus.CANCELLED].includes(this.status);
  }

  hasPaymentMethod(): boolean {
    return this.payment_method !== null;
  }

  isReadyForConfirmation(): boolean {
    return this.isPending() && this.hasPaymentMethod() && this.items.length > 0;
  }

  getItemCount(): number {
    return this.items.reduce((count, item) => count + item.quantity.value, 0);
  }

  getUniqueItemsCount(): number {
    return this.items.length;
  }

  hasItem(productId: Uuid): boolean {
    return this.items.some(item => item.product_id.equals(productId));
  }

  getItem(productId: Uuid): OrderItem | null {
    return this.items.find(item => item.product_id.equals(productId)) || null;
  }

  isExpressDelivery(): boolean {
    if (!this.estimated_delivery) return false;
    const now = new Date();
    const diffHours = (this.estimated_delivery.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffHours <= 2; // Express se entrega em até 2 horas
  }

  isScheduledDelivery(): boolean {
    if (!this.estimated_delivery) return false;
    const now = new Date();
    return this.estimated_delivery.getTime() > now.getTime();
  }

  getDeliveryTimeEstimate(): string {
    if (!this.estimated_delivery) return 'Não informado';
    
    const now = new Date();
    const diffMinutes = Math.floor((this.estimated_delivery.getTime() - now.getTime()) / (1000 * 60));
    
    if (diffMinutes < 0) return 'Atrasado';
    if (diffMinutes < 60) return `${diffMinutes} minutos`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} horas`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} dias`;
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

  // TODO: Implementar fake builder quando criado
  // static fake(): OnlineOrderFakeBuilder {
  //   return OnlineOrderFakeBuilder.anOnlineOrder();
  // }

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
      payment_method: this.payment_method?.type || null,
      notes: this.notes,
      estimated_delivery: this.estimated_delivery?.toISOString() || null,
      actual_delivery: this.actual_delivery?.toISOString() || null,
      created_at: this.created_at.toISOString(),
      updated_at: this.updated_at.toISOString()
    };
  }
}
