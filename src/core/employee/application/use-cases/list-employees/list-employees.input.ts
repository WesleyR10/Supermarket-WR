import { SearchInput } from '@core/shared/application/search-input';
import { SortDirection } from '@core/shared/domain/repository/search-params';
import { EmployeeRole, EmployeeDepartment } from '@core/employee/domain/employee.enums';
import { IsOptional, ValidateNested, IsInt, Min, IsEnum, IsBoolean, IsString, IsNumber, IsNotEmpty, IsDateString } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class ListEmployeesFilter {
  @IsString()
  @IsNotEmpty()
  store_id: string; // Obrigatório para multi-tenancy

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsEnum(EmployeeRole)
  role?: EmployeeRole;

  @IsOptional()
  @IsEnum(EmployeeDepartment)
  department?: EmployeeDepartment;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsString()
  employee_code?: string;

  @IsOptional()
  @IsDateString()
  hired_after?: string;

  @IsOptional()
  @IsDateString()
  hired_before?: string;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  salary_min?: number;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  salary_max?: number;
}

export class ListEmployeesInput implements SearchInput<ListEmployeesFilter> {
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
  @Type(() => ListEmployeesFilter)
  filter?: ListEmployeesFilter | null;
}