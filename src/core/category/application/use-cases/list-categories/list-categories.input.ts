import { SearchInput } from '@core/shared/application/search-input';
import { SortDirection } from '@core/shared/domain/repository/search-params';
import { IsOptional, ValidateNested, IsInt, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class ListCategoriesFilter {
  name?: string;
  store_id: string;
}

export class ListCategoriesInput implements SearchInput<ListCategoriesFilter> {
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
  @Type(() => ListCategoriesFilter)
  filter?: ListCategoriesFilter | null;
}