import { IDomainEvent } from '../../../shared/domain/events/domain-event.interface';
import { ValueObject } from '../../../shared/domain/value-object';
import { OnlineOrder } from '../online-order.aggregate';

export type OnlineOrderUpdatedEventProps = {
  aggregate_id: ValueObject;
  order_id: ValueObject;
  store_id: string;
  client_id: ValueObject;
  field_changed: string;
  old_value: any;
  new_value: any;
  updated_at: Date;
};

export class OnlineOrderUpdatedEvent implements IDomainEvent {
  readonly aggregate_id: ValueObject;
  readonly occurred_on: Date;
  readonly event_version: number;

  readonly order_id: ValueObject;
  readonly store_id: string;
  readonly client_id: ValueObject;
  readonly field_changed: string;
  readonly old_value: any;
  readonly new_value: any;
  readonly updated_at: Date;

  constructor(props: OnlineOrderUpdatedEventProps) {
    this.aggregate_id = props.aggregate_id;
    this.order_id = props.order_id;
    this.store_id = props.store_id;
    this.client_id = props.client_id;
    this.field_changed = props.field_changed;
    this.old_value = props.old_value;
    this.new_value = props.new_value;
    this.updated_at = props.updated_at;
    this.occurred_on = new Date();
    this.event_version = 1;
  }
}