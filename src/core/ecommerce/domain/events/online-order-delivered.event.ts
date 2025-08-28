import { IDomainEvent } from '../../../shared/domain/events/domain-event.interface';
import { ValueObject } from '../../../shared/domain/value-object';
import { OnlineOrder } from '../online-order.aggregate';

export type OnlineOrderDeliveredEventProps = {
  aggregate_id: ValueObject;
  order_id: ValueObject;
  store_id: string;
  client_id: ValueObject;
  delivered_at: Date;
};

export class OnlineOrderDeliveredEvent implements IDomainEvent {
  readonly aggregate_id: ValueObject;
  readonly occurred_on: Date;
  readonly event_version: number;

  readonly order_id: ValueObject;
  readonly store_id: string;
  readonly client_id: ValueObject;
  readonly delivered_at: Date;

  constructor(props: OnlineOrderDeliveredEventProps) {
    this.aggregate_id = props.aggregate_id;
    this.order_id = props.order_id;
    this.store_id = props.store_id;
    this.client_id = props.client_id;
    this.delivered_at = props.delivered_at;
    this.occurred_on = new Date();
    this.event_version = 1;
  }
}