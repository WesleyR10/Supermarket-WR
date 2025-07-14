import { Employee, EmployeeConstructorProps, EmployeeId, EmployeeRole, EmployeeDepartment } from './employee.aggregate';
import { Uuid } from '../../shared/domain/value-objects/uuid.vo';

export class EmployeeFakeBuilder {
  private _employee_id: EmployeeId;
  private _stores_id: string;
  private _name: string;
  private _email: string;
  private _password_hash: string;
  private _employee_code: string | null;
  private _role: EmployeeRole;
  private _department: EmployeeDepartment;
  private _permissions: Record<string, any> | null;
  private _schedule: Record<string, any> | null;
  private _salary: number | null;
  private _is_active: boolean;
  private _last_login: Date | null;
  private _hired_at: Date;
  private _fired_at: Date | null;
  private _created_at: Date;
  private _updated_at: Date;

  constructor() {
    this._employee_id = new EmployeeId();
    this._stores_id = new Uuid().id;
    this._name = 'João Silva';
    this._email = 'joao.silva@supermercado.com';
    this._password_hash = '$2b$10$hashedpassword123456789';
    this._employee_code = 'EMP001';
    this._role = EmployeeRole.CASHIER;
    this._department = EmployeeDepartment.SALES;
    this._permissions = {
      can_make_sales: true,
      can_access_reports: false,
      can_manage_inventory: false
    };
    this._schedule = {
      monday: { start: '08:00', end: '17:00' },
      tuesday: { start: '08:00', end: '17:00' },
      wednesday: { start: '08:00', end: '17:00' },
      thursday: { start: '08:00', end: '17:00' },
      friday: { start: '08:00', end: '17:00' }
    };
    this._salary = 2500.00;
    this._is_active = true;
    this._last_login = new Date();
    this._hired_at = new Date('2024-01-15');
    this._fired_at = null;
    this._created_at = new Date();
    this._updated_at = new Date();
  }

  employee_id(value: EmployeeId): EmployeeFakeBuilder {
    this._employee_id = value;
    return this;
  }

  stores_id(value: string): EmployeeFakeBuilder {
    this._stores_id = value;
    return this;
  }

  name(value: string): EmployeeFakeBuilder {
    this._name = value;
    return this;
  }

  email(value: string): EmployeeFakeBuilder {
    this._email = value;
    return this;
  }

  password_hash(value: string): EmployeeFakeBuilder {
    this._password_hash = value;
    return this;
  }

  employee_code(value: string | null): EmployeeFakeBuilder {
    this._employee_code = value;
    return this;
  }

  role(value: EmployeeRole): EmployeeFakeBuilder {
    this._role = value;
    return this;
  }

  department(value: EmployeeDepartment): EmployeeFakeBuilder {
    this._department = value;
    return this;
  }

  permissions(value: Record<string, any> | null): EmployeeFakeBuilder {
    this._permissions = value;
    return this;
  }

  schedule(value: Record<string, any> | null): EmployeeFakeBuilder {
    this._schedule = value;
    return this;
  }

  salary(value: number | null): EmployeeFakeBuilder {
    this._salary = value;
    return this;
  }

  is_active(value: boolean): EmployeeFakeBuilder {
    this._is_active = value;
    return this;
  }

  last_login(value: Date | null): EmployeeFakeBuilder {
    this._last_login = value;
    return this;
  }

  hired_at(value: Date): EmployeeFakeBuilder {
    this._hired_at = value;
    return this;
  }

  fired_at(value: Date | null): EmployeeFakeBuilder {
    this._fired_at = value;
    return this;
  }

  created_at(value: Date): EmployeeFakeBuilder {
    this._created_at = value;
    return this;
  }

  updated_at(value: Date): EmployeeFakeBuilder {
    this._updated_at = value;
    return this;
  }

  // Métodos de conveniência para criar funcionários com roles específicos
  asManager(): EmployeeFakeBuilder {
    this._role = EmployeeRole.MANAGER;
    this._department = EmployeeDepartment.ADMINISTRATION;
    this._permissions = {
      can_make_sales: true,
      can_access_reports: true,
      can_manage_inventory: true,
      can_manage_employees: true
    };
    this._salary = 5000.00;
    return this;
  }

  asAdmin(): EmployeeFakeBuilder {
    this._role = EmployeeRole.ADMIN;
    this._department = EmployeeDepartment.ADMINISTRATION;
    this._permissions = {
      can_make_sales: true,
      can_access_reports: true,
      can_manage_inventory: true,
      can_manage_employees: true,
      can_manage_system: true
    };
    this._salary = 8000.00;
    return this;
  }

  asCashier(): EmployeeFakeBuilder {
    this._role = EmployeeRole.CASHIER;
    this._department = EmployeeDepartment.SALES;
    this._permissions = {
      can_make_sales: true,
      can_access_reports: false,
      can_manage_inventory: false
    };
    this._salary = 2500.00;
    return this;
  }

  asOperator(): EmployeeFakeBuilder {
    this._role = EmployeeRole.OPERATOR;
    this._department = EmployeeDepartment.INVENTORY;
    this._permissions = {
      can_make_sales: false,
      can_access_reports: true,
      can_manage_inventory: true
    };
    this._salary = 3000.00;
    return this;
  }

  // Métodos para cenários específicos
  inactive(): EmployeeFakeBuilder {
    this._is_active = false;
    this._fired_at = new Date();
    return this;
  }

  onProbation(): EmployeeFakeBuilder {
    this._hired_at = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 dias atrás
    return this;
  }

  withHighSalary(): EmployeeFakeBuilder {
    this._salary = 15000.00;
    return this;
  }

  withLowSalary(): EmployeeFakeBuilder {
    this._salary = 1500.00;
    return this;
  }

  withoutEmployeeCode(): EmployeeFakeBuilder {
    this._employee_code = null;
    return this;
  }

  withCorporateEmail(): EmployeeFakeBuilder {
    this._email = 'funcionario@supermercado.com.br';
    return this;
  }

  withPersonalEmail(): EmployeeFakeBuilder {
    this._email = 'joao.silva@gmail.com';
    return this;
  }

  build(): Employee {
    const props: EmployeeConstructorProps = {
      employee_id: this._employee_id,
      stores_id: this._stores_id,
      name: this._name,
      email: this._email,
      password_hash: this._password_hash,
      employee_code: this._employee_code,
      role: this._role,
      department: this._department,
      permissions: this._permissions,
      schedule: this._schedule,
      salary: this._salary,
      is_active: this._is_active,
      last_login: this._last_login,
      hired_at: this._hired_at,
      fired_at: this._fired_at,
      created_at: this._created_at,
      updated_at: this._updated_at,
    };

    return Employee.create(props);
  }

  // Método para criar múltiplos funcionários
  static createMany(count: number): Employee[] {
    const employees: Employee[] = [];
    
    for (let i = 0; i < count; i++) {
      const employee = new EmployeeFakeBuilder()
        .name(`Funcionário ${i + 1}`)
        .email(`funcionario${i + 1}@supermercado.com`)
        .employee_code(`EMP${String(i + 1).padStart(3, '0')}`)
        .build();
      
      employees.push(employee);
    }
    
    return employees;
  }

  // Método para criar funcionários com roles variados
  static createWithDifferentRoles(): Employee[] {
    return [
      new EmployeeFakeBuilder().asAdmin().name('Admin Principal').build(),
      new EmployeeFakeBuilder().asManager().name('Gerente Loja').build(),
      new EmployeeFakeBuilder().asCashier().name('Caixa 1').build(),
      new EmployeeFakeBuilder().asCashier().name('Caixa 2').build(),
      new EmployeeFakeBuilder().asOperator().name('Operador Estoque').build(),
    ];
  }
} 