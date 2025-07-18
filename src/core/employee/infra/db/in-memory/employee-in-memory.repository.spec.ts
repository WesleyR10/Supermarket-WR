import { EmployeeInMemoryRepository } from './employee-in-memory.repository';
import { Employee } from '../../../domain/employee.aggregate';
import { EmployeeRole, EmployeeDepartment } from '../../../domain/employee.enums';
import { EmployeeFakeBuilder } from '../../../domain/employee-fake.builder';
import { EmployeeSearchParams } from '../../../domain/repositories/employee.repository';

describe('EmployeeInMemoryRepository', () => {
  let repository: EmployeeInMemoryRepository;
  const employees: Employee[] = [];

  beforeEach(async () => {
    repository = new EmployeeInMemoryRepository();
    employees.length = 0;

    // Criar 15 funcionários para testes abrangentes
    // 5 funcionários ativos para store-1
    employees.push(
      new EmployeeFakeBuilder()
        .stores_id('store-1')
        .name('Admin Principal')
        .email('admin@supermercado.com')
        .employee_code('EMP001')
        .asAdmin()
        .build(),
      new EmployeeFakeBuilder()
        .stores_id('store-1')
        .name('Gerente Loja 1')
        .email('gerente1@supermercado.com')
        .employee_code('EMP002')
        .asManager()
        .build(),
      new EmployeeFakeBuilder()
        .stores_id('store-1')
        .name('Caixa 1')
        .email('caixa1@supermercado.com')
        .employee_code('EMP003')
        .asCashier()
        .build(),
      new EmployeeFakeBuilder()
        .stores_id('store-1')
        .name('Caixa 2')
        .email('caixa2@supermercado.com')
        .employee_code('EMP004')
        .asCashier()
        .build(),
      new EmployeeFakeBuilder()
        .stores_id('store-1')
        .name('Operador Estoque 1')
        .email('operador1@supermercado.com')
        .employee_code('EMP005')
        .asOperator()
        .build()
    );

    // 4 funcionários ativos para store-2
    employees.push(
      new EmployeeFakeBuilder()
        .stores_id('store-2')
        .name('Gerente Loja 2')
        .email('gerente2@supermercado.com')
        .employee_code('EMP006')
        .asManager()
        .build(),
      new EmployeeFakeBuilder()
        .stores_id('store-2')
        .name('Caixa 3')
        .email('caixa3@supermercado.com')
        .employee_code('EMP007')
        .asCashier()
        .build(),
      new EmployeeFakeBuilder()
        .stores_id('store-2')
        .name('Operador Estoque 2')
        .email('operador2@supermercado.com')
        .employee_code('EMP008')
        .asOperator()
        .build(),
      new EmployeeFakeBuilder()
        .stores_id('store-2')
        .name('Funcionário Novo')
        .email('novo@supermercado.com')
        .employee_code('EMP009')
        .asCashier()
        .onProbation()
        .build()
    );

    // 3 funcionários inativos para store-1
    employees.push(
      new EmployeeFakeBuilder()
        .stores_id('store-1')
        .name('Ex-Funcionário 1')
        .email('ex1@supermercado.com')
        .employee_code('EMP010')
        .asCashier()
        .inactive()
        .build(),
      new EmployeeFakeBuilder()
        .stores_id('store-1')
        .name('Ex-Funcionário 2')
        .email('ex2@supermercado.com')
        .employee_code('EMP011')
        .asOperator()
        .inactive()
        .build(),
      new EmployeeFakeBuilder()
        .stores_id('store-1')
        .name('Ex-Gerente')
        .email('exgerente@supermercado.com')
        .employee_code('EMP012')
        .asManager()
        .inactive()
        .build()
    );

    // 2 funcionários com características especiais
    employees.push(
      new EmployeeFakeBuilder()
        .stores_id('store-1')
        .name('Funcionário Alto Salário')
        .email('alto.salario@supermercado.com')
        .employee_code('EMP013')
        .asManager()
        .withHighSalary()
        .build(),
      new EmployeeFakeBuilder()
        .stores_id('store-2')
        .name('Funcionário Email Pessoal')
        .email('pessoal@gmail.com')
        .employee_code('EMP014')
        .asCashier()
        .withPersonalEmail()
        .build()
    );

    // 1 funcionário sem login recente
    employees.push(
      new EmployeeFakeBuilder()
        .stores_id('store-1')
        .name('Funcionário Sem Login')
        .email('semlogin@supermercado.com')
        .employee_code('EMP015')
        .asCashier()
        .last_login(null)
        .build()
    );

    // Inserir todos os funcionários no repositório
    for (const employee of employees) {
      await repository.insert(employee);
    }
  });

  describe('Basic Repository Operations', () => {
    it('should insert and find employee by id', async () => {
      const employee = employees[0];
      const found = await repository.findById(employee.employee_id);
      expect(found).toEqual(employee);
    });

    it('should find all employees', async () => {
      const allEmployees = await repository.findAll();
      expect(allEmployees).toHaveLength(15);
    });

    it('should update employee', async () => {
      const employee = employees[0];
      employee.updateSalary(10000);
      await repository.update(employee);
      
      const updated = await repository.findById(employee.employee_id);
      expect(updated?.salary).toBe(10000);
    });

    it('should delete employee', async () => {
      const employee = employees[0];
      await repository.delete(employee.employee_id);
      
      const found = await repository.findById(employee.employee_id);
      expect(found).toBeNull();
    });
  });

  describe('Domain-Specific Methods', () => {
    it('should find active employees', async () => {
      const activeEmployees = await repository.findActiveEmployees();
      expect(activeEmployees).toHaveLength(12); // 15 total - 3 inativos
    });

    it('should find employees by store', async () => {
      const store1Employees = await repository.findByStore('store-1');
      expect(store1Employees).toHaveLength(10); // 5 ativos + 3 inativos + 2 especiais
    });

    it('should find employees by role', async () => {
      const cashiers = await repository.findByRole(EmployeeRole.CASHIER);
      expect(cashiers).toHaveLength(7); // 7 caixas no total
    });

    it('should find employees by department', async () => {
      const salesEmployees = await repository.findByDepartment(EmployeeDepartment.SALES);
      expect(salesEmployees).toHaveLength(7); // Todos os caixas estão em SALES
    });

    it('should find employee by email', async () => {
      const employee = await repository.findByEmail('admin@supermercado.com');
      expect(employee?.name).toBe('Admin Principal');
    });

    it('should find employee by employee code', async () => {
      const employee = await repository.findByEmployeeCode('EMP001');
      expect(employee?.name).toBe('Admin Principal');
    });

    it('should find sales employees', async () => {
      const salesEmployees = await repository.findSalesEmployees();
      expect(salesEmployees.length).toBeGreaterThan(0);
      salesEmployees.forEach(emp => {
        expect(emp.canMakeSales()).toBe(true);
      });
    });

    it('should find employees needing training', async () => {
      const needingTraining = await repository.findEmployeesNeedingTraining();
      expect(needingTraining.length).toBeGreaterThan(0);
    });

    it('should find employees by salary range', async () => {
      const highSalaryEmployees = await repository.findBySalaryRange(10000, 20000);
      expect(highSalaryEmployees.length).toBeGreaterThan(0);
    });

    it('should find corporate email employees', async () => {
      const corporateEmployees = await repository.findCorporateEmailEmployees();
      expect(corporateEmployees).toHaveLength(14); // Todos exceto o com email pessoal (joao.silva@gmail.com)
    });

    it('should find personal email employees', async () => {
      const personalEmployees = await repository.findPersonalEmailEmployees();
      expect(personalEmployees).toHaveLength(1); // Apenas o funcionário com Gmail
    });
  });

  describe('Reporting Methods', () => {
    it('should count employees by role', async () => {
      const roleCount = await repository.countByRole();
      expect(roleCount).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ role: EmployeeRole.ADMIN, count: 1 }),
          expect.objectContaining({ role: EmployeeRole.MANAGER, count: 4 }),
          expect.objectContaining({ role: EmployeeRole.CASHIER, count: 7 }),
          expect.objectContaining({ role: EmployeeRole.OPERATOR, count: 3 })
        ])
      );
    });

    it('should count employees by store', async () => {
      const storeCount = await repository.countByStore();
      expect(storeCount).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ store_id: 'store-1', count: 10 }), // 5 ativos + 3 inativos + 2 especiais
          expect.objectContaining({ store_id: 'store-2', count: 5 })   // 4 ativos + 1 especial
        ])
      );
    });

    it('should count employees by department', async () => {
      const departmentCount = await repository.countByDepartment();
      expect(departmentCount.length).toBeGreaterThan(0);
    });

    it('should count employees by store', async () => {
      const storeCount = await repository.countByStore();
      expect(storeCount).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ store_id: 'store-1', count: 10 }), // Era 9, agora 10
          expect.objectContaining({ store_id: 'store-2', count: 5 })   // Era 6, agora 5
        ])
      );
    });

    it('should get average salary by role', async () => {
      const avgSalary = await repository.getAverageSalaryByRole();
      expect(avgSalary.length).toBeGreaterThan(0);
      avgSalary.forEach(item => {
        expect(item.average_salary).toBeGreaterThan(0);
      });
    });

    it('should get highest paid employees', async () => {
      const highestPaid = await repository.getHighestPaidEmployees(3);
      expect(highestPaid).toHaveLength(3);
      // Verificar se estão ordenados por salário decrescente
      for (let i = 0; i < highestPaid.length - 1; i++) {
        expect(highestPaid[i].salary).toBeGreaterThanOrEqual(highestPaid[i + 1].salary!);
      }
    });

    it('should get longest tenure employees', async () => {
      const longestTenure = await repository.getLongestTenureEmployees(3);
      expect(longestTenure).toHaveLength(3);
    });
  });

  describe('Validation Methods', () => {
    it('should check if email exists', async () => {
      const exists = await repository.existsByEmail('admin@supermercado.com');
      expect(exists).toBe(true);
      
      const notExists = await repository.existsByEmail('naoexiste@teste.com');
      expect(notExists).toBe(false);
    });

    it('should check if employee code exists', async () => {
      const exists = await repository.existsByEmployeeCode('EMP001');
      expect(exists).toBe(true);
      
      const notExists = await repository.existsByEmployeeCode('EMP999');
      expect(notExists).toBe(false);
    });

    it('should check if employee can be promoted', async () => {
      const activeEmployee = employees.find(emp => emp.is_active && !emp.isOnProbation());
      if (activeEmployee) {
        const canBePromoted = await repository.canBePromoted(activeEmployee.employee_id);
        expect(canBePromoted).toBe(true);
      }
    });

    it('should check if employee can be fired', async () => {
      const activeEmployee = employees.find(emp => emp.is_active);
      if (activeEmployee) {
        const canBeFired = await repository.canBeFired(activeEmployee.employee_id);
        expect(canBeFired).toBe(true);
      }
    });
  });

  describe('Audit Methods', () => {
    it('should find compliance issues', async () => {
      const issues = await repository.findComplianceIssues();
      expect(issues.length).toBeGreaterThan(0); // Funcionário com email pessoal
    });

    it('should find recently created employees', async () => {
      const recent = await repository.findRecentlyCreated(30);
      expect(recent).toHaveLength(15); // Todos foram criados recentemente
    });

    it('should find inactive login employees', async () => {
      const inactiveLogin = await repository.findInactiveLoginEmployees(1);
      expect(inactiveLogin.length).toBeGreaterThan(0); // Funcionário sem login
    });
  });

  describe('Sorting', () => {
    it('should apply default sorting by created_at desc', async () => {
      const searchParams = new EmployeeSearchParams({
        page: 1,
        per_page: 10,
        sort: null,
        sort_dir: null,
        filter: null,
      });
      
      const result = await repository.search(searchParams);
      
      expect(result.items.length).toBeGreaterThan(0);
      // Verificar ordenação padrão
      for (let i = 0; i < result.items.length - 1; i++) {
        expect(result.items[i].created_at.getTime())
          .toBeGreaterThanOrEqual(result.items[i + 1].created_at.getTime());
      }
    });

    it('should sort by name ascending', async () => {
      const searchParams = new EmployeeSearchParams({
        page: 1,
        per_page: 10,
        sort: 'name',
        sort_dir: 'asc',
        filter: null,
      });
      
      const result = await repository.search(searchParams);
      
      expect(result.items.length).toBeGreaterThan(0);
      // Verificar ordenação por nome
      for (let i = 0; i < result.items.length - 1; i++) {
        expect(result.items[i].name.localeCompare(result.items[i + 1].name))
          .toBeLessThanOrEqual(0);
      }
    });
  });

  describe('Filtering', () => {
    it('should filter by store id', async () => {
      const searchParams = new EmployeeSearchParams({
        page: 1,
        per_page: 20,
        sort: null,
        sort_dir: null,
        filter: { stores_id: 'store-1' },
      });
      
      const result = await repository.search(searchParams);
      
      expect(result.items.length).toBe(10);
      result.items.forEach(employee => {
        expect(employee.stores_id).toBe('store-1');
      });
    });

    it('should filter by role', async () => {
      const searchParams = new EmployeeSearchParams({
        page: 1,
        per_page: 20,
        sort: null,
        sort_dir: null,
        filter: { role: EmployeeRole.CASHIER },
      });
      
      const result = await repository.search(searchParams);
      
      expect(result.items.length).toBe(7); // Era 6, agora 7
      result.items.forEach(employee => {
        expect(employee.role).toBe(EmployeeRole.CASHIER);
      });
    });

    it('should filter by active status', async () => {
      const searchParams = new EmployeeSearchParams({
        page: 1,
        per_page: 20,
        sort: null,
        sort_dir: null,
        filter: { is_active: true },
      });
      
      const result = await repository.search(searchParams);
      
      expect(result.items.length).toBe(12);
      result.items.forEach(employee => {
        expect(employee.is_active).toBe(true);
      });
    });

    it('should filter by salary range', async () => {
      const searchParams = new EmployeeSearchParams({
        page: 1,
        per_page: 20,
        sort: null,
        sort_dir: null,
        filter: { salary_min: 5000, salary_max: 20000 },
      });
      
      const result = await repository.search(searchParams);
      
      result.items.forEach(employee => {
        expect(employee.salary).toBeGreaterThanOrEqual(5000);
        expect(employee.salary).toBeLessThanOrEqual(20000);
      });
    });
  });
});