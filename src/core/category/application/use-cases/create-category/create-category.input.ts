import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsEnum,
  validateSync,
} from 'class-validator';

export type CreateCategoryInputConstructorProps = {
  name: string;
  description?: string | null;
  is_active?: boolean;
  parent_category_id?: string | null;
  tax_rate?: number | null;
  default_margin_percentage?: number | null;
  requires_expiry_date?: boolean;
  display_order?: number;
  icon_name?: string | null;
};

export class CreateCategoryInput {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string | null;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  @IsString()
  @IsOptional()
  parent_category_id?: string | null;

  @IsNumber()
  @IsOptional()
  tax_rate?: number | null;

  @IsNumber()
  @IsOptional()
  default_margin_percentage?: number | null;

  @IsBoolean()
  @IsOptional()
  requires_expiry_date?: boolean;

  @IsNumber()
  @IsOptional()
  display_order?: number;

  @IsString()
  @IsOptional()
  icon_name?: string | null;

  constructor(props: CreateCategoryInputConstructorProps) {
    if (!props) return;
    this.name = props.name;
    this.description = props.description;
    this.is_active = props.is_active;
    this.parent_category_id = props.parent_category_id;
    this.tax_rate = props.tax_rate;
    this.default_margin_percentage = props.default_margin_percentage;
    this.requires_expiry_date = props.requires_expiry_date;
    this.display_order = props.display_order;
    this.icon_name = props.icon_name;
  }
}

export class ValidateCreateCategoryInput {
  static validate(input: CreateCategoryInput) {
    return validateSync(input);
  }
} 