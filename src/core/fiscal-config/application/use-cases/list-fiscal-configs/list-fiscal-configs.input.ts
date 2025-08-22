import { SearchInput } from '@core/shared/application/search-input';
import { SortDirection } from '@core/shared/domain/repository/search-params';
import { IsOptional, ValidateNested, IsInt, Min, IsEnum, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { FiscalConfigType } from '../../../domain/fiscal-config.aggregate';

export class ListFiscalConfigsFilter {
  config_name?: string;
  store_id: string;
  config_type?: FiscalConfigType;
  is_active?: boolean;
  applies_to_ncm?: string;
  applies_to_categories?: string;
}

export class ListFiscalConfigsInput implements SearchInput<ListFiscalConfigsFilter> {
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  @Min(1)
  per_page?: number;

  @IsOptional()
  sort?: string | null;

  @IsOptional()
  sort_dir?: SortDirection | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => ListFiscalConfigsFilter)
  filter?: ListFiscalConfigsFilter | null;
}