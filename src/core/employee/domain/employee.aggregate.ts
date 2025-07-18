import { AggregateRoot } from '../../shared/domain/aggregate-root';
import { ValueObject } from '../../shared/domain/value-object';
import { Uuid } from '../../shared/domain/value-objects/uuid.vo';
import { EmployeeFakeBuilder } from './employee-fake.builder';
import { EmployeeValidatorFactory } from './employee.validator';
import { EmployeeRole, EmployeeDepartment } from './employee.enums';

export type EmployeeConstructorProps = {
  employee_id?: EmployeeId;
  stores_id: string;
  name: string;
  email: string;
  password_hash: string;
  employee_code?: string | null;
  role: EmployeeRole;
  department: EmployeeDepartment;
  permissions?: Record<string, any> | null;
  schedule?: Record<string, any> | null;
  salary?: number | null;
  is_active?: boolean;
  last_login?: Date | null;
  hired_at?: Date;
  fired_at?: Date | null;
  created_at?: Date;
  updated_at?: Date;
};

export class EmployeeId extends Uuid {}

export class Employee extends AggregateRoot {
  employee_id: EmployeeId;
  stores_id: string;
  name: string;
  email: string;
  password_hash: string;
  employee_code: string | null;
  role: EmployeeRole;
  department: EmployeeDepartment;
  permissions: Record<string, any> | null;
  schedule: Record<string, any> | null;
  salary: number | null;
  is_active: boolean;
  last_login: Date | null;
  hired_at: Date;
  fired_at: Date | null;
  created_at: Date;
  updated_at: Date;

  constructor(props: EmployeeConstructorProps) {
    super();
    this.employee_id = props.employee_id ?? new EmployeeId();
    this.stores_id = props.stores_id;
    this.name = props.name;
    this.email = props.email;
    this.password_hash = props.password_hash;
    this.employee_code = props.employee_code ?? null;
    this.role = props.role;
    this.department = props.department;
    this.permissions = props.permissions ?? null;
    this.schedule = props.schedule ?? null;
    this.salary = props.salary ?? null;
    this.is_active = props.is_active ?? true;
    this.last_login = props.last_login ?? null;
    this.hired_at = props.hired_at ?? new Date();
    this.fired_at = props.fired_at ?? null;
    this.created_at = props.created_at ?? new Date();
    this.updated_at = props.updated_at ?? new Date();
  }

  // Factory method para criar funcionário
  static create(props: EmployeeConstructorProps): Employee {
    const employee = new Employee(props);
    employee.validate();
    return employee;
  }

  // Validação usando EmployeeValidator
  validate(fields?: string[]): boolean {
    const validator = EmployeeValidatorFactory.create();
    return validator.validate(this.notification, this, fields);
  }

  // Métodos de negócio específicos do supermercado
  
  // Ativar funcionário
  activate(): void {
    this.is_active = true;
    this.fired_at = null;
    this.updated_at = new Date();
  }

  // Desativar funcionário
  deactivate(): void {
    this.is_active = false;
    this.fired_at = new Date();
    this.updated_at = new Date();
  }

  // Atualizar último login
  updateLastLogin(): void {
    this.last_login = new Date();
    this.updated_at = new Date();
  }

  // Atualizar cargo
  updateRole(role: EmployeeRole): void {
    this.role = role;
    this.updated_at = new Date();
    this.validate(['role']);
  }

  // Atualizar departamento
  updateDepartment(department: EmployeeDepartment): void {
    this.department = department;
    this.updated_at = new Date();
    this.validate(['department']);
  }

  // Atualizar permissões
  updatePermissions(permissions: Record<string, any>): void {
    this.permissions = permissions;
    this.updated_at = new Date();
    this.validate(['permissions']);
  }

  // Atualizar horário de trabalho
  updateSchedule(schedule: Record<string, any>): void {
    this.schedule = schedule;
    this.updated_at = new Date();
    this.validate(['schedule']);
  }

  // Atualizar salário
  updateSalary(salary: number): void {
    this.salary = salary;
    this.updated_at = new Date();
    this.validate(['salary']);
  }

  // Verificar se é gerente
  isManager(): boolean {
    return this.role === 'MANAGER' || this.role === 'ADMIN';
  }

  // Verificar se é caixa
  isCashier(): boolean {
    return this.role === 'CASHIER';
  }

  // Verificar se está ativo
  isActive(): boolean {
    return this.is_active;
  }

  // Verificar se foi demitido
  isFired(): boolean {
    return this.fired_at !== null;
  }

  // Verificar se pode acessar relatórios
  canAccessReports(): boolean {
    return this.isManager() || this.role === 'OPERATOR';
  }

  // Verificar se pode fazer vendas
  canMakeSales(): boolean {
    return this.isCashier() || this.isManager();
  }

  // Verificar se pode gerenciar estoque
  canManageInventory(): boolean {
    return this.isManager() || this.role === 'OPERATOR';
  }

  // Verificar se pode gerenciar funcionários
  canManageEmployees(): boolean {
    return this.isManager();
  }

  // Calcular tempo de empresa
  getTenureInDays(): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - this.hired_at.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Verificar se está no período de experiência
  isOnProbation(): boolean {
    const tenureDays = this.getTenureInDays();
    return tenureDays <= 90; // 90 dias de experiência
  }

  // Verificar se pode receber comissão
  canReceiveCommission(): boolean {
    return this.isCashier() || this.isManager();
  }

  // Calcular comissão baseada em vendas
  calculateCommission(salesAmount: number, commissionRate: number = 0.02): number {
    if (!this.canReceiveCommission()) return 0;
    return salesAmount * commissionRate;
  }

  // Verificar se precisa de treinamento
  needsTraining(): boolean {
    return this.isOnProbation() || this.last_login === null;
  }

  // Atualizar senha
  updatePassword(newPasswordHash: string): void {
    this.password_hash = newPasswordHash;
    this.updated_at = new Date();
    this.validate(['password_hash']);
  }

  // Verificar se email é corporativo
  hasCorporateEmail(): boolean {
    return this.email.includes('@') && (
      this.email.includes('supermercado') ||
      this.email.includes('store') ||
      this.email.includes('empresa')
    );
  }

  get entity_id(): ValueObject {
    return this.employee_id;
  }

  toJSON() {
    return {
      employee_id: this.employee_id.toString(),
      stores_id: this.stores_id,
      name: this.name,
      email: this.email,
      employee_code: this.employee_code,
      role: this.role,
      department: this.department,
      permissions: this.permissions,
      schedule: this.schedule,
      salary: this.salary,
      is_active: this.is_active,
      last_login: this.last_login,
      hired_at: this.hired_at,
      fired_at: this.fired_at,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }

  static fake(): EmployeeFakeBuilder {
    return new EmployeeFakeBuilder();
  }
} 