import { IDomainEvent } from '../../../shared/domain/events/domain-event.interface';
import { ValueObject } from '../../../shared/domain/value-object';
import { OnlineOrder } from '../online-order.aggregate';

export type OnlineOrderPaymentProcessedEventProps = {
  order_id: ValueObject;
  store_id: string;
  client_id: ValueObject;
  payment_status: string;
  transaction_id?: string;
  total: number;
  processed_at: Date;
};

export class OnlineOrderPaymentProcessedEvent implements IDomainEvent {
  readonly aggregate_id: ValueObject;
  readonly occurred_on: Date;
  readonly event_version: number;

  readonly order_id: ValueObject;
  readonly store_id: string;
  readonly client_id: ValueObject;
  readonly payment_status: string;
  readonly transaction_id?: string;
  readonly total: number;
  readonly processed_at: Date;

  constructor(props: OnlineOrderPaymentProcessedEventProps) {
    this.aggregate_id = props.order_id;
    this.order_id = props.order_id;
    this.store_id = props.store_id;
    this.client_id = props.client_id;
    this.payment_status = props.payment_status;
    this.transaction_id = props.transaction_id;
    this.total = props.total;
    this.processed_at = props.processed_at;
    this.occurred_on = new Date();
    this.event_version = 1;
  }
}