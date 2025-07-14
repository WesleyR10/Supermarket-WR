import { EmployeeRole, EmployeeDepartment, Employee } from '../../../domain/employee.aggregate';

export type EmployeeOutput = {
  id: string;
  stores_id: string;
  name: string;
  email: string;
  employee_code: string | null;
  role: EmployeeRole;
  department: EmployeeDepartment;
  permissions: Record<string, any> | null;
  schedule: Record<string, any> | null;
  salary: number | null;
  is_active: boolean;
  last_login: Date | null;
  hired_at: Date;
  fired_at: Date | null;
  created_at: Date;
  updated_at: Date;
}; 

export class EmployeeOutputMapper {
  static toOutput(entity: Employee): EmployeeOutput {
    const { employee_id, ...otherProps } = entity.toJSON();
    return {
      id: employee_id,
      ...otherProps,
    };  
  }
}