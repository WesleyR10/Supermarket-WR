import { IDomainEvent } from '../../../shared/domain/events/domain-event.interface';
import { ValueObject } from '../../../shared/domain/value-object';
import { Cart } from '../cart.aggregate';

export class CartClearedEvent implements IDomainEvent {
  readonly aggregate_id: ValueObject;
  readonly occurred_on: Date;
  readonly event_version: number;

  constructor(
    cart: Cart,
    occurred_on?: Date
  ) {
    this.aggregate_id = cart.cart_id;
    this.occurred_on = occurred_on ?? new Date();
    this.event_version = 1;
  }
}