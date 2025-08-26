import { Employee, EmployeeId } from '../../../../domain/employee.aggregate';
import { EmployeeInMemoryRepository } from '../../../../infra/db/in-memory/employee-in-memory.repository';
import { CreateEmployeeUseCase } from '../create-employee.use-case';
import { CreateEmployeeInput } from '../create-employee.input';
import { EntityValidationError } from '../../../../../shared/domain/validators/validation.error';
import { PasswordHashingServiceMock } from '../../../../../shared/infra/testing/password-hashing-service.mock';
import { EmployeeFakeBuilder } from '../../../../domain/employee-fake.builder';
import { EmployeeRole, EmployeeDepartment } from '../../../../domain/employee.enums';

describe('CreateEmployeeUseCase Unit Tests', () => {
  let useCase: CreateEmployeeUseCase;
  let repository: EmployeeInMemoryRepository;
  let passwordHashingService: PasswordHashingServiceMock;

  beforeEach(() => {
    repository = new EmployeeInMemoryRepository();
    passwordHashingService = new PasswordHashingServiceMock();
    jest.spyOn(passwordHashingService, 'hash');
    useCase = new CreateEmployeeUseCase(repository, passwordHashingService);
  });

  describe('execute method', () => {
    it('should create a new employee', async () => {
      const input: CreateEmployeeInput = {
        store_id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        employee_code: 'EMP001',
        role: EmployeeRole.CASHIER,
        department: EmployeeDepartment.SALES,
        salary: 2500.00
      };

      const output = await useCase.execute(input);

      expect(output).toMatchObject({
        id: expect.any(String),
        store_id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'John Doe',
        email: 'john.doe@example.com',
        employee_code: 'EMP001',
        role: EmployeeRole.CASHIER,
        department: EmployeeDepartment.SALES,
        salary: 2500.00,
        is_active: true,
        created_at: expect.any(Date)
      });

      const employee = await repository.findById(new EmployeeId(output.id));
      expect(employee).toBeDefined();
      expect(employee!.name).toBe('John Doe');
    });

    it('should throw error when email already exists', async () => {
      const existingEmployee = EmployeeFakeBuilder.aEmployee()
        .store_id('550e8400-e29b-41d4-a716-446655440000')
        .email('john.doe@example.com')
        .password_hash('hashedpassword123')
        .build();
      
      await repository.insert(existingEmployee);

      const input: CreateEmployeeInput = {
        store_id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Jane Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        employee_code: 'EMP002',
        role: EmployeeRole.CASHIER,
        department: EmployeeDepartment.SALES,
        salary: 2500.00
      };

      await expect(useCase.execute(input)).rejects.toThrow(
        new EntityValidationError([{ email: ['Email already exists'] }])
      );
    });

    it('should throw error when employee code already exists', async () => {
      const existingEmployee = EmployeeFakeBuilder.aEmployee()
        .store_id('550e8400-e29b-41d4-a716-446655440000')
        .employee_code('EMP001')
        .password_hash('hashedpassword123')
        .build();
      
      await repository.insert(existingEmployee);

      const input: CreateEmployeeInput = {
        store_id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        password: 'password123',
        employee_code: 'EMP001',
        role: EmployeeRole.CASHIER,
        department: EmployeeDepartment.SALES,
        salary: 2500.00
      };

      await expect(useCase.execute(input)).rejects.toThrow(
        new EntityValidationError([{ employee_code: ['Employee code already exists'] }])
      );
    });

    it('should throw validation error for invalid input', async () => {
      const input: CreateEmployeeInput = {
        store_id: '',
        name: '',
        email: 'invalid-email',
        password: '123', // too short
        employee_code: '',
        role: 'invalid-role' as any,
        department: '' as any,
        salary: -100 // negative
      };

      await expect(useCase.execute(input)).rejects.toThrow(EntityValidationError);
    });

    it('should create employee with minimum valid data', async () => {
      const input: CreateEmployeeInput = {
        store_id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'John',
        email: 'john@example.com',
        password: 'password123',
        employee_code: 'EMP001',
        role: EmployeeRole.CASHIER,
        department: EmployeeDepartment.SALES,
        salary: 1000.00
      };

      const output = await useCase.execute(input);

      expect(output.name).toBe('John');
      expect(output.email).toBe('john@example.com');
      expect(output.is_active).toBe(true);
    });

    it('should hash the password before storing', async () => {
      const input: CreateEmployeeInput = {
        store_id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'John Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        employee_code: 'EMP001',
        role: EmployeeRole.CASHIER,
        department: EmployeeDepartment.SALES,
        salary: 2500.00
      };

      await useCase.execute(input);

      expect(passwordHashingService.hash).toHaveBeenCalledWith('password123');
    });
  });
});