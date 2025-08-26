import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsEnum,
  validateSync,
  Min,
  Max,
} from 'class-validator';
import {
  CustomerType,
  ContactMethod,
  PaymentPreference,
  DeliveryPreference,
} from '../../../domain/client.aggregate';

export type CreateClientInputConstructorProps = {
  user_id: string;
  store_id: string;
  customer_type?: CustomerType;
  credit_limit?: number | null;
  preferred_contact_method?: ContactMethod;
  allows_promotions?: boolean;
  allows_sms?: boolean;
  allows_email?: boolean;
  payment_preference?: PaymentPreference;
  delivery_preference?: DeliveryPreference;
  registration_source?: string | null;
  notes?: string | null;
};

export class CreateClientInput {
  @IsString()
  @IsNotEmpty()
  user_id: string;

  @IsString()
  @IsNotEmpty()
  store_id: string;

  @IsEnum(CustomerType)
  @IsOptional()
  customer_type?: CustomerType;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(50000)
  credit_limit?: number | null;

  @IsEnum(ContactMethod)
  @IsOptional()
  preferred_contact_method?: ContactMethod;

  @IsBoolean()
  @IsOptional()
  allows_promotions?: boolean;

  @IsBoolean()
  @IsOptional()
  allows_sms?: boolean;

  @IsBoolean()
  @IsOptional()
  allows_email?: boolean;

  @IsEnum(PaymentPreference)
  @IsOptional()
  payment_preference?: PaymentPreference;

  @IsEnum(DeliveryPreference)
  @IsOptional()
  delivery_preference?: DeliveryPreference;

  @IsString()
  @IsOptional()
  registration_source?: string | null;

  @IsString()
  @IsOptional()
  notes?: string | null;

  constructor(props?: CreateClientInputConstructorProps) {
    if (!props) return;
    this.user_id = props.user_id;
    this.store_id = props.store_id;
    this.customer_type = props.customer_type;
    this.credit_limit = props.credit_limit;
    this.preferred_contact_method = props.preferred_contact_method;
    this.allows_promotions = props.allows_promotions;
    this.allows_sms = props.allows_sms;
    this.allows_email = props.allows_email;
    this.payment_preference = props.payment_preference;
    this.delivery_preference = props.delivery_preference;
    this.registration_source = props.registration_source;
    this.notes = props.notes;
  }
}

export class ValidateCreateClientInput {
  static validate(input: CreateClientInput) {
    return validateSync(input);
  }
}