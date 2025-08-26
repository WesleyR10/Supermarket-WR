import { IUseCase } from '../../../../shared/application/use-case.interface';
import { IEmployeeRepository } from '../../../domain/repositories/employee.repository';
import { EmployeeId } from '../../../domain/employee.aggregate';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { Employee } from '../../../domain/employee.aggregate';
import { EmployeeOutput, EmployeeOutputMapper } from '../common/employee-output';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';

export type GetEmployeeInput = {
  id: string;
  store_id: string;
};

export class GetEmployeeUseCase
  implements IUseCase<GetEmployeeInput, EmployeeOutput>
{
  constructor(private readonly employeeRepo: IEmployeeRepository) {}

  async execute(input: GetEmployeeInput): Promise<EmployeeOutput> {
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
    
    return EmployeeOutputMapper.toOutput(employee);
  }
}