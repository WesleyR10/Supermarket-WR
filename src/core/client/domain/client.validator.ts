import { MaxLength, MinLength, Min, Max, IsUUID, IsNotEmpty } from 'class-validator';
import { Client } from './client.aggregate';
import { ClassValidatorFields } from '../../shared/domain/validators/class-validator-fields';
import { Notification } from '../../shared/domain/validators/notification';

export class ClientRules {
  @IsUUID()
  @IsNotEmpty()
  user_id: string;

  @IsUUID()
  @IsNotEmpty()
  stores_id: string;

  @Min(0, { groups: ['loyalty_points'] })
  @Max(1000000, { groups: ['loyalty_points'] })
  loyalty_points: number;

  @MaxLength(50, { groups: ['loyalty_card_number'] })
  loyalty_card_number?: string | null;

  @Min(0, { groups: ['total_purchases'] })
  @Max(100000, { groups: ['total_purchases'] })
  total_purchases: number;

  @Min(0, { groups: ['avg_monthly_spending'] })
  @Max(100000, { groups: ['avg_monthly_spending'] })
  avg_monthly_spending?: number | null;

  @Min(0, { groups: ['credit_limit'] })
  @Max(50000, { groups: ['credit_limit'] })
  credit_limit?: number | null;

  @MaxLength(100, { groups: ['registration_source'] })
  registration_source?: string | null;

  @MaxLength(1000, { groups: ['notes'] })
  notes?: string | null;
  customer_type: string;
  loyalty_level: string;
  preferred_contact_method: string;
  payment_preference: string;
  delivery_preference: string;
  allows_promotions: boolean;
  allows_sms: boolean;
  allows_email: boolean;
  is_active: boolean;

  constructor(client: Client) {
    Object.assign(this, client);
  }
}

export class ClientValidator extends ClassValidatorFields {
  validate(notification: Notification, data: any, fields?: string[]): boolean {
    const newFields = fields?.length ? fields : [
      'user_id',
      'stores_id',
      'loyalty_points',
      'loyalty_card_number',
      'total_purchases',
      'avg_monthly_spending',
      'credit_limit',
      'registration_source',
      'notes'
    ];
    
    return super.validate(notification, new ClientRules(data), newFields);
  }
}

export class ClientValidatorFactory {
  static create(): ClientValidator {
    return new ClientValidator();
  }
} 