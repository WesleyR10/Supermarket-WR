import { ISearchableRepository } from '../../../shared/domain/repository/repository-interface';
import { SearchParams } from '../../../shared/domain/repository/search-params';
import { SearchResult } from '../../../shared/domain/repository/search-result';
import { Employee, EmployeeId} from '../employee.aggregate';
import { EmployeeDepartment, EmployeeRole } from '../employee.enums';

export type EmployeeFilter = {
  stores_id?: string;
  name?: string;
  email?: string;
  role?: EmployeeRole;
  department?: EmployeeDepartment;
  is_active?: boolean;
  employee_code?: string;
  hired_after?: Date;
  hired_before?: Date;
  salary_min?: number;
  salary_max?: number;
};

export class EmployeeSearchParams extends SearchParams<EmployeeFilter> {
  get filter(): EmployeeFilter | null {
    return this._filter;
  }

  protected set filter(value: EmployeeFilter | null) {
    const _value =
      !value || (value as unknown) === '' || typeof value !== 'object'
        ? null
        : value;

    const filter = {
      ...(_value && _value.stores_id && { stores_id: `${_value.stores_id}` }),
      ...(_value && _value.name && { name: `${_value.name}` }),
      ...(_value && _value.email && { email: `${_value.email}` }),
      ...(_value && _value.role && { role: _value.role }),
      ...(_value && _value.department && { department: _value.department }),
      ...(_value && _value.is_active !== undefined && { is_active: _value.is_active }),
      ...(_value && _value.employee_code && { employee_code: `${_value.employee_code}` }),
      ...(_value && _value.hired_after && { hired_after: _value.hired_after }),
      ...(_value && _value.hired_before && { hired_before: _value.hired_before }),
      ...(_value && _value.salary_min !== undefined && { salary_min: _value.salary_min }),
      ...(_value && _value.salary_max !== undefined && { salary_max: _value.salary_max }),
    };

    this._filter = Object.keys(filter).length === 0 ? null : filter;
  }
}

export class EmployeeSearchResult extends SearchResult<Employee> {
  constructor(props: SearchResult<Employee>) {
    super(props);
  }
}

export interface IEmployeeRepository extends ISearchableRepository<
  Employee,
  EmployeeId,
  EmployeeFilter,
  EmployeeSearchParams,
  EmployeeSearchResult
> {
  // Métodos básicos herdados de ISearchableRepository
  // findById, findAll, insert, update, delete, search, etc.

  // Métodos específicos do domínio de supermercado
  
  // Buscar funcionários por loja
  findByStore(storeId: string): Promise<Employee[]>;

  // Buscar funcionários por cargo
  findByRole(role: EmployeeRole): Promise<Employee[]>;
  
  // Buscar funcionários por departamento
  findByDepartment(department: EmployeeDepartment): Promise<Employee[]>;
  
  // Buscar funcionários ativos
  findActiveEmployees(): Promise<Employee[]>;
  
  // Buscar funcionários inativos
  findInactiveEmployees(): Promise<Employee[]>;
  
  // Buscar funcionários por email
  findByEmail(email: string): Promise<Employee | null>;
  
  // Buscar funcionário por código
  findByEmployeeCode(employeeCode: string): Promise<Employee | null>;
  
  // Buscar funcionários que podem fazer vendas
  findSalesEmployees(): Promise<Employee[]>;
  
  // Buscar funcionários que podem acessar relatórios
  findReportAccessEmployees(): Promise<Employee[]>;
  
  // Buscar funcionários que podem gerenciar estoque
  findInventoryManagementEmployees(): Promise<Employee[]>;
  
  // Buscar funcionários que podem gerenciar outros funcionários
  findEmployeeManagementEmployees(): Promise<Employee[]>;
  
  // Buscar funcionários em período de experiência
  findProbationEmployees(): Promise<Employee[]>;
  
  // Buscar funcionários que precisam de treinamento
  findEmployeesNeedingTraining(): Promise<Employee[]>;
  
  // Buscar funcionários por faixa salarial
  findBySalaryRange(minSalary: number, maxSalary: number): Promise<Employee[]>;
  
  // Buscar funcionários contratados em um período
  findHiredInPeriod(startDate: Date, endDate: Date): Promise<Employee[]>;
  
  // Buscar funcionários demitidos em um período
  findFiredInPeriod(startDate: Date, endDate: Date): Promise<Employee[]>;
  
  // Buscar funcionários que não fizeram login recentemente
  findInactiveLoginEmployees(daysThreshold: number): Promise<Employee[]>;
  
  // Buscar funcionários com email corporativo
  findCorporateEmailEmployees(): Promise<Employee[]>;
  
  // Buscar funcionários com email pessoal
  findPersonalEmailEmployees(): Promise<Employee[]>;
  
  // Relatórios específicos
  
  // Contar funcionários por cargo
  countByRole(): Promise<{ role: string; count: number }[]>;
  
  // Contar funcionários por departamento
  countByDepartment(): Promise<{ department: string; count: number }[]>;
  
  // Contar funcionários por loja
  countByStore(): Promise<{ store_id: string; count: number }[]>;
  
  // Salário médio por cargo
  getAverageSalaryByRole(): Promise<{ role: string; average_salary: number }[]>;
  
  // Salário médio por departamento
  getAverageSalaryByDepartment(): Promise<{ department: string; average_salary: number }[]>;
  
  // Funcionários com maior salário
  getHighestPaidEmployees(limit?: number): Promise<Employee[]>;
  
  // Funcionários com menor salário
  getLowestPaidEmployees(limit?: number): Promise<Employee[]>;
  
  // Funcionários com mais tempo de empresa
  getLongestTenureEmployees(limit?: number): Promise<Employee[]>;
  
  // Validações de negócio
  
  // Verificar se email já existe
  existsByEmail(email: string, excludeId?: EmployeeId): Promise<boolean>;
  
  // Verificar se código de funcionário já existe
  existsByEmployeeCode(employeeCode: string, excludeId?: EmployeeId): Promise<boolean>;
  
  // Verificar se funcionário pode ser promovido
  canBePromoted(employeeId: EmployeeId): Promise<boolean>;
  
  // Verificar se funcionário pode ser demitido
  canBeFired(employeeId: EmployeeId): Promise<boolean>;
  
  // Métodos de auditoria
  
  // Funcionários modificados recentemente
  findRecentlyModified(days: number): Promise<Employee[]>;
  
  // Funcionários criados recentemente
  findRecentlyCreated(days: number): Promise<Employee[]>;
  
  // Funcionários com problemas de compliance
  findComplianceIssues(): Promise<Employee[]>;
  
  // Funcionários com permissões excessivas
  findOverPrivilegedEmployees(): Promise<Employee[]>;
  
  // Funcionários sem permissões adequadas
  findUnderPrivilegedEmployees(): Promise<Employee[]>;
}