import { DeleteEmployeeUseCase } from '../delete-employee.use-case';
import { EmployeeInMemoryRepository } from '../../../../infra/db/in-memory/employee-in-memory.repository';
import { EmployeeFakeBuilder } from '../../../../domain/employee-fake.builder';
import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';
import { EntityValidationError } from '../../../../../shared/domain/validators/validation.error';

describe('DeleteEmployeeUseCase Unit Tests', () => {
  let useCase: DeleteEmployeeUseCase;
  let repository: EmployeeInMemoryRepository;

  beforeEach(() => {
    repository = new EmployeeInMemoryRepository();
    useCase = new DeleteEmployeeUseCase(repository);
  });

  it('should throws error when employee not found', async () => {
    const validUuid = '6e5f099e-adf4-458e-b787-e79bdd2a7b11';
    await expect(
      useCase.execute({ id: validUuid, store_id: 'store-1' })
    ).rejects.toThrow(NotFoundError);
  });

  it('should throws error when employee belongs to another store', async () => {
    const employee = EmployeeFakeBuilder.aEmployee()
      .store_id('store-2')
      .name('Maria Santos')
      .email('maria@supermercado.com')
      .employee_code('EMP001')
      .password_hash('hashed_password')
      .asCashier()
      .build();
    
    await repository.insert(employee);

    await expect(
      useCase.execute({ id: employee.employee_id.id, store_id: 'store-1' })
    ).rejects.toThrow(EntityValidationError);
  });

  it('should delete an employee', async () => {
    const employee = EmployeeFakeBuilder.aEmployee()
      .store_id('store-1')
      .name('João Silva')
      .email('joao@supermercado.com')
      .employee_code('EMP001')
      .password_hash('hashed_password')
      .asManager()
      .build();

    await repository.insert(employee);

    await useCase.execute({
      id: employee.employee_id.id,
      store_id: 'store-1',
    });

    const employeeDeleted = await repository.findById(employee.employee_id);
    expect(employeeDeleted).toBeNull();
  });
});