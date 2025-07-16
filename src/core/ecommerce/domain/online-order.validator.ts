import {IsUUID, Min, ArrayMinSize, ValidateNested } from 'class-validator';
import { DeliveryAddress, OnlineOrder, OrderItem, OrderStatus } from './online-order.aggregate';
import { ClassValidatorFields } from '../../shared/domain/validators/class-validator-fields';
import { Notification } from '../../shared/domain/validators/notification';
import { Money } from '@core/shared/domain/value-objects/money.vo';

export class OnlineOrderRules {
  @IsUUID('4', { groups: ['client_id'] })
  client_id: string;

  @ArrayMinSize(1, { groups: ['items'] })
  @ValidateNested({ each: true, groups: ['items'] })
  items: OrderItem[];

  @ValidateNested({ groups: ['delivery_address'] })
  delivery_address: DeliveryAddress;

  @Min(0, { groups: ['delivery_fee'] })
  delivery_fee: Money;

  status?: OrderStatus;

  constructor(entity: OnlineOrder) {
    Object.assign(this, entity);
  }
}

export class OnlineOrderValidator extends ClassValidatorFields {
  validate(notification: Notification, data: any, fields?: string[]): boolean {
    const newFields = fields?.length ? fields : ['client_id', 'items', 'delivery_address', 'delivery_fee'];
    return super.validate(notification, new OnlineOrderRules(data), newFields);
  }
}

export class OnlineOrderValidatorFactory {
  static create() {
    return new OnlineOrderValidator();
  }
}