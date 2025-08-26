import { Employee } from '../../../domain/employee.aggregate';
import { EmployeeRole, EmployeeDepartment } from '../../../domain/employee.enums';
import { EmployeeOutputMapper } from './employee-output';

describe('EmployeeOutputMapper Unit Tests', () => {
  it('should convert an employee in output', () => {
    const entity = Employee.create({
      store_id: 'store-1',
      name: 'João Silva',
      email: 'joao.silva@supermercado.com',
      employee_code: 'EMP001',
      role: EmployeeRole.MANAGER,
      department: EmployeeDepartment.SALES,
      salary: 5000,
      is_active: true,
      permissions: ['read:products', 'write:products'],
      schedule: {
        monday: { start: '08:00', end: '17:00', break_start: '12:00', break_end: '13:00' },
        tuesday: { start: '08:00', end: '17:00', break_start: '12:00', break_end: '13:00' },
        wednesday: { start: '08:00', end: '17:00', break_start: '12:00', break_end: '13:00' },
        thursday: { start: '08:00', end: '17:00', break_start: '12:00', break_end: '13:00' },
        friday: { start: '08:00', end: '17:00', break_start: '12:00', break_end: '13:00' },
        saturday: { start: '08:00', end: '12:00', break_start: null, break_end: null },
        sunday: null,
      },
      password_hash: 'hashed_password_123',
      hired_at: new Date('2023-01-15'),
      last_login: new Date('2024-01-10'),
    });
    
    const spyToJSON = jest.spyOn(entity, 'toJSON');
    const output = EmployeeOutputMapper.toOutput(entity);
    
    expect(spyToJSON).toHaveBeenCalled();
    expect(output).toStrictEqual({
      id: entity.employee_id.id,
      store_id: 'store-1',
      name: 'João Silva',
      email: 'joao.silva@supermercado.com',
      employee_code: 'EMP001',
      role: EmployeeRole.MANAGER,
      department: EmployeeDepartment.SALES,
      salary: 5000,
      is_active: true,
      permissions: ['read:products', 'write:products'],
      schedule: {
        monday: { start: '08:00', end: '17:00', break_start: '12:00', break_end: '13:00' },
        tuesday: { start: '08:00', end: '17:00', break_start: '12:00', break_end: '13:00' },
        wednesday: { start: '08:00', end: '17:00', break_start: '12:00', break_end: '13:00' },
        thursday: { start: '08:00', end: '17:00', break_start: '12:00', break_end: '13:00' },
        friday: { start: '08:00', end: '17:00', break_start: '12:00', break_end: '13:00' },
        saturday: { start: '08:00', end: '12:00', break_start: null, break_end: null },
        sunday: null,
      },
      hired_at: entity.hired_at,
      last_login: entity.last_login,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
      fired_at: null,
    });
  });

  it('should convert an inactive employee in output', () => {
    const entity = Employee.create({
      store_id: 'store-2',
      name: 'Maria Santos',
      email: 'maria.santos@supermercado.com',
      employee_code: 'EMP002',
      role: EmployeeRole.CASHIER,
      department: EmployeeDepartment.SALES,
      salary: 2500,
      is_active: false,
      permissions: ['read:products'],
      schedule: {
        monday: { start: '14:00', end: '22:00', break_start: '18:00', break_end: '19:00' },
        tuesday: { start: '14:00', end: '22:00', break_start: '18:00', break_end: '19:00' },
        wednesday: { start: '14:00', end: '22:00', break_start: '18:00', break_end: '19:00' },
        thursday: { start: '14:00', end: '22:00', break_start: '18:00', break_end: '19:00' },
        friday: { start: '14:00', end: '22:00', break_start: '18:00', break_end: '19:00' },
        saturday: { start: '14:00', end: '22:00', break_start: '18:00', break_end: '19:00' },
        sunday: null,
      },
      password_hash: 'hashed_password_456',
      hired_at: new Date('2023-06-01'),
      last_login: null,
    });
    
    const output = EmployeeOutputMapper.toOutput(entity);
    
    expect(output).toStrictEqual({
      id: entity.employee_id.id,
      store_id: 'store-2',
      name: 'Maria Santos',
      email: 'maria.santos@supermercado.com',
      employee_code: 'EMP002',
      role: EmployeeRole.CASHIER,
      department: EmployeeDepartment.SALES,
      salary: 2500,
      is_active: false,
      permissions: ['read:products'],
      schedule: {
        monday: { start: '14:00', end: '22:00', break_start: '18:00', break_end: '19:00' },
        tuesday: { start: '14:00', end: '22:00', break_start: '18:00', break_end: '19:00' },
        wednesday: { start: '14:00', end: '22:00', break_start: '18:00', break_end: '19:00' },
        thursday: { start: '14:00', end: '22:00', break_start: '18:00', break_end: '19:00' },
        friday: { start: '14:00', end: '22:00', break_start: '18:00', break_end: '19:00' },
        saturday: { start: '14:00', end: '22:00', break_start: '18:00', break_end: '19:00' },
        sunday: null,
      },
      hired_at: entity.hired_at,
      last_login: null,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
      fired_at: null,
    });
  });
});