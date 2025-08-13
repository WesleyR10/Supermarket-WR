import { SearchInput } from '../../../../shared/application/search-input';
import { SortDirection } from '../../../../shared/domain/repository/search-params';
import { IsBoolean, IsNumber, IsOptional, IsString, ValidateNested, validateSync } from 'class-validator';

export class ListInventoriesFilter {
  @IsString()
  store_id: string;

  @IsOptional()
  @IsString()
  product_id?: string;

  @IsOptional()
  @IsString()
  location?: string;

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
  min_quantity?: number;

  @IsOptional()
  @IsNumber()
  max_quantity?: number;
  
  @IsOptional()
  @IsNumber()
  unit_price_min?: number;
  
  @IsOptional()
  @IsNumber()
  unit_price_max?: number;
}

export class ListInventoriesInput implements SearchInput<ListInventoriesFilter> {
  page?: number;
  per_page?: number;
  sort?: string;
  sort_dir?: SortDirection;
  @ValidateNested()
  filter!: ListInventoriesFilter;
}

export class ValidateListInventoriesInput {
  static validate(input: ListInventoriesInput) {
    return validateSync(input);
  }
}