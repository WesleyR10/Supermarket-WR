import { InMemorySearchableRepository } from '../../../../shared/infra/db/in-memory/in-memory.repository';
import { Employee, EmployeeId } from '../../../domain/employee.aggregate';
import { EmployeeRole, EmployeeDepartment } from '../../../domain/employee.enums';
import {
  IEmployeeRepository,
  EmployeeFilter,
  EmployeeSearchParams,
  EmployeeSearchResult,
} from '../../../domain/repositories/employee.repository';

export class EmployeeInMemoryRepository
  extends InMemorySearchableRepository<
    Employee,
    EmployeeId,
    EmployeeFilter,
    EmployeeSearchParams,
    EmployeeSearchResult
  >
  implements IEmployeeRepository
{
  sortableFields: string[] = [
    'name',
    'email',
    'employee_code',
    'role',
    'department',
    'salary',
    'hired_at',
    'fired_at',
    'last_login',
    'created_at',
    'updated_at',
    'is_active',
  ];

  protected async applyFilter(
    items: Employee[],
    filter: EmployeeFilter | null,
  ): Promise<Employee[]> {
    if (!filter) {
      return items;
    }

    return items.filter((item) => {
      const matchesStoreId = !filter.stores_id || item.stores_id === filter.stores_id;
      const matchesName = !filter.name || item.name.toLowerCase().includes(filter.name.toLowerCase());
      const matchesEmail = !filter.email || item.email.toLowerCase().includes(filter.email.toLowerCase());
      const matchesRole = !filter.role || item.role === filter.role;
      const matchesDepartment = !filter.department || item.department === filter.department;
      const matchesActive = filter.is_active === undefined || item.is_active === filter.is_active;
      const matchesEmployeeCode = !filter.employee_code || 
        (item.employee_code && item.employee_code.toLowerCase().includes(filter.employee_code.toLowerCase()));
      
      const matchesHiredAfter = !filter.hired_after || item.hired_at >= filter.hired_after;
      const matchesHiredBefore = !filter.hired_before || item.hired_at <= filter.hired_before;
      
      const matchesSalaryMin = !filter.salary_min || (item.salary !== null && item.salary >= filter.salary_min);
      const matchesSalaryMax = !filter.salary_max || (item.salary !== null && item.salary <= filter.salary_max);

      return matchesStoreId && matchesName && matchesEmail && matchesRole && 
             matchesDepartment && matchesActive && matchesEmployeeCode &&
             matchesHiredAfter && matchesHiredBefore && matchesSalaryMin && matchesSalaryMax;
    });
  }

  getEntity(): new (...args: any[]) => Employee {
    return Employee;
  }

  protected applySort(
    items: Employee[],
    sort: string | null,
    sort_dir: 'asc' | 'desc' | null,
  ): Employee[] {
    return !sort
      ? super.applySort(items, 'created_at', 'desc')
      : super.applySort(items, sort, sort_dir);
  }

  // Métodos específicos do domínio de supermercado
  
  async findByStore(storeId: string): Promise<Employee[]> {
    return this.items.filter((employee) => employee.stores_id === storeId);
  }

  async findByRole(role: EmployeeRole): Promise<Employee[]> {
    return this.items.filter((employee) => employee.role === role);
  }
  
  async findByDepartment(department: EmployeeDepartment): Promise<Employee[]> {
    return this.items.filter((employee) => employee.department === department);
  }
  
  async findActiveEmployees(): Promise<Employee[]> {
    return this.items.filter((employee) => employee.is_active);
  }
  
  async findInactiveEmployees(): Promise<Employee[]> {
    return this.items.filter((employee) => !employee.is_active);
  }
  
  async findByEmail(email: string): Promise<Employee | null> {
    const employee = this.items.find((employee) => employee.email === email);
    return employee || null;
  }
  
  async findByEmployeeCode(employeeCode: string): Promise<Employee | null> {
    const employee = this.items.find((employee) => employee.employee_code === employeeCode);
    return employee || null;
  }
  
  async findSalesEmployees(): Promise<Employee[]> {
    return this.items.filter((employee) => employee.canMakeSales());
  }
  
  async findReportAccessEmployees(): Promise<Employee[]> {
    return this.items.filter((employee) => employee.canAccessReports());
  }
  
  async findInventoryManagementEmployees(): Promise<Employee[]> {
    return this.items.filter((employee) => employee.canManageInventory());
  }
  
  async findEmployeeManagementEmployees(): Promise<Employee[]> {
    return this.items.filter((employee) => employee.canManageEmployees());
  }
  
  async findProbationEmployees(): Promise<Employee[]> {
    return this.items.filter((employee) => employee.isOnProbation());
  }
  
  async findEmployeesNeedingTraining(): Promise<Employee[]> {
    return this.items.filter((employee) => employee.needsTraining());
  }
  
  async findBySalaryRange(minSalary: number, maxSalary: number): Promise<Employee[]> {
    return this.items.filter(
      (employee) =>
        employee.salary !== null &&
        employee.salary >= minSalary &&
        employee.salary <= maxSalary
    );
  }
  
  async findHiredInPeriod(startDate: Date, endDate: Date): Promise<Employee[]> {
    return this.items.filter(
      (employee) => employee.hired_at >= startDate && employee.hired_at <= endDate
    );
  }
  
  async findFiredInPeriod(startDate: Date, endDate: Date): Promise<Employee[]> {
    return this.items.filter(
      (employee) =>
        employee.fired_at !== null &&
        employee.fired_at >= startDate &&
        employee.fired_at <= endDate
    );
  }
  
  async findInactiveLoginEmployees(daysThreshold: number): Promise<Employee[]> {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);
    
    return this.items.filter(
      (employee) =>
        employee.last_login === null ||
        employee.last_login < thresholdDate
    );
  }
  
  async findCorporateEmailEmployees(): Promise<Employee[]> {
    return this.items.filter((employee) => employee.hasCorporateEmail());
  }
  
  async findPersonalEmailEmployees(): Promise<Employee[]> {
    return this.items.filter((employee) => !employee.hasCorporateEmail());
  }
  
  // Relatórios específicos
  
  async countByRole(): Promise<{ role: string; count: number }[]> {
    const roleCount = new Map<string, number>();
    
    this.items.forEach((employee) => {
      const count = roleCount.get(employee.role) || 0;
      roleCount.set(employee.role, count + 1);
    });
    
    return Array.from(roleCount.entries()).map(([role, count]) => ({ role, count }));
  }
  
  async countByDepartment(): Promise<{ department: string; count: number }[]> {
    const departmentCount = new Map<string, number>();
    
    this.items.forEach((employee) => {
      const count = departmentCount.get(employee.department) || 0;
      departmentCount.set(employee.department, count + 1);
    });
    
    return Array.from(departmentCount.entries()).map(([department, count]) => ({ department, count }));
  }
  
  async countByStore(): Promise<{ store_id: string; count: number }[]> {
    const storeCount = new Map<string, number>();
    
    this.items.forEach((employee) => {
      const count = storeCount.get(employee.stores_id) || 0;
      storeCount.set(employee.stores_id, count + 1);
    });
    
    return Array.from(storeCount.entries()).map(([store_id, count]) => ({ store_id, count }));
  }
  
  async getAverageSalaryByRole(): Promise<{ role: string; average_salary: number }[]> {
    const roleData = new Map<string, { total: number; count: number }>();
    
    this.items.forEach((employee) => {
      if (employee.salary !== null) {
        const data = roleData.get(employee.role) || { total: 0, count: 0 };
        data.total += employee.salary;
        data.count += 1;
        roleData.set(employee.role, data);
      }
    });
    
    return Array.from(roleData.entries()).map(([role, data]) => ({
      role,
      average_salary: data.total / data.count,
    }));
  }
  
  async getAverageSalaryByDepartment(): Promise<{ department: string; average_salary: number }[]> {
    const departmentData = new Map<string, { total: number; count: number }>();
    
    this.items.forEach((employee) => {
      if (employee.salary !== null) {
        const data = departmentData.get(employee.department) || { total: 0, count: 0 };
        data.total += employee.salary;
        data.count += 1;
        departmentData.set(employee.department, data);
      }
    });
    
    return Array.from(departmentData.entries()).map(([department, data]) => ({
      department,
      average_salary: data.total / data.count,
    }));
  }
  
  async getHighestPaidEmployees(limit: number = 10): Promise<Employee[]> {
    return this.items
      .filter((employee) => employee.salary !== null)
      .sort((a, b) => (b.salary || 0) - (a.salary || 0))
      .slice(0, limit);
  }
  
  async getLowestPaidEmployees(limit: number = 10): Promise<Employee[]> {
    return this.items
      .filter((employee) => employee.salary !== null)
      .sort((a, b) => (a.salary || 0) - (b.salary || 0))
      .slice(0, limit);
  }
  
  async getLongestTenureEmployees(limit: number = 10): Promise<Employee[]> {
    return this.items
      .sort((a, b) => a.hired_at.getTime() - b.hired_at.getTime())
      .slice(0, limit);
  }
  
  // Validações de negócio
  
  async existsByEmail(email: string, excludeId?: EmployeeId): Promise<boolean> {
    return this.items.some(
      (employee) =>
        employee.email === email &&
        (!excludeId || !employee.employee_id.equals(excludeId))
    );
  }
  
  async existsByEmployeeCode(employeeCode: string, excludeId?: EmployeeId): Promise<boolean> {
    return this.items.some(
      (employee) =>
        employee.employee_code === employeeCode &&
        (!excludeId || !employee.employee_id.equals(excludeId))
    );
  }
  
  async canBePromoted(employeeId: EmployeeId): Promise<boolean> {
    const employee = await this.findById(employeeId);
    if (!employee) return false;
    
    // Lógica de negócio: funcionário deve estar ativo e não estar em período de experiência
    return employee.is_active && !employee.isOnProbation();
  }
  
  async canBeFired(employeeId: EmployeeId): Promise<boolean> {
    const employee = await this.findById(employeeId);
    if (!employee) return false;
    
    // Lógica de negócio: funcionário deve estar ativo
    return employee.is_active;
  }
  
  // Métodos de auditoria
  
  async findRecentlyModified(days: number): Promise<Employee[]> {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - days);
    
    return this.items.filter((employee) => employee.updated_at >= thresholdDate);
  }
  
  async findRecentlyCreated(days: number): Promise<Employee[]> {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - days);
    
    return this.items.filter((employee) => employee.created_at >= thresholdDate);
  }
  
  async findComplianceIssues(): Promise<Employee[]> {
    return this.items.filter(
      (employee) =>
        // Funcionários sem código de funcionário
        employee.employee_code === null ||
        // Funcionários sem salário definido
        employee.salary === null ||
        // Funcionários com email pessoal
        !employee.hasCorporateEmail()
    );
  }
  
  async findOverPrivilegedEmployees(): Promise<Employee[]> {
    return this.items.filter(
      (employee) =>
        // Funcionários com muitas permissões para seu cargo
        employee.role === EmployeeRole.CASHIER && employee.canManageEmployees()
    );
  }
  
  async findUnderPrivilegedEmployees(): Promise<Employee[]> {
    return this.items.filter(
      (employee) =>
        // Gerentes que não podem gerenciar funcionários
        employee.role === EmployeeRole.MANAGER && !employee.canManageEmployees()
    );
  }
}