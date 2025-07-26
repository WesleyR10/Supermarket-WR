import { SearchInput } from '@core/shared/application/search-input';
import { SortDirection } from '@core/shared/domain/repository/search-params';
import { AddressType, AddressStatus } from '@core/address/domain/address.aggregate';
import { IsOptional, ValidateNested, IsInt, Min, IsEnum, IsBoolean, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class ListAddressesFilter {
  @IsOptional()
  @IsString()
  client_id?: string;

  @IsOptional()
  @IsString()
  store_id?: string;

  @IsOptional()
  @IsString()
  supplier_id?: string;

  @IsOptional()
  @IsEnum(AddressType)
  address_type?: AddressType;

  @IsOptional()
  @IsEnum(AddressStatus)
  status?: AddressStatus;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  is_primary?: boolean;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  zipcode?: string;
}

export class ListAddressesInput implements SearchInput<ListAddressesFilter> {
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
  @Type(() => ListAddressesFilter)
  filter?: ListAddressesFilter | null;
}