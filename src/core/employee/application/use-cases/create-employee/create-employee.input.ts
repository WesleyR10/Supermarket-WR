import { IsEmail, IsNotEmpty, IsString, IsUUID, IsOptional, IsNumber, IsObject, Min } from 'class-validator';
import { EmployeeRole, EmployeeDepartment } from '../../../domain/employee.enums';

export type CreateEmployeeInputConstructorProps = {
  store_id: string;
  name: string;
  email: string;
  password: string;
  employee_code?: string;
  role: EmployeeRole;
  department: EmployeeDepartment;
  permissions?: Record<string, any>;
  schedule?: Record<string, any>;
  salary?: number;
  hired_at?: Date;
};

export class CreateEmployeeInput {
  @IsUUID()
  @IsNotEmpty()
  store_id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsOptional()
  @IsString()
  employee_code?: string;

  @IsNotEmpty()
  role: EmployeeRole;

  @IsNotEmpty()
  department: EmployeeDepartment;

  @IsOptional()
  @IsObject()
  permissions?: Record<string, any>;

  @IsOptional()
  @IsObject()
  schedule?: Record<string, any>;

  @IsOptional()
  @IsNumber()
  @Min(0)
  salary?: number;

  @IsOptional()
  hired_at?: Date;

  constructor(props?: CreateEmployeeInputConstructorProps) {
    if (!props) return;
    this.store_id = props.store_id;
    this.name = props.name;
    this.email = props.email;
    this.password = props.password;
    this.employee_code = props.employee_code;
    this.role = props.role;
    this.department = props.department;
    this.permissions = props.permissions;
    this.schedule = props.schedule;
    this.salary = props.salary;
    this.hired_at = props.hired_at;
  }
}