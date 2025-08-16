import { SearchInput } from '../../../../shared/application/search-input';
import { SortDirection } from '../../../../shared/domain/repository/search-params';
import { SaleStatus, PaymentMethod } from '../../../domain/sale.aggregate';
import {
  IsOptional,
  ValidateNested,
  IsInt,
  Min,
  IsEnum,
  IsString,
  IsNumber,
  IsNotEmpty,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class ListSalesFilter {
  @IsString()
  @IsNotEmpty()
  store_id: string;

  @IsOptional()
  @IsString()
  customer_id?: string;

  @IsOptional()
  @IsString()
  cashier_id?: string;

  @IsOptional()
  @IsEnum(SaleStatus)
  status?: SaleStatus;

  @IsOptional()
  @IsEnum(PaymentMethod)
  payment_method?: PaymentMethod;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber({ allowInfinity: false, allowNaN: false })
  register_number?: number;

  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  date_from?: Date;

  @IsOptional()
  @Transform(({ value }) => (value ? new Date(value) : undefined))
  date_to?: Date;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({ maxDecimalPlaces: 2, allowInfinity: false, allowNaN: false })
  total_min?: number;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber({ maxDecimalPlaces: 2, allowInfinity: false, allowNaN: false })
  total_max?: number;
}

export class ListSalesInput implements SearchInput<ListSalesFilter> {
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
  @Type(() => ListSalesFilter)
  filter?: ListSalesFilter | null;
}