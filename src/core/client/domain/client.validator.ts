import { MaxLength, MinLength, Min, Max, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { Client } from './client.aggregate';
import { ClassValidatorFields } from '../../shared/domain/validators/class-validator-fields';
import { Notification } from '../../shared/domain/validators/notification';

export class ClientRules {
  @IsString({ groups: ['user_id'] })
  @IsNotEmpty({ groups: ['user_id'] })
  user_id: string;

  @IsString({ groups: ['store_id'] })
  @IsNotEmpty({ groups: ['store_id'] })
  store_id: string;

  @Min(0, { groups: ['loyalty_points'] })
  @Max(1000000, { groups: ['loyalty_points'] })
  loyalty_points: number;

  @IsOptional({ groups: ['loyalty_card_number'] })
  @MaxLength(50, { groups: ['loyalty_card_number'] })
  loyalty_card_number?: string | null;

  @Min(0, { groups: ['total_purchases'] })
  @Max(100000, { groups: ['total_purchases'] })
  total_purchases: number;

  @IsOptional({ groups: ['avg_monthly_spending'] })
  @Min(0, { groups: ['avg_monthly_spending'] })
  @Max(100000, { groups: ['avg_monthly_spending'] })
  avg_monthly_spending?: number | null;

  @IsOptional({ groups: ['credit_limit'] })
  @Min(0, { groups: ['credit_limit'] })
  @Max(50000, { groups: ['credit_limit'] })
  credit_limit?: number | null;

  @IsOptional({ groups: ['registration_source'] })
  @MaxLength(100, { groups: ['registration_source'] })
  registration_source?: string | null;

  @IsOptional({ groups: ['notes'] })
  @MaxLength(1000, { groups: ['notes'] })
  notes?: string | null;

  @IsString({ groups: ['customer_type'] })
  @IsNotEmpty({ groups: ['customer_type'] })
  customer_type: string;

  @IsString({ groups: ['loyalty_level'] })
  @IsNotEmpty({ groups: ['loyalty_level'] })
  loyalty_level: string;

  @IsString({ groups: ['preferred_contact_method'] })
  @IsNotEmpty({ groups: ['preferred_contact_method'] })
  preferred_contact_method: string;

  @IsString({ groups: ['payment_preference'] })
  @IsNotEmpty({ groups: ['payment_preference'] })
  payment_preference: string;

  @IsString({ groups: ['delivery_preference'] })
  @IsNotEmpty({ groups: ['delivery_preference'] })
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
      'store_id',
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