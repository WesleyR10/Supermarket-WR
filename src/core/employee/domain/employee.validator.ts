import { IsEmail,Min, Max, Length, IsIn, IsUUID } from 'class-validator';
import { Employee } from './employee.aggregate';
import { EmployeeRole, EmployeeDepartment } from './employee.enums';
import { ClassValidatorFields } from '../../shared/domain/validators/class-validator-fields';
import { Notification } from '../../shared/domain/validators/notification';

export class EmployeeRules {
  @IsUUID(4, { groups: ['stores_id'] })
  stores_id: string;

  @Length(2, 100, { groups: ['name'] })
  name: string;

  @IsEmail({}, { groups: ['email'] })
  @Length(1, 255, { groups: ['email'] })
  email: string;

  @Length(10, 255, { groups: ['password_hash'] })
  password_hash: string;

  @Length(3, 20, { groups: ['employee_code'] })
  employee_code?: string | null;

  @IsIn(Object.values(EmployeeRole), { groups: ['role'] })
  role: EmployeeRole;

  @IsIn(Object.values(EmployeeDepartment), { groups: ['department'] })
  department: EmployeeDepartment;

  @Min(0, { groups: ['salary'] })
  @Max(100000, { groups: ['salary'] })
  salary?: number | null;

  constructor(employee: Employee) {
    Object.assign(this, employee);
  }
}

export class EmployeeValidator extends ClassValidatorFields {
  validate(notification: Notification, data: any, fields?: string[]): boolean {
    const newFields = fields?.length ? fields : [
      'stores_id',
      'name',
      'email',
      'password_hash',
      'role',
      'department',
      'salary',
      'employee_code'
    ];
    
    return super.validate(notification, new EmployeeRules(data), newFields);
  }
}

export class EmployeeValidatorFactory {
  static create(): EmployeeValidator {
    return new EmployeeValidator();
  }
}