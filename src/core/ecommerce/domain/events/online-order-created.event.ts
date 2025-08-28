import { IDomainEvent } from '../../../shared/domain/events/domain-event.interface';
import { ValueObject } from '../../../shared/domain/value-object';
import { OnlineOrder } from '../online-order.aggregate';

export type OnlineOrderCreatedEventProps = {
  aggregate_id: ValueObject;
  order_id: ValueObject;
  client_id: ValueObject;
  store_id: string;
  items: any[];
  status: string;
  delivery_address: any;
  subtotal: any;
  delivery_fee: any;
  total: any;
  payment_method: any;
  notes: string | null;
  estimated_delivery: Date | null;
  created_at: Date;
};

export class OnlineOrderCreatedEvent implements IDomainEvent {
  readonly aggregate_id: ValueObject;
  readonly occurred_on: Date;
  readonly event_version: number;

  readonly order_id: ValueObject;
  readonly client_id: ValueObject;
  readonly store_id: string;
  readonly items: any[];
  readonly status: string;
  readonly delivery_address: any;
  readonly subtotal: any;
  readonly delivery_fee: any;
  readonly total: any;
  readonly payment_method: any;
  readonly notes: string | null;
  readonly estimated_delivery: Date | null;
  readonly created_at: Date;

  constructor(props: OnlineOrderCreatedEventProps) {
    this.aggregate_id = props.aggregate_id;
    this.order_id = props.order_id;
    this.client_id = props.client_id;
    this.store_id = props.store_id;
    this.items = props.items;
    this.status = props.status;
    this.delivery_address = props.delivery_address;
    this.subtotal = props.subtotal;
    this.delivery_fee = props.delivery_fee;
    this.total = props.total;
    this.payment_method = props.payment_method;
    this.notes = props.notes;
    this.estimated_delivery = props.estimated_delivery;
    this.created_at = props.created_at;
    this.occurred_on = new Date();
    this.event_version = 1;
  }
}