import { SearchInput } from '@core/shared/application/search-input';
import { SortDirection } from '@core/shared/domain/repository/search-params';
import { StoreStatus } from '@core/store/domain/store.aggregate';
import { IsOptional, ValidateNested, IsInt, Min, IsEnum, IsBoolean, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class ListStoresFilter {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  cnpj?: string;

  @IsOptional()
  @IsEnum(StoreStatus)
  status?: StoreStatus;

  @IsOptional()
  @IsEnum(['BASIC', 'PREMIUM', 'ENTERPRISE'])
  plan_type?: 'BASIC' | 'PREMIUM' | 'ENTERPRISE';

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  is_trial?: boolean;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;
}

export class ListStoresInput implements SearchInput<ListStoresFilter> {
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
  @Type(() => ListStoresFilter)
  filter?: ListStoresFilter | null;
}