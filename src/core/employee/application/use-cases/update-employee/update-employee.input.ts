import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsEnum,
  IsObject,
  validateSync,
} from 'class-validator';
import { EmployeeRole, EmployeeDepartment } from '../../../domain/employee.enums';

export type UpdateEmployeeInputConstructorProps = {
  id: string;
  store_id: string;
  name?: string;
  email?: string;
  employee_code?: string | null;
  role?: EmployeeRole;
  department?: EmployeeDepartment;
  permissions?: Record<string, any> | null;
  schedule?: Record<string, any> | null;
  salary?: number | null;
  is_active?: boolean;
};

export class UpdateEmployeeInput {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  store_id: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  employee_code?: string | null;

  @IsEnum(EmployeeRole)
  @IsOptional()
  role?: EmployeeRole;

  @IsEnum(EmployeeDepartment)
  @IsOptional()
  department?: EmployeeDepartment;

  @IsObject()
  @IsOptional()
  permissions?: Record<string, any> | null;

  @IsObject()
  @IsOptional()
  schedule?: Record<string, any> | null;

  @IsNumber()
  @IsOptional()
  salary?: number | null;

  @IsBoolean()
  @IsOptional()
  is_active?: boolean;

  constructor(props?: UpdateEmployeeInputConstructorProps) {
    if (!props) return;
    this.id = props.id;
    this.store_id = props.store_id;
    this.name = props.name;
    this.email = props.email;
    this.employee_code = props.employee_code;
    this.role = props.role;
    this.department = props.department;
    this.permissions = props.permissions;
    this.schedule = props.schedule;
    this.salary = props.salary;
    this.is_active = props.is_active;
  }
}

export class ValidateUpdateEmployeeInput {
  static validate(input: UpdateEmployeeInput) {
    return validateSync(input);
  }
}