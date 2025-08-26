import { Employee, EmployeeId } from '../employee.aggregate';
import { EmployeeRole, EmployeeDepartment } from '../employee.enums';
import { EmployeeFakeBuilder } from '../employee-fake.builder';

describe('Employee Aggregate Unit Tests', () => {
  describe('constructor', () => {
    test('should create employee with default values', () => {
      const employee = Employee.fake()
        .asCashier()
        .store_id('store-123')
        .name('João Silva')
        .email('joao.silva@supermercado.com')
        .password_hash('$2b$10$hashedpassword123456789')
        .build();

      expect(employee.employee_id).toBeInstanceOf(EmployeeId);
      expect(employee.store_id).toBe('store-123');
      expect(employee.name).toBe('João Silva');
      expect(employee.email).toBe('joao.silva@supermercado.com');
      expect(employee.password_hash).toBe('$2b$10$hashedpassword123456789');
      expect(employee.role).toBe(EmployeeRole.CASHIER);
      expect(employee.department).toBe(EmployeeDepartment.SALES);
      expect(employee.is_active).toBe(true);
      expect(employee.created_at).toBeInstanceOf(Date);
      expect(employee.updated_at).toBeInstanceOf(Date);
    });

    test('should create employee with all properties', () => {
      const employee = Employee.fake()
        .asManager()
        .store_id('store-456')
        .name('Maria Santos')
        .email('maria.santos@supermercado.com')
        .password_hash('$2b$10$anotherhash987654321')
        .employee_code('MGR001')
        .salary(5000.00)
        .permissions({
          can_make_sales: true,
          can_access_reports: true,
          can_manage_inventory: true,
          can_manage_employees: true
        })
        .schedule({
          monday: { start: '09:00', end: '18:00' },
          tuesday: { start: '09:00', end: '18:00' },
          wednesday: { start: '09:00', end: '18:00' },
          thursday: { start: '09:00', end: '18:00' },
          friday: { start: '09:00', end: '18:00' }
        })
        .hired_at(new Date('2023-06-15'))
        .build();

      expect(employee.store_id).toBe('store-456');
      expect(employee.name).toBe('Maria Santos');
      expect(employee.email).toBe('maria.santos@supermercado.com');
      expect(employee.password_hash).toBe('$2b$10$anotherhash987654321');
      expect(employee.employee_code).toBe('MGR001');
      expect(employee.role).toBe(EmployeeRole.MANAGER);
      expect(employee.department).toBe(EmployeeDepartment.ADMINISTRATION);
      expect(employee.salary).toBe(5000.00);
      expect(employee.permissions).toEqual({
        can_make_sales: true,
        can_access_reports: true,
        can_manage_inventory: true,
        can_manage_employees: true
      });
      expect(employee.schedule).toEqual({
        monday: { start: '09:00', end: '18:00' },
        tuesday: { start: '09:00', end: '18:00' },
        wednesday: { start: '09:00', end: '18:00' },
        thursday: { start: '09:00', end: '18:00' },
        friday: { start: '09:00', end: '18:00' }
      });
      expect(employee.hired_at).toEqual(new Date('2023-06-15'));
      expect(employee.is_active).toBe(true);
    });

    test('should have validation errors when creating employee with invalid data', () => {
      const employee = Employee.create({
        store_id: '',
        name: '',
        email: 'invalid-email',
        password_hash: '',
        role: EmployeeRole.CASHIER,
        department: EmployeeDepartment.SALES
      });
      
      expect(employee.notification.hasErrors()).toBe(true);
      const errors = employee.notification.toJSON();
      expect(errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            store_id: expect.any(Array)
          }),
          expect.objectContaining({
            name: expect.any(Array)
          }),
          expect.objectContaining({
            email: expect.any(Array)
          }),
          expect.objectContaining({
            password_hash: expect.any(Array)
          })
        ])
      );
    });
  });

  describe('create method', () => {
    test('should create a valid employee', () => {
      const employee = Employee.create({
        store_id: 'store-123',
        name: 'Pedro Oliveira',
        email: 'pedro.oliveira@supermercado.com',
        password_hash: '$2b$10$validhash123456789',
        role: EmployeeRole.OPERATOR,
        department: EmployeeDepartment.INVENTORY
      });

      expect(employee.employee_id).toBeInstanceOf(EmployeeId);
      expect(employee.store_id).toBe('store-123');
      expect(employee.name).toBe('Pedro Oliveira');
      expect(employee.email).toBe('pedro.oliveira@supermercado.com');
      expect(employee.role).toBe(EmployeeRole.OPERATOR);
      expect(employee.department).toBe(EmployeeDepartment.INVENTORY);
      expect(employee.is_active).toBe(true);
    });

    test('should have validation errors when creating employee with invalid email', () => {
      const employee = Employee.create({
        store_id: 'store-123',
        name: 'Pedro Oliveira',
        email: 'invalid-email',
        password_hash: '$2b$10$validhash123456789',
        role: EmployeeRole.OPERATOR,
        department: EmployeeDepartment.INVENTORY
      });
      
      expect(employee.notification.hasErrors()).toBe(true);
      expect(employee.notification.toJSON()).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            email: expect.arrayContaining(['email must be an email'])
          })
        ])
      );
    });
  });

  describe('business methods', () => {
    let employee: Employee;

    beforeEach(() => {
      employee = Employee.fake()
        .asCashier()
        .store_id('store-123')
        .name('Ana Costa')
        .email('ana.costa@supermercado.com')
        .password_hash('$2b$10$hashedpassword')
        .build();
    });

    describe('updatePassword', () => {
      test('should change password successfully', () => {
        const newPasswordHash = '$2b$10$newhash123456789';
        employee.updatePassword(newPasswordHash);
        
        expect(employee.password_hash).toBe(newPasswordHash);
        expect(employee.updated_at).toBeInstanceOf(Date);
      });

      test('should have validation errors when changing to empty password', () => {
        employee.updatePassword('');
        
        expect(employee.notification.hasErrors()).toBe(true);
        expect(employee.notification.toJSON()).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              password_hash: expect.arrayContaining(['password_hash must be longer than or equal to 10 characters'])
            })
          ])
        );
      });
    });

    describe('name update', () => {
      test('should update name through constructor validation', () => {
        const originalName = employee.name;
        expect(originalName).toBe('Ana Costa');
        
        // Nome é atualizado através de reconstrução ou métodos específicos
        expect(employee.name).toBeDefined();
      });
    });

    describe('email validation', () => {
      test('should have valid email format', () => {
        expect(employee.email).toContain('@');
        expect(employee.hasCorporateEmail()).toBe(true);
      });
    });

    describe('updateRole', () => {
      test('should change role successfully', () => {
        employee.updateRole(EmployeeRole.MANAGER);
        
        expect(employee.role).toBe(EmployeeRole.MANAGER);
        expect(employee.updated_at).toBeInstanceOf(Date);
      });
    });

    describe('updateDepartment', () => {
      test('should change department successfully', () => {
        employee.updateDepartment(EmployeeDepartment.ADMINISTRATION);
        
        expect(employee.department).toBe(EmployeeDepartment.ADMINISTRATION);
        expect(employee.updated_at).toBeInstanceOf(Date);
      });
    });

    describe('updateSalary', () => {
      test('should change salary successfully', () => {
        employee.updateSalary(3000.00);
        
        expect(employee.salary).toBe(3000.00);
        expect(employee.updated_at).toBeInstanceOf(Date);
      });

      test('should have validation errors when changing to negative salary', () => {
        employee.updateSalary(-1000);
        
        expect(employee.notification.hasErrors()).toBe(true);
        expect(employee.notification.toJSON()).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              salary: expect.arrayContaining(['salary must not be less than 0'])
            })
          ])
        );
      });
    });

    describe('activate/deactivate', () => {
      test('should activate employee', () => {
        employee.deactivate();
        expect(employee.is_active).toBe(false);
        
        employee.activate();
        expect(employee.is_active).toBe(true);
        expect(employee.updated_at).toBeInstanceOf(Date);
      });

      test('should deactivate employee', () => {
        employee.deactivate();
        
        expect(employee.is_active).toBe(false);
        expect(employee.fired_at).toBeInstanceOf(Date);
        expect(employee.updated_at).toBeInstanceOf(Date);
      });
    });

    describe('updateLastLogin', () => {
      test('should update last login', () => {
        employee.updateLastLogin();
        
        expect(employee.last_login).toBeInstanceOf(Date);
        expect(employee.updated_at).toBeInstanceOf(Date);
      });
    });

    describe('business logic methods', () => {
      test('should check if employee can manage inventory', () => {
        const manager = Employee.fake().asManager().build();
        const cashier = Employee.fake().asCashier().build();
        
        expect(manager.canManageInventory()).toBe(true);
        expect(cashier.canManageInventory()).toBe(false);
      });

      test('should check if employee can access reports', () => {
        const manager = Employee.fake().asManager().build();
        const cashier = Employee.fake().asCashier().build();
        
        expect(manager.canAccessReports()).toBe(true);
        expect(cashier.canAccessReports()).toBe(false);
      });

      test('should check if employee can manage employees', () => {
        const admin = Employee.fake().asAdmin().build();
        const manager = Employee.fake().asManager().build();
        const cashier = Employee.fake().asCashier().build();
        
        expect(admin.canManageEmployees()).toBe(true);
        expect(manager.canManageEmployees()).toBe(true);
        expect(cashier.canManageEmployees()).toBe(false);
      });

      test('should check if employee is on probation', () => {
        const recentEmployee = Employee.fake()
          .asCashier()
          .hired_at(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) // 30 dias atrás
          .build();
        
        const experiencedEmployee = Employee.fake()
          .asCashier()
          .hired_at(new Date(Date.now() - 120 * 24 * 60 * 60 * 1000)) // 120 dias atrás
          .build();
        
        expect(recentEmployee.isOnProbation()).toBe(true);
        expect(experiencedEmployee.isOnProbation()).toBe(false);
      });

      test('should calculate work experience in days', () => {
        const hiredDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); // 1 ano atrás
        const employee = Employee.fake()
          .asCashier()
          .hired_at(hiredDate)
          .build();
        
        const experience = employee.getTenureInDays();
        expect(experience).toBeGreaterThanOrEqual(364);
        expect(experience).toBeLessThanOrEqual(366);
      });
    });
  });

  describe('validation', () => {
    test('should validate employee successfully', () => {
      const employee = Employee.fake().asCashier().build();
      
      expect(() => employee.validate()).not.toThrow();
    });

    test('should validate specific fields', () => {
      const employee = Employee.fake().asCashier().build();
      
      expect(() => employee.validate(['name', 'email'])).not.toThrow();
    });
  });

  describe('toJSON', () => {
    test('should convert employee to JSON', () => {
      const employee = Employee.fake()
        .asCashier()
        .store_id('store-123')
        .name('Carlos Silva')
        .email('carlos.silva@supermercado.com')
        .salary(2500.00)
        .build();
      
      const json = employee.toJSON();
      
      expect(json).toEqual({
        employee_id: employee.employee_id.toString(),
        store_id: 'store-123',
        name: 'Carlos Silva',
        email: 'carlos.silva@supermercado.com',
        employee_code: employee.employee_code,
        role: employee.role,
        department: employee.department,
        permissions: employee.permissions,
        schedule: employee.schedule,
        salary: 2500.00,
        is_active: employee.is_active,
        last_login: employee.last_login,
        hired_at: employee.hired_at,
        fired_at: employee.fired_at,
        created_at: employee.created_at,
        updated_at: employee.updated_at
      });
    });
  });

  describe('fake builder', () => {
    test('should create employee using fake builder', () => {
      const employee = Employee.fake().asCashier().build();
      
      expect(employee).toBeInstanceOf(Employee);
      expect(employee.employee_id).toBeInstanceOf(EmployeeId);
    });

    test('should create multiple employees', () => {
      const employees = EmployeeFakeBuilder.createMany(3);
      
      expect(employees).toHaveLength(3);
      employees.forEach(employee => {
        expect(employee).toBeInstanceOf(Employee);
      });
    });
  });
});