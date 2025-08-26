import { GetEmployeeUseCase } from '../get-employee.use-case';
import { EmployeeInMemoryRepository } from '../../../../infra/db/in-memory/employee-in-memory.repository';
import { EmployeeRole } from '../../../../domain/employee.enums';
import { EmployeeFakeBuilder } from '../../../../domain/employee-fake.builder';
import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';
import { EntityValidationError } from '../../../../../shared/domain/validators/validation.error';

describe('GetEmployeeUseCase Unit Tests', () => {
  let useCase: GetEmployeeUseCase;
  let repository: EmployeeInMemoryRepository;

  beforeEach(() => {
    repository = new EmployeeInMemoryRepository();
    useCase = new GetEmployeeUseCase(repository);
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

  it('should return an employee', async () => {
    const employee = EmployeeFakeBuilder.aEmployee()
      .store_id('store-1')
      .name('João Silva')
      .email('joao@supermercado.com')
      .employee_code('EMP001')
      .password_hash('hashed_password')
      .asManager()
      .build();

    await repository.insert(employee);

    const output = await useCase.execute({
      id: employee.employee_id.id,
      store_id: 'store-1',
    });

    expect(output.id).toBe(employee.employee_id.id);
    expect(output.store_id).toBe('store-1');
    expect(output.name).toBe('João Silva');
    expect(output.email).toBe('joao@supermercado.com');
    expect(output.employee_code).toBe('EMP001');
    expect(output.role).toBe(EmployeeRole.MANAGER);
    expect(output.is_active).toBe(true);
    expect(output).toHaveProperty('salary');
    expect(output).toHaveProperty('permissions');
    expect(output).toHaveProperty('schedule');
    expect(output).toHaveProperty('hired_at');
    expect(output).toHaveProperty('created_at');
    expect(output).toHaveProperty('updated_at');
    expect(output).toHaveProperty('fired_at');
  });
});