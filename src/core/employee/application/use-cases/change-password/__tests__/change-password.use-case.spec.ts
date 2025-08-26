import { ChangePasswordUseCase } from '../change-password.use-case';
import { EmployeeInMemoryRepository } from '../../../../infra/db/in-memory/employee-in-memory.repository';
import { EmployeeFakeBuilder } from '../../../../../employee/domain/employee-fake.builder';
import { EntityValidationError } from '../../../../../shared/domain/validators/validation.error';
import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';
import { InvalidUuidError } from '../../../../../shared/domain/value-objects/uuid.vo';
import { IPasswordHashingService } from '../../../../../shared/domain/services/password-hashing.service';
import { EmployeeId } from '../../../../domain/employee.aggregate';

class FakeHashingService implements IPasswordHashingService {
  async hash(plain: string): Promise<string> {
    return `hash:${plain}`;
  }
  async compare(plain: string, hash: string): Promise<boolean> {
    return hash === `hash:${plain}`;
  }
}

describe('ChangePasswordUseCase Unit Tests', () => {
  let useCase: ChangePasswordUseCase;
  let repository: EmployeeInMemoryRepository;
  let hashingService: FakeHashingService;

  beforeEach(async () => {
    repository = new EmployeeInMemoryRepository();
    hashingService = new FakeHashingService();
    useCase = new ChangePasswordUseCase(repository, hashingService);
  });

  it('should change password with valid current password', async () => {
    const employee = EmployeeFakeBuilder
      .createWithDifferentRoles()[0];
    // garantir store e senha conhecidos
    employee.store_id = 'store-1';
    employee.updatePassword(await hashingService.hash('old_password'));
    await repository.insert(employee);

    const input = {
      id: employee.employee_id.toString(),
      store_id: 'store-1',
      current_password: 'old_password',
      new_password: 'new_secure_password',
    };

    const output = await useCase.execute(input);

    expect(output.id).toBe(employee.employee_id.toString());
    const updated = await repository.findById(employee.employee_id);
    expect(updated).not.toBeNull();
    const isNewValid = await hashingService.compare(
      'new_secure_password',
      updated!.password_hash,
    );
    expect(isNewValid).toBe(true);
  });

  it('should throw EntityValidationError when current password is invalid', async () => {
    const employee = EmployeeFakeBuilder.createWithDifferentRoles()[0];
    employee.store_id = 'store-1';
    employee.updatePassword(await hashingService.hash('old_password'));
    await repository.insert(employee);

    const input = {
      id: employee.employee_id.toString(),
      store_id: 'store-1',
      current_password: 'wrong_password',
      new_password: 'new_secure_password',
    };

    await expect(useCase.execute(input)).rejects.toThrow(EntityValidationError);
  });

  it('should throw InvalidUuidError when id is invalid', async () => {
    const input = {
      id: 'invalid-uuid',
      store_id: 'store-1',
      current_password: 'any',
      new_password: 'new_secure_password',
    };

    await expect(useCase.execute(input)).rejects.toThrow(InvalidUuidError);
  });

  it('should throw NotFoundError when employee does not exist', async () => {
    const input = {
      id: new EmployeeId().id,
      store_id: 'store-1',
      current_password: 'any',
      new_password: 'new_secure_password',
    };

    await expect(useCase.execute(input)).rejects.toThrow(NotFoundError);
  });

  it('should throw EntityValidationError when employee store does not match', async () => {
    const employee = EmployeeFakeBuilder.createWithDifferentRoles()[0];
    employee.store_id = 'store-1';
    employee.updatePassword(await hashingService.hash('old_password'));
    await repository.insert(employee);

    const input = {
      id: employee.employee_id.toString(),
      store_id: 'another-store',
      current_password: 'old_password',
      new_password: 'new_secure_password',
    };

    await expect(useCase.execute(input)).rejects.toThrow(EntityValidationError);
  });
});