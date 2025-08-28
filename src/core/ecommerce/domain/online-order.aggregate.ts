import { AggregateRoot } from '../../shared/domain/aggregate-root';
import { ValueObject } from '../../shared/domain/value-object';
import { Uuid } from '../../shared/domain/value-objects/uuid.vo';
import { Money } from '../../shared/domain/value-objects/money.vo';
import { Quantity, InvalidQuantityError } from '../../shared/domain/value-objects/quantity.vo';
import { Price, InvalidPriceError } from '../../shared/domain/value-objects/price.vo';
import { PaymentMethod, PaymentMethodType } from '../../shared/domain/value-objects/payment-method.vo';
import { InvalidArgumentError } from '../../shared/domain/errors/invalid-argument.error';
import { OrderItemFakeBuilder } from './fake-builders/order-item-fake.builder';
import { DeliveryAddressFakeBuilder } from './fake-builders/delivery-address-fake.builder';
import { OnlineOrderFakeBuilder } from './fake-builders/online-order-fake.builder';
import { OnlineOrderCreatedEvent } from './events/online-order-created.event';
import { OnlineOrderUpdatedEvent } from './events/online-order-updated.event';
import { OnlineOrderConfirmedEvent } from './events/online-order-confirmed.event';
import { OnlineOrderCancelledEvent } from './events/online-order-cancelled.event';
import { OnlineOrderDeliveredEvent } from './events/online-order-delivered.event';

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
  store_id: string;
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
  store_id: string;
  items: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
  }>;
  delivery_address: DeliveryAddressProps;
  delivery_fee: number;
  payment_method?: {
    type: string;
    details?: any;
  };
  notes?: string;
  estimated_delivery?: Date;
};

export class OnlineOrder extends AggregateRoot {
  order_id: OnlineOrderId;
  client_id: Uuid;
  store_id: string;
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
    this.store_id = props.store_id;
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
    this.total = props.total ?? new Money(this.subtotal.value + this.delivery_fee.value);
  }

  static create(props: OnlineOrderCreateCommand): OnlineOrder {
    // Validar store_id
    if (!props.store_id || props.store_id.trim() === '') {
      throw new Error('store_id should not be empty');
    }

    // Validar client_id
    if (!props.client_id || props.client_id.trim() === '') {
      throw new Error('client_id should not be empty');
    }

    // Validar itens
    if (!props.items || props.items.length === 0) {
      throw new InvalidArgumentError('items should not be empty');
    }

    const orderItems = props.items.map((item, index) => {
      if (!item.product_id || String(item.product_id).trim() === '') {
        throw new Error('product_id should not be empty');
      }
      if (!item.product_name || String(item.product_name).trim() === '') {
        throw new Error('product_name should not be empty');
      }
      if (!item.quantity || item.quantity <= 0) {
        throw new InvalidQuantityError('quantity must be greater than 0');
      }
      if (!item.unit_price || item.unit_price <= 0) {
         throw new InvalidPriceError('unit_price must be greater than 0');
       }

      return OrderItem.create({
        product_id: new Uuid(item.product_id),
        product_name: item.product_name,
        quantity: new Quantity(item.quantity),
        unit_price: new Price(item.unit_price)
      });
    });

    // Validar endereço
    if (!props.delivery_address || !props.delivery_address.street || !props.delivery_address.number || 
        !props.delivery_address.neighborhood || !props.delivery_address.city || 
        !props.delivery_address.state || !props.delivery_address.zip_code) {
      throw new Error('street should not be empty');
    }
    const deliveryAddress = DeliveryAddress.create(props.delivery_address);
    
    // Validar método de pagamento
    let paymentMethod: PaymentMethod | null = null;
    if (props.payment_method) {
      const paymentType = props.payment_method.type.toUpperCase() as any;
      if (!Object.values(PaymentMethodType).includes(paymentType)) {
        throw new Error('Invalid payment method type');
      }
      paymentMethod = new PaymentMethod(paymentType, props.payment_method.details);
    }

    if (props.delivery_fee < 0) {
      throw new InvalidArgumentError('delivery_fee must be greater than or equal to 0');
    }

    const order = new OnlineOrder({
      client_id: new Uuid(props.client_id),
      store_id: props.store_id,
      items: orderItems,
      delivery_address: deliveryAddress,
      delivery_fee: new Money(props.delivery_fee),
      payment_method: paymentMethod,
      notes: props.notes ?? null,
      estimated_delivery: props.estimated_delivery ?? null
    });

    order.applyEvent(new OnlineOrderCreatedEvent({
      aggregate_id: order.order_id,
      order_id: order.order_id,
      client_id: order.client_id,
      store_id: order.store_id,
      items: order.items,
      status: order.status,
      delivery_address: order.delivery_address,
      subtotal: order.subtotal,
      delivery_fee: order.delivery_fee,
      total: order.total,
      payment_method: order.payment_method,
      notes: order.notes,
      estimated_delivery: order.estimated_delivery,
      created_at: order.created_at
    }));

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
      throw new Error('Invalid status transition from PENDING to CONFIRMED');
    }

    if (!this.payment_method) {
      throw new Error('Payment method is required to confirm order');
    }

    this.status = OrderStatus.CONFIRMED;
    this.updated_at = new Date();
    
    this.applyEvent(new OnlineOrderConfirmedEvent({
      aggregate_id: this.order_id,
      order_id: this.order_id,
      client_id: this.client_id,
      store_id: this.store_id,
      confirmed_at: new Date()
    }));
  }

  startPreparing(): void {
    if (this.status !== OrderStatus.CONFIRMED) {
      throw new Error('Invalid status transition from PENDING to PREPARING');
    }

    this.status = OrderStatus.PREPARING;
    this.updated_at = new Date();
  }

  sendForDelivery(): void {
    if (this.status !== OrderStatus.PREPARING) {
      throw new Error('Invalid status transition from PREPARING to OUT_FOR_DELIVERY');
    }

    this.status = OrderStatus.OUT_FOR_DELIVERY;
    this.updated_at = new Date();
  }

  markAsDelivered(): void {
    if (this.status !== OrderStatus.OUT_FOR_DELIVERY) {
      throw new Error('Invalid status transition from OUT_FOR_DELIVERY to DELIVERED');
    }

    this.status = OrderStatus.DELIVERED;
    this.actual_delivery = new Date();
    this.updated_at = new Date();
    
    this.applyEvent(new OnlineOrderDeliveredEvent({
      aggregate_id: this.order_id,
      order_id: this.order_id,
      client_id: this.client_id,
      store_id: this.store_id,
      delivered_at: this.actual_delivery!
    }));
  }

  cancel(reason?: string): void {
    if (![OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(this.status)) {
      throw new Error('Only pending or confirmed orders can be cancelled');
    }

    this.status = OrderStatus.CANCELLED;
    this.updated_at = new Date();
    
    this.applyEvent(new OnlineOrderCancelledEvent({
      aggregate_id: this.order_id,
      order_id: this.order_id,
      client_id: this.client_id,
      store_id: this.store_id,
      reason: reason || null,
      cancelled_at: new Date()
    }));
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

    const oldAddress = this.delivery_address;
    this.delivery_address = newAddress;
    this.updated_at = new Date();
    
    this.applyEvent(new OnlineOrderUpdatedEvent({
      aggregate_id: this.order_id,
      order_id: this.order_id,
      client_id: this.client_id,
      store_id: this.store_id,
      field_changed: 'delivery_address',
      old_value: oldAddress,
      new_value: newAddress,
      updated_at: this.updated_at
    }));
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
      store_id: this.store_id,
      client_id: this.client_id.id,
      items: this.items.map(item => ({
        product_id: item.product_id.id,
        product_name: item.product_name,
        quantity: item.quantity.value,
        unit_price: item.unit_price.value,
        subtotal: item.subtotal.value
      })),
      status: this.status,
      delivery_address: {
        street: this.delivery_address.street,
        number: this.delivery_address.number,
        complement: this.delivery_address.complement,
        neighborhood: this.delivery_address.neighborhood,
        city: this.delivery_address.city,
        state: this.delivery_address.state,
        zip_code: this.delivery_address.zip_code,
        latitude: this.delivery_address.latitude,
        longitude: this.delivery_address.longitude
      },
      subtotal: this.subtotal.value,
      delivery_fee: this.delivery_fee.value,
      total: this.total.value,
      payment_method: this.payment_method ? {
        type: this.payment_method.type,
        details: this.payment_method.details
      } : null,
      notes: this.notes,
      estimated_delivery: this.estimated_delivery,
      actual_delivery: this.actual_delivery,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}
