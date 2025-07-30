import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsEnum,
  IsArray,
  IsDate,
  IsObject,
  validateSync,
  IsUUID,
  Min,
  Max,
} from 'class-validator';
import { FiscalConfigType } from '../../../domain/fiscal-config.aggregate';

export type CreateFiscalConfigInputConstructorProps = {
  store_id: string;
  config_name: string;
  config_type: FiscalConfigType;
  tax_rate?: number | null;
  applies_to_ncm?: string[];
  applies_to_categories?: string[];
  min_value?: number | null;
  max_value?: number | null;
  start_date?: Date | null;
  end_date?: Date | null;
  is_active?: boolean;
  priority?: number;
  description?: string | null;
  metadata?: Record<string, any> | null;
};

export class CreateFiscalConfigInput {
  @IsUUID()
  @IsNotEmpty()
  store_id: string;

  @IsString()
  @IsNotEmpty()
  config_name: string;

  @IsEnum(FiscalConfigType)
  config_type: FiscalConfigType;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  tax_rate?: number | null;

  @IsArray()
  @IsOptional()
  applies_to_ncm?: string[];

  @IsArray()
  @IsOptional()
  applies_to_categories?: string[];

  @IsNumber()
  @IsOptional()
  @Min(0)
  min_value?: number | null;

  @IsNumber()
  @IsOptional()
  @Min(0)
  max_value?: number | null;

  @IsDate()
  @IsOptional()
  start_date?: Date | null;

  @IsDate()
  @IsOptional()
  end_date?: Date | null;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(0)
  priority?: number;

  @IsString()
  @IsOptional()
  description?: string | null;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any> | null;

  constructor(props: CreateFiscalConfigInputConstructorProps) {
    if (!props) return;
    this.store_id = props.store_id;
    this.config_name = props.config_name;
    this.config_type = props.config_type;
    this.tax_rate = props.tax_rate;
    this.applies_to_ncm = props.applies_to_ncm;
    this.applies_to_categories = props.applies_to_categories;
    this.min_value = props.min_value;
    this.max_value = props.max_value;
    this.start_date = props.start_date;
    this.end_date = props.end_date;
    this.is_active = props.is_active;
    this.priority = props.priority;
    this.description = props.description;
    this.metadata = props.metadata;
  }
}

export class ValidateCreateFiscalConfigInput {
  static validate(input: CreateFiscalConfigInput) {
    return validateSync(input);
  }
}