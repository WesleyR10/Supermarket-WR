import { IDomainEvent } from '../../../shared/domain/events/domain-event.interface';
import { ValueObject } from '../../../shared/domain/value-object';
import { OnlineOrder } from '../online-order.aggregate';

export type OnlineOrderCancelledEventProps = {
  aggregate_id: ValueObject;
  order_id: ValueObject;
  store_id: string;
  client_id: ValueObject;
  reason: string | null;
  cancelled_at: Date;
};

export class OnlineOrderCancelledEvent implements IDomainEvent {
  readonly aggregate_id: ValueObject;
  readonly occurred_on: Date;
  readonly event_version: number;

  readonly order_id: ValueObject;
  readonly store_id: string;
  readonly client_id: ValueObject;
  readonly reason: string | null;
  readonly cancelled_at: Date;

  constructor(props: OnlineOrderCancelledEventProps) {
    this.aggregate_id = props.aggregate_id;
    this.order_id = props.order_id;
    this.store_id = props.store_id;
    this.client_id = props.client_id;
    this.reason = props.reason;
    this.cancelled_at = props.cancelled_at;
    this.occurred_on = new Date();
    this.event_version = 1;
  }
}