import { SearchInput } from '@core/shared/application/search-input';
import { SortDirection } from '@core/shared/domain/repository/search-params';
import { CustomerType, LoyaltyLevel } from '../../../domain/client.aggregate';
import {
  IsOptional,
  ValidateNested,
  IsInt,
  Min,
  IsEnum,
  IsBoolean,
  IsString,
  IsNotEmpty,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class ListClientsFilter {
  @IsString()
  @IsNotEmpty()
  stores_id: string;

  @IsOptional()
  @IsString()
  filter?: string;

  @IsOptional()
  @IsEnum(CustomerType)
  customer_type?: CustomerType;

  @IsOptional()
  @IsEnum(LoyaltyLevel)
  loyalty_level?: LoyaltyLevel;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  is_active?: boolean;
}

export class ListClientsInput implements SearchInput<ListClientsFilter> {
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
  @Type(() => ListClientsFilter)
  filter?: ListClientsFilter | null;

  constructor(props?: Partial<ListClientsInput>) {
    if (!props) return;
    this.page = props.page as any;
    this.per_page = props.per_page as any;
    this.sort = (props.sort ?? null) as any;
    this.sort_dir = props.sort_dir as any;
    if (props.filter) {
      const f = new ListClientsFilter();
      const pf: any = props.filter as any;
      f.stores_id = pf.stores_id;
      f.filter = pf.filter;
      f.customer_type = pf.customer_type;
      f.loyalty_level = pf.loyalty_level;
      f.is_active = pf.is_active as any;
      this.filter = f;
    } else {
      this.filter = null;
    }
  }
}