import { SearchInput } from '@core/shared/application/search-input';
import { SortDirection } from '@core/shared/domain/repository/search-params';
import { UnitType } from '@core/product/domain/product.aggregate';
import { IsOptional, ValidateNested, IsInt, Min, IsEnum, IsBoolean, IsString, IsNumber, IsNotEmpty } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class ListProductsFilter {
  @IsString()
  @IsNotEmpty()
  store_id: string; // Tornar obrigatório, não opcional

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  category_id?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsEnum(UnitType)
  unit_type?: UnitType;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  requires_weighing?: boolean;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  has_stock?: boolean;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  price_min?: number;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  price_max?: number;
}

export class ListProductsInput implements SearchInput<ListProductsFilter> {
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
  @Type(() => ListProductsFilter)
  filter?: ListProductsFilter | null;
}