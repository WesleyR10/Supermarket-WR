import { IsOptional, IsUUID, IsString, IsInt, Min, IsIn, validateSync, IsNotEmpty } from 'class-validator';

export type ListOnlineOrdersInputConstructorProps = {
  store_id: string;
  client_id?: string;
  status?: string;
  page?: number;
  per_page?: number;
  sort?: string;
  sort_dir?: 'asc' | 'desc';
};

export class ListOnlineOrdersInput {
  @IsUUID('4')
  @IsNotEmpty()
  store_id: string;

  @IsUUID('4')
  @IsOptional()
  client_id?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @IsInt()
  @Min(1)
  @IsOptional()
  per_page?: number = 15;

  @IsString()
  @IsOptional()
  sort?: string = 'created_at';

  @IsString()
  @IsIn(['asc', 'desc'])
  @IsOptional()
  sort_dir?: 'asc' | 'desc' = 'desc';

  constructor(props: ListOnlineOrdersInputConstructorProps) {
    this.store_id = props.store_id;
    this.client_id = props.client_id;
    this.status = props.status;
    this.page = props.page ?? 1;
    this.per_page = props.per_page ?? 15;
    this.sort = props.sort ?? 'created_at';
    this.sort_dir = props.sort_dir ?? 'desc';
  }
}

export class ValidateListOnlineOrdersInput {
  static validate(input: ListOnlineOrdersInput) {
    return validateSync(input);
  }
}