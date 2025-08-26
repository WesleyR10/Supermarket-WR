import { IUseCase } from '../../../../shared/application/use-case.interface';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';
import { Employee, EmployeeId } from '../../../domain/employee.aggregate';
import { IEmployeeRepository } from '../../../domain/repositories/employee.repository';
import { EmployeeOutput, EmployeeOutputMapper } from '../common/employee-output';
import { ChangePasswordInput } from './change-password.input';
import { IPasswordHashingService } from '../../../../shared/domain/services/password-hashing.service';

export class ChangePasswordUseCase
  implements IUseCase<ChangePasswordInput, ChangePasswordOutput>
{
  constructor(
    private readonly employeeRepo: IEmployeeRepository,
    private readonly hashingService: IPasswordHashingService,
  ) {}

  async execute(input: ChangePasswordInput): Promise<ChangePasswordOutput> {
    const employeeId = new EmployeeId(input.id);
    const employee = await this.employeeRepo.findById(employeeId);

    if (!employee) {
      throw new NotFoundError(input.id, Employee);
    }

    // Multi-tenant validation
    if (employee.store_id !== input.store_id) {
      throw new EntityValidationError([
        {
          store_id: ['Employee does not belong to this store'],
        },
      ]);
    }

    const isCurrentValid = await this.hashingService.compare(
      input.current_password,
      employee.password_hash,
    );

    if (!isCurrentValid) {
      throw new EntityValidationError([
        {
          current_password: ['Invalid current password'],
        },
      ]);
    }

    const newHash = await this.hashingService.hash(input.new_password);
    employee.updatePassword(newHash);

    if (employee.notification.hasErrors()) {
      throw new EntityValidationError(employee.notification.toJSON());
    }

    await this.employeeRepo.update(employee);

    return EmployeeOutputMapper.toOutput(employee);
  }
}

export type ChangePasswordOutput = EmployeeOutput;