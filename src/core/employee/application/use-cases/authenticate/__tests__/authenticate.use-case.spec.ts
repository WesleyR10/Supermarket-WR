import { AuthenticateUseCase } from '../authenticate.use-case';
import { EmployeeInMemoryRepository } from '../../../../infra/db/in-memory/employee-in-memory.repository';
import { EmployeeFakeBuilder } from '../../../../../employee/domain/employee-fake.builder';
import { EntityValidationError } from '../../../../../shared/domain/validators/validation.error';
import { IPasswordHashingService } from '../../../../../shared/domain/services/password-hashing.service';

class FakeHashingService implements IPasswordHashingService {
  async hash(plain: string): Promise<string> {
    return `hash:${plain}`;
  }
  async compare(plain: string, hash: string): Promise<boolean> {
    return hash === `hash:${plain}`;
  }
}

describe('AuthenticateUseCase Unit Tests', () => {
  let useCase: AuthenticateUseCase;
  let repository: EmployeeInMemoryRepository;
  let hashingService: FakeHashingService;

  beforeEach(async () => {
    repository = new EmployeeInMemoryRepository();
    hashingService = new FakeHashingService();
    useCase = new AuthenticateUseCase(repository, hashingService);
  });

  it('should authenticate with valid credentials and update last_login', async () => {
    const employee = EmployeeFakeBuilder.createWithDifferentRoles()[0];
    employee.store_id = 'store-1';
    employee.updatePassword(await hashingService.hash('valid_password'));
    await repository.insert(employee);

    const input = {
      store_id: 'store-1',
      email: employee.email,
      password: 'valid_password',
    };

    const output = await useCase.execute(input);

    expect(output.id).toBe(employee.employee_id.toString());
    const updated = await repository.findById(employee.employee_id);
    expect(updated).not.toBeNull();
    expect(updated!.last_login).not.toBeNull();
  });

  it('should throw EntityValidationError for wrong password', async () => {
    const employee = EmployeeFakeBuilder.createWithDifferentRoles()[0];
    employee.store_id = 'store-1';
    employee.updatePassword(await hashingService.hash('valid_password'));
    await repository.insert(employee);

    const input = {
      store_id: 'store-1',
      email: employee.email,
      password: 'wrong_password',
    };

    await expect(useCase.execute(input)).rejects.toThrow(EntityValidationError);
  });

  it('should throw EntityValidationError when employee not found by email', async () => {
    const input = {
      store_id: 'store-1',
      email: 'unknown@example.com',
      password: 'any_password',
    };

    await expect(useCase.execute(input)).rejects.toThrow(EntityValidationError);
  });

  it('should throw EntityValidationError when employee store does not match', async () => {
    const employee = EmployeeFakeBuilder.createWithDifferentRoles()[0];
    employee.store_id = 'store-1';
    employee.updatePassword(await hashingService.hash('valid_password'));
    await repository.insert(employee);

    const input = {
      store_id: 'another-store',
      email: employee.email,
      password: 'valid_password',
    };

    await expect(useCase.execute(input)).rejects.toThrow(EntityValidationError);
  });

  it('should throw EntityValidationError when employee is inactive', async () => {
    const employee = EmployeeFakeBuilder.createWithDifferentRoles()[0];
    employee.deactivate();
    employee.store_id = 'store-1';
    employee.updatePassword(await hashingService.hash('valid_password'));
    await repository.insert(employee);

    const input = {
      store_id: 'store-1',
      email: employee.email,
      password: 'valid_password',
    };

    await expect(useCase.execute(input)).rejects.toThrow(EntityValidationError);
  });
});