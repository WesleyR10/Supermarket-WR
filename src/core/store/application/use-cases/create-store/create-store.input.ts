import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsObject,
  ValidateNested,
  validateSync,
} from 'class-validator';

class BusinessHoursInput {
  @IsString()
  @IsNotEmpty()
  open: string;

  @IsString()
  @IsNotEmpty()
  close: string;

  @IsBoolean()
  closed: boolean;
}

class SalesConfigInput {
  @IsBoolean()
  @IsOptional()
  allow_negative_stock?: boolean;

  @IsBoolean()
  @IsOptional()
  auto_approve_sales?: boolean;

  @IsNumber()
  @IsOptional()
  max_discount_percentage?: number;

  @IsBoolean()
  @IsOptional()
  require_customer_identification?: boolean;
}

class InventoryConfigInput {
  @IsNumber()
  @IsOptional()
  low_stock_threshold?: number;

  @IsBoolean()
  @IsOptional()
  auto_reorder?: boolean;

  @IsBoolean()
  @IsOptional()
  track_expiry_dates?: boolean;
}

class FiscalConfigInput {
  @IsEnum(['SIMPLES', 'LUCRO_PRESUMIDO', 'LUCRO_REAL'])
  @IsOptional()
  tax_regime?: 'SIMPLES' | 'LUCRO_PRESUMIDO' | 'LUCRO_REAL';

  @IsBoolean()
  @IsOptional()
  issue_nfe?: boolean;

  @IsString()
  @IsOptional()
  municipal_inscription?: string | null;

  @IsString()
  @IsOptional()
  state_inscription?: string | null;
}

class NotificationConfigInput {
  @IsBoolean()
  @IsOptional()
  email_notifications?: boolean;

  @IsBoolean()
  @IsOptional()
  sms_notifications?: boolean;

  @IsBoolean()
  @IsOptional()
  low_stock_alerts?: boolean;

  @IsBoolean()
  @IsOptional()
  sales_reports?: boolean;
}

export type CreateStoreInputConstructorProps = {
  name: string;
  cnpj: string;
  business_hours?: {
    monday?: BusinessHoursInput;
    tuesday?: BusinessHoursInput;
    wednesday?: BusinessHoursInput;
    thursday?: BusinessHoursInput;
    friday?: BusinessHoursInput;
    saturday?: BusinessHoursInput;
    sunday?: BusinessHoursInput;
  };
  sales_config?: SalesConfigInput;
  inventory_config?: InventoryConfigInput;
  fiscal_config?: FiscalConfigInput;
  notification_config?: NotificationConfigInput;
  plan_type?: 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
  is_trial?: boolean;
};

export class CreateStoreInput {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  cnpj: string;

  @IsObject()
  @IsOptional()
  business_hours?: {
    monday?: BusinessHoursInput;
    tuesday?: BusinessHoursInput;
    wednesday?: BusinessHoursInput;
    thursday?: BusinessHoursInput;
    friday?: BusinessHoursInput;
    saturday?: BusinessHoursInput;
    sunday?: BusinessHoursInput;
  };

  @IsObject()
  @IsOptional()
  sales_config?: SalesConfigInput;

  @IsObject()
  @IsOptional()
  inventory_config?: InventoryConfigInput;

  @IsObject()
  @IsOptional()
  fiscal_config?: FiscalConfigInput;

  @IsObject()
  @IsOptional()
  notification_config?: NotificationConfigInput;

  @IsEnum(['BASIC', 'PREMIUM', 'ENTERPRISE'])
  @IsOptional()
  plan_type?: 'BASIC' | 'PREMIUM' | 'ENTERPRISE';

  @IsBoolean()
  @IsOptional()
  is_trial?: boolean;

  constructor(props: CreateStoreInputConstructorProps) {
    if (!props) return;
    this.name = props.name;
    this.cnpj = props.cnpj;
    this.business_hours = props.business_hours;
    this.sales_config = props.sales_config;
    this.inventory_config = props.inventory_config;
    this.fiscal_config = props.fiscal_config;
    this.notification_config = props.notification_config;
    this.plan_type = props.plan_type;
    this.is_trial = props.is_trial;
  }
}

export class ValidateCreateStoreInput {
  static validate(input: CreateStoreInput) {
    return validateSync(input);
  }
}