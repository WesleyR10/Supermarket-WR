import { SearchInput } from '../../../../shared/application/search-input';
import { SortDirection } from '../../../../shared/domain/repository/search-params';
import { IsBoolean, IsDateString, IsNumber, IsOptional, IsString, IsUUID, ValidateNested, validateSync } from 'class-validator';

export class ListInventoriesFilter {
  @IsOptional()
  @IsString()
  store_id?: string;

  @IsOptional()
  @IsString()
  product_id?: string;

  @IsOptional()
  @IsString()
  location_code?: string;

  @IsOptional()
  @IsString()
  supplier_id?: string;

  @IsOptional()
  @IsString()
  batch_number?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsBoolean()
  low_stock?: boolean;

  @IsOptional()
  @IsBoolean()
  out_of_stock?: boolean;

  @IsOptional()
  @IsBoolean()
  expired?: boolean;

  @IsOptional()
  @IsBoolean()
  near_expiry?: boolean;

  @IsOptional()
  @IsNumber()
  quantity_min?: number;

  @IsOptional()
  @IsNumber()
  quantity_max?: number;

  @IsOptional()
  @IsNumber()
  unit_cost_min?: number;

  @IsOptional()
  @IsNumber()
  unit_cost_max?: number;

  @IsOptional()
  @IsNumber()
  unit_price_min?: number;

  @IsOptional()
  @IsNumber()
  unit_price_max?: number;

  @IsOptional()
  @IsDateString()
  expiry_date_from?: Date;

  @IsOptional()
  @IsDateString()
  expiry_date_to?: Date;
}

export class ListInventoriesInput implements SearchInput<ListInventoriesFilter> {
  page?: number;
  per_page?: number;
  sort?: string;
  sort_dir?: SortDirection;
  @ValidateNested()
  filter?: ListInventoriesFilter;
}

export class ValidateListInventoriesInput {
  static validate(input: ListInventoriesInput) {
    return validateSync(input);
  }
}