import { IUseCase } from '../../../../shared/application/use-case.interface';
import { IEmployeeRepository } from '../../../domain/repositories/employee.repository';
import { EmployeeId } from '../../../domain/employee.aggregate';
import { Employee } from '../../../domain/employee.aggregate';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';

export type DeleteEmployeeInput = {
  id: string;
  store_id: string;
};

export type DeleteEmployeeOutput = {
  id: string;
  deleted: boolean;
};

export class DeleteEmployeeUseCase
  implements IUseCase<DeleteEmployeeInput, DeleteEmployeeOutput>
{
  constructor(private readonly employeeRepo: IEmployeeRepository) {}

  async execute(input: DeleteEmployeeInput): Promise<DeleteEmployeeOutput> {
    const employeeId = new EmployeeId(input.id);
    
    const employee = await this.employeeRepo.findById(employeeId);
    if (!employee) throw new NotFoundError(input.id, Employee);

    if (employee.store_id !== input.store_id) {
      throw new EntityValidationError([
        {
          store_id: ['Employee does not belong to this store'],
        },
      ]);
    }

    await this.employeeRepo.delete(employeeId);
    return { id: input.id, deleted: true };
  }
}