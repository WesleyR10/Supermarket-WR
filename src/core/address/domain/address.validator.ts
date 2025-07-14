import { MaxLength, MinLength, Matches } from 'class-validator';
import { Address } from './address.aggregate';
import { ClassValidatorFields } from '../../shared/domain/validators/class-validator-fields';
import { Notification } from '../../shared/domain/validators/notification';

export class AddressRules {
  @MinLength(5, { groups: ['street'] })
  @MaxLength(200, { groups: ['street'] })
  street: string;

  @MaxLength(20, { groups: ['number'] })
  number: string;

  @MaxLength(100, { groups: ['complement'] })
  complement?: string | null;

  @MinLength(3, { groups: ['neighborhood'] })
  @MaxLength(100, { groups: ['neighborhood'] })
  neighborhood: string;

  @MinLength(2, { groups: ['city'] })
  @MaxLength(100, { groups: ['city'] })
  city: string;

  @MinLength(2, { groups: ['state'] })
  @MaxLength(2, { groups: ['state'] })
  @Matches(/^[A-Z]{2}$/, { groups: ['state'] })
  state: string;

  @Matches(/^(\d{5}-?\d{3})$/, { groups: ['zipcode'] })
  zipcode: string;

  @MaxLength(50, { groups: ['label'] })
  label?: string | null;

  address_type: string;

  constructor(address: Address) {
    Object.assign(this, address);
  }
}

export class AddressValidator extends ClassValidatorFields {
  validate(notification: Notification, data: any, fields?: string[]): boolean {
    const newFields = fields?.length ? fields : [
      'street',
      'number',
      'neighborhood',
      'city',
      'state',
      'zipcode'
    ];
    
    return super.validate(notification, new AddressRules(data), newFields);
  }
}

export class AddressValidatorFactory {
  static create(): AddressValidator {
    return new AddressValidator();
  }
} 