import { IUseCase } from '../../../../shared/application/use-case.interface';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';
import { Employee, EmployeeId } from '../../../domain/employee.aggregate';
import { IEmployeeRepository } from '../../../domain/repositories/employee.repository';
import { EmployeeOutput, EmployeeOutputMapper } from '../common/employee-output';
import { UpdateEmployeeInput } from './update-employee.input';

export class UpdateEmployeeUseCase
  implements IUseCase<UpdateEmployeeInput, UpdateEmployeeOutput>
{
  constructor(
    private readonly employeeRepo: IEmployeeRepository,
  ) {}

  async execute(input: UpdateEmployeeInput): Promise<UpdateEmployeeOutput> {
    const employeeId = new EmployeeId(input.id);
    const employee = await this.employeeRepo.findById(employeeId);

    if (!employee) {
      throw new NotFoundError(input.id, Employee);
    }

    // Validação de multi-tenancy
    if (employee.store_id !== input.store_id) {
      throw new EntityValidationError([
        {
          store_id: ['Employee does not belong to this store'],
        },
      ]);
    }

    // Verificar se email já existe (se está sendo alterado)
    if (input.email !== undefined && input.email !== employee.email) {
      const existingEmployeeByEmail = await this.employeeRepo.findByEmail(input.email);
      if (existingEmployeeByEmail && !existingEmployeeByEmail.employee_id.equals(employee.employee_id)) {
        throw new EntityValidationError([
          {
            email: ['Email already exists'],
          },
        ]);
      }
    }

    // Verificar se código de funcionário já existe (se está sendo alterado)
    if (input.employee_code !== undefined && input.employee_code !== null && input.employee_code !== employee.employee_code) {
      const existingEmployeeByCode = await this.employeeRepo.findByEmployeeCode(input.employee_code);
      if (existingEmployeeByCode && !existingEmployeeByCode.employee_id.equals(employee.employee_id)) {
        throw new EntityValidationError([
          {
            employee_code: ['Employee code already exists'],
          },
        ]);
      }
    }

    // Atualizar propriedades
    if (input.name !== undefined) {
      employee.name = input.name;
      employee.updated_at = new Date();
    }

    if (input.email !== undefined) {
      employee.email = input.email;
      employee.updated_at = new Date();
    }

    if (input.employee_code !== undefined) {
      employee.employee_code = input.employee_code;
      employee.updated_at = new Date();
    }

    if (input.role !== undefined) {
      employee.updateRole(input.role);
    }

    if (input.department !== undefined) {
      employee.updateDepartment(input.department);
    }

    if (input.permissions !== undefined && input.permissions !== null) {
      employee.permissions = input.permissions;
      employee.updated_at = new Date();
    }

    if (input.schedule !== undefined && input.schedule !== null) {
      employee.schedule = input.schedule;
      employee.updated_at = new Date();
    }

    if (input.salary !== undefined && input.salary !== null) {
      employee.updateSalary(input.salary);
    }

    if (input.is_active !== undefined) {
      if (input.is_active) {
        employee.activate();
      } else {
        employee.deactivate();
      }
    }

    // Validar após as mudanças
    employee.validate();
    if (employee.notification.hasErrors()) {
      throw new EntityValidationError(employee.notification.toJSON());
    }

    await this.employeeRepo.update(employee);

    return EmployeeOutputMapper.toOutput(employee);
  }
}

export type UpdateEmployeeOutput = EmployeeOutput;