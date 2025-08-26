import { Employee, EmployeeId } from '../../../../domain/employee.aggregate';
import { EmployeeInMemoryRepository } from '../../../../infra/db/in-memory/employee-in-memory.repository';
import { UpdateEmployeeUseCase } from '../update-employee.use-case';
import { UpdateEmployeeInput } from '../update-employee.input';
import { EntityValidationError } from '../../../../../shared/domain/validators/validation.error';
import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';
import { InvalidUuidError } from '../../../../../shared/domain/value-objects/uuid.vo';
import { EmployeeFakeBuilder } from '../../../../domain/employee-fake.builder';
import { EmployeeRole, EmployeeDepartment } from '../../../../domain/employee.enums';

describe('UpdateEmployeeUseCase Unit Tests', () => {
  let useCase: UpdateEmployeeUseCase;
  let repository: EmployeeInMemoryRepository;

  beforeEach(() => {
    repository = new EmployeeInMemoryRepository();
    useCase = new UpdateEmployeeUseCase(repository);
  });

  describe('execute method', () => {
    it('should update an employee successfully', async () => {
      const employee = EmployeeFakeBuilder.createWithDifferentRoles()[0];
      employee.store_id = '550e8400-e29b-41d4-a716-446655440000';
      await repository.insert(employee);

      const input: UpdateEmployeeInput = {
        id: employee.employee_id.toString(),
        store_id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Updated Name',
        role: EmployeeRole.MANAGER,
        department: EmployeeDepartment.ADMINISTRATION,
        salary: 5000.00
      };

      const output = await useCase.execute(input);

      expect(output.name).toBe('Updated Name');
      expect(output.role).toBe('MANAGER');
      expect(output.department).toBe('ADMINISTRATION');
      expect(output.salary).toBe(5000.00);
    });

    it('should throw NotFoundError when employee does not exist', async () => {
      const input: UpdateEmployeeInput = {
        id: new EmployeeId().id,
        store_id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Updated Name'
      };

      await expect(useCase.execute(input)).rejects.toThrow(NotFoundError);
    });

    it('should throw InvalidUuidError when id is invalid', async () => {
      const input: UpdateEmployeeInput = {
        id: 'invalid-uuid',
        store_id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Updated Name'
      };

      await expect(useCase.execute(input)).rejects.toThrow(InvalidUuidError);
    });

    it('should throw EntityValidationError when employee belongs to different store', async () => {
      const employee = EmployeeFakeBuilder.createWithDifferentRoles()[0];
      employee.store_id = 'store-1';
      await repository.insert(employee);

      const input: UpdateEmployeeInput = {
        id: employee.employee_id.toString(),
        store_id: 'another-store',
        name: 'Updated Name'
      };

      await expect(useCase.execute(input)).rejects.toThrow(EntityValidationError);
    });

    it('should throw EntityValidationError when email already exists', async () => {
      const employee1 = EmployeeFakeBuilder.createWithDifferentRoles()[0];
      const employee2 = EmployeeFakeBuilder.createWithDifferentRoles()[1];
      employee1.store_id = '550e8400-e29b-41d4-a716-446655440000';
      employee2.store_id = '550e8400-e29b-41d4-a716-446655440000';
      employee1.email = 'existing@example.com';
      employee2.email = 'other@example.com';
      
      await repository.insert(employee1);
      await repository.insert(employee2);

      const input: UpdateEmployeeInput = {
        id: employee2.employee_id.toString(),
        store_id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'existing@example.com'
      };

      await expect(useCase.execute(input)).rejects.toThrow(EntityValidationError);
    });

    it('should throw EntityValidationError when employee code already exists', async () => {
      const employee1 = EmployeeFakeBuilder.createWithDifferentRoles()[0];
      const employee2 = EmployeeFakeBuilder.createWithDifferentRoles()[1];
      employee1.store_id = '550e8400-e29b-41d4-a716-446655440000';
      employee2.store_id = '550e8400-e29b-41d4-a716-446655440000';
      employee1.employee_code = 'EMP001';
      employee2.employee_code = 'EMP002';
      
      await repository.insert(employee1);
      await repository.insert(employee2);

      const input: UpdateEmployeeInput = {
        id: employee2.employee_id.toString(),
        store_id: '550e8400-e29b-41d4-a716-446655440000',
        employee_code: 'EMP001'
      };

      await expect(useCase.execute(input)).rejects.toThrow(EntityValidationError);
    });

    it('should allow updating email to the same value', async () => {
      const employee = EmployeeFakeBuilder.createWithDifferentRoles()[0];
      employee.store_id = '550e8400-e29b-41d4-a716-446655440000';
      employee.email = 'same@example.com';
      await repository.insert(employee);

      const input: UpdateEmployeeInput = {
        id: employee.employee_id.toString(),
        store_id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'same@example.com'
      };

      const output = await useCase.execute(input);
      expect(output.email).toBe('same@example.com');
    });

    it('should allow updating employee code to the same value', async () => {
      const employee = EmployeeFakeBuilder.createWithDifferentRoles()[0];
      employee.store_id = '550e8400-e29b-41d4-a716-446655440000';
      employee.employee_code = 'EMP001';
      await repository.insert(employee);

      const input: UpdateEmployeeInput = {
        id: employee.employee_id.toString(),
        store_id: '550e8400-e29b-41d4-a716-446655440000',
        employee_code: 'EMP001'
      };

      const output = await useCase.execute(input);
      expect(output.employee_code).toBe('EMP001');
    });

    it('should activate employee when is_active is true', async () => {
      const employee = EmployeeFakeBuilder.createWithDifferentRoles()[0];
      employee.store_id = '550e8400-e29b-41d4-a716-446655440000';
      employee.deactivate();
      await repository.insert(employee);

      const input: UpdateEmployeeInput = {
        id: employee.employee_id.toString(),
        store_id: '550e8400-e29b-41d4-a716-446655440000',
        is_active: true
      };

      const output = await useCase.execute(input);
      expect(output.is_active).toBe(true);
      expect(output.fired_at).toBeNull();
    });

    it('should deactivate employee when is_active is false', async () => {
      const employee = EmployeeFakeBuilder.createWithDifferentRoles()[0];
      employee.store_id = '550e8400-e29b-41d4-a716-446655440000';
      await repository.insert(employee);

      const input: UpdateEmployeeInput = {
        id: employee.employee_id.toString(),
        store_id: '550e8400-e29b-41d4-a716-446655440000',
        is_active: false
      };

      const output = await useCase.execute(input);
      expect(output.is_active).toBe(false);
      expect(output.fired_at).not.toBeNull();
    });

    it('should update permissions and schedule', async () => {
      const employee = EmployeeFakeBuilder.createWithDifferentRoles()[0];
      employee.store_id = '550e8400-e29b-41d4-a716-446655440000';
      await repository.insert(employee);

      const newPermissions = { canManageInventory: true, canViewReports: true };
      const newSchedule = { monday: '08:00-17:00', tuesday: '08:00-17:00' };

      const input: UpdateEmployeeInput = {
        id: employee.employee_id.toString(),
        store_id: '550e8400-e29b-41d4-a716-446655440000',
        permissions: newPermissions,
        schedule: newSchedule
      };

      const output = await useCase.execute(input);
      expect(output.permissions).toEqual(newPermissions);
      expect(output.schedule).toEqual(newSchedule);
    });

    it('should throw EntityValidationError when validation fails', async () => {
      const employee = EmployeeFakeBuilder.createWithDifferentRoles()[0];
      employee.store_id = '550e8400-e29b-41d4-a716-446655440000';
      await repository.insert(employee);

      const input: UpdateEmployeeInput = {
        id: employee.employee_id.toString(),
        store_id: '550e8400-e29b-41d4-a716-446655440000',
        name: '', // Nome vazio deve falhar na validação
      };

      await expect(useCase.execute(input)).rejects.toThrow(EntityValidationError);
    });
  });
});