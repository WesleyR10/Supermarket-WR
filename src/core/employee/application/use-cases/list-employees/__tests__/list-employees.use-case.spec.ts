import { EmployeeInMemoryRepository } from '../../../../infra/db/in-memory/employee-in-memory.repository';
import { ListEmployeesUseCase } from '../list-employees.use-case';
import { ListEmployeesInput } from '../list-employees.input';
import { EmployeeFakeBuilder } from '../../../../domain/employee-fake.builder';
import { EmployeeRole, EmployeeDepartment } from '../../../../domain/employee.enums';
import { Employee } from '../../../../domain/employee.aggregate';

describe('ListEmployeesUseCase Unit Tests', () => {
  let useCase: ListEmployeesUseCase;
  let repository: EmployeeInMemoryRepository;

  beforeEach(() => {
    repository = new EmployeeInMemoryRepository();
    useCase = new ListEmployeesUseCase(repository);
  });

  describe('execute', () => {
    it('should return paginated employees', async () => {
      const employees = EmployeeFakeBuilder.createMany(15);
      employees.forEach(async (employee) => {
        await repository.insert(employee);
      });

      const input: ListEmployeesInput = {
        page: 1,
        per_page: 10,
        sort: null,
        sort_dir: null,
        filter: null,
      };

      const output = await useCase.execute(input);

      expect(output.items).toHaveLength(10);
      expect(output.total).toBe(15);
      expect(output.current_page).toBe(1);
      expect(output.per_page).toBe(10);
      expect(output.last_page).toBe(2);
    });

    it('should filter employees by store_id', async () => {
      const store1Employees = [
        new EmployeeFakeBuilder().store_id('store-1').name('Employee 1').build(),
        new EmployeeFakeBuilder().store_id('store-1').name('Employee 2').build(),
      ];
      const store2Employees = [
        new EmployeeFakeBuilder().store_id('store-2').name('Employee 3').build(),
      ];

      for (const employee of [...store1Employees, ...store2Employees]) {
        await repository.insert(employee);
      }

      const input: ListEmployeesInput = {
        filter: {
          store_id: 'store-1',
        },
      };

      const output = await useCase.execute(input);

      expect(output.items).toHaveLength(2);
      expect(output.total).toBe(2);
      output.items.forEach((item) => {
        expect(item.store_id).toBe('store-1');
      });
    });

    it('should filter employees by role', async () => {
      const employees = [
        new EmployeeFakeBuilder().store_id('store-1').asAdmin().build(),
        new EmployeeFakeBuilder().store_id('store-1').asManager().build(),
        new EmployeeFakeBuilder().store_id('store-1').asCashier().build(),
        new EmployeeFakeBuilder().store_id('store-1').asCashier().build(),
      ];

      for (const employee of employees) {
        await repository.insert(employee);
      }

      const input: ListEmployeesInput = {
        filter: {
          store_id: 'store-1',
          role: EmployeeRole.CASHIER,
        },
      };

      const output = await useCase.execute(input);

      expect(output.items).toHaveLength(2);
      output.items.forEach((item) => {
        expect(item.role).toBe(EmployeeRole.CASHIER);
      });
    });

    it('should filter employees by department', async () => {
      const employees = [
        new EmployeeFakeBuilder().store_id('store-1').department(EmployeeDepartment.SALES).build(),
        new EmployeeFakeBuilder().store_id('store-1').department(EmployeeDepartment.SALES).build(),
        new EmployeeFakeBuilder().store_id('store-1').department(EmployeeDepartment.IT).build(),
      ];

      for (const employee of employees) {
        await repository.insert(employee);
      }

      const input: ListEmployeesInput = {
        filter: {
          store_id: 'store-1',
          department: EmployeeDepartment.SALES,
        },
      };

      const output = await useCase.execute(input);

      expect(output.items).toHaveLength(2);
      output.items.forEach((item) => {
        expect(item.department).toBe(EmployeeDepartment.SALES);
      });
    });

    it('should filter employees by active status', async () => {
      const employees = [
        new EmployeeFakeBuilder().store_id('store-1').name('Active 1').build(),
        new EmployeeFakeBuilder().store_id('store-1').name('Active 2').build(),
        new EmployeeFakeBuilder().store_id('store-1').name('Inactive 1').inactive().build(),
      ];

      for (const employee of employees) {
        await repository.insert(employee);
      }

      const input: ListEmployeesInput = {
        filter: {
          store_id: 'store-1',
          is_active: true,
        },
      };

      const output = await useCase.execute(input);

      expect(output.items).toHaveLength(2);
      output.items.forEach((item) => {
        expect(item.is_active).toBe(true);
      });
    });

    it('should filter employees by name', async () => {
      const employees = [
        new EmployeeFakeBuilder().store_id('store-1').name('João Silva').build(),
        new EmployeeFakeBuilder().store_id('store-1').name('Maria Santos').build(),
        new EmployeeFakeBuilder().store_id('store-1').name('Pedro Oliveira').build(),
      ];

      for (const employee of employees) {
        await repository.insert(employee);
      }

      const input: ListEmployeesInput = {
        filter: {
          store_id: 'store-1',
          name: 'João',
        },
      };

      const output = await useCase.execute(input);

      expect(output.items).toHaveLength(1);
      expect(output.items[0].name).toContain('João');
    });

    it('should filter employees by email', async () => {
      const employees = [
        new EmployeeFakeBuilder().store_id('store-1').email('joao@supermercado.com').build(),
        new EmployeeFakeBuilder().store_id('store-1').email('maria@supermercado.com').build(),
      ];

      for (const employee of employees) {
        await repository.insert(employee);
      }

      const input: ListEmployeesInput = {
        filter: {
          store_id: 'store-1',
          email: 'joao@supermercado.com',
        },
      };

      const output = await useCase.execute(input);

      expect(output.items).toHaveLength(1);
      expect(output.items[0].email).toBe('joao@supermercado.com');
    });

    it('should filter employees by employee_code', async () => {
      const employees = [
        new EmployeeFakeBuilder().store_id('store-1').employee_code('EMP001').build(),
        new EmployeeFakeBuilder().store_id('store-1').employee_code('EMP002').build(),
      ];

      for (const employee of employees) {
        await repository.insert(employee);
      }

      const input: ListEmployeesInput = {
        filter: {
          store_id: 'store-1',
          employee_code: 'EMP001',
        },
      };

      const output = await useCase.execute(input);

      expect(output.items).toHaveLength(1);
      expect(output.items[0].employee_code).toBe('EMP001');
    });

    it('should filter employees by salary range', async () => {
      const employees = [
        new EmployeeFakeBuilder().store_id('store-1').salary(3000).build(),
        new EmployeeFakeBuilder().store_id('store-1').salary(5000).build(),
        new EmployeeFakeBuilder().store_id('store-1').salary(8000).build(),
        new EmployeeFakeBuilder().store_id('store-1').salary(12000).build(),
      ];

      for (const employee of employees) {
        await repository.insert(employee);
      }

      const input: ListEmployeesInput = {
        filter: {
          store_id: 'store-1',
          salary_min: 4000,
          salary_max: 10000,
        },
      };

      const output = await useCase.execute(input);

      expect(output.items).toHaveLength(2);
      output.items.forEach((item) => {
        expect(item.salary).toBeGreaterThanOrEqual(4000);
        expect(item.salary).toBeLessThanOrEqual(10000);
      });
    });

    it('should sort employees by name ascending', async () => {
      const employees = [
        new EmployeeFakeBuilder().store_id('store-1').name('Carlos').build(),
        new EmployeeFakeBuilder().store_id('store-1').name('Ana').build(),
        new EmployeeFakeBuilder().store_id('store-1').name('Bruno').build(),
      ];

      for (const employee of employees) {
        await repository.insert(employee);
      }

      const input: ListEmployeesInput = {
        filter: {
          store_id: 'store-1',
        },
        sort: 'name',
        sort_dir: 'asc',
      };

      const output = await useCase.execute(input);

      expect(output.items).toHaveLength(3);
      expect(output.items[0].name).toBe('Ana');
      expect(output.items[1].name).toBe('Bruno');
      expect(output.items[2].name).toBe('Carlos');
    });

    it('should sort employees by name descending', async () => {
      const employees = [
        new EmployeeFakeBuilder().store_id('store-1').name('Carlos').build(),
        new EmployeeFakeBuilder().store_id('store-1').name('Ana').build(),
        new EmployeeFakeBuilder().store_id('store-1').name('Bruno').build(),
      ];

      for (const employee of employees) {
        await repository.insert(employee);
      }

      const input: ListEmployeesInput = {
        filter: {
          store_id: 'store-1',
        },
        sort: 'name',
        sort_dir: 'desc',
      };

      const output = await useCase.execute(input);

      expect(output.items).toHaveLength(3);
      expect(output.items[0].name).toBe('Carlos');
      expect(output.items[1].name).toBe('Bruno');
      expect(output.items[2].name).toBe('Ana');
    });

    it('should apply pagination correctly', async () => {
      const employees = EmployeeFakeBuilder.createMany(25);
      employees.forEach(async (employee) => {
        await repository.insert(employee);
      });

      // Primeira página
      const input1: ListEmployeesInput = {
        page: 1,
        per_page: 10,
      };

      const output1 = await useCase.execute(input1);
      expect(output1.items).toHaveLength(10);
      expect(output1.current_page).toBe(1);
      expect(output1.total).toBe(25);
      expect(output1.last_page).toBe(3);

      // Segunda página
      const input2: ListEmployeesInput = {
        page: 2,
        per_page: 10,
      };

      const output2 = await useCase.execute(input2);
      expect(output2.items).toHaveLength(10);
      expect(output2.current_page).toBe(2);

      // Terceira página
      const input3: ListEmployeesInput = {
        page: 3,
        per_page: 10,
      };

      const output3 = await useCase.execute(input3);
      expect(output3.items).toHaveLength(5);
      expect(output3.current_page).toBe(3);
    });

    it('should combine multiple filters', async () => {
      const employees = [
        new EmployeeFakeBuilder()
          .store_id('store-1')
          .name('João Silva')
          .role(EmployeeRole.CASHIER)
          .department(EmployeeDepartment.SALES)
          .salary(4000)
          .build(),
        new EmployeeFakeBuilder()
          .store_id('store-1')
          .name('Maria Santos')
          .role(EmployeeRole.MANAGER)
          .department(EmployeeDepartment.SALES)
          .salary(8000)
          .build(),
        new EmployeeFakeBuilder()
          .store_id('store-1')
          .name('Pedro Oliveira')
          .role(EmployeeRole.CASHIER)
          .department(EmployeeDepartment.IT)
          .salary(4500)
          .build(),
      ];

      for (const employee of employees) {
        await repository.insert(employee);
      }

      const input: ListEmployeesInput = {
        filter: {
          store_id: 'store-1',
          role: EmployeeRole.CASHIER,
          department: EmployeeDepartment.SALES,
          salary_min: 3000,
          salary_max: 5000,
        },
      };

      const output = await useCase.execute(input);

      expect(output.items).toHaveLength(1);
      expect(output.items[0].name).toBe('João Silva');
      expect(output.items[0].role).toBe(EmployeeRole.CASHIER);
      expect(output.items[0].department).toBe(EmployeeDepartment.SALES);
    });

    it('should return empty result when no employees match filters', async () => {
      const employees = [
        new EmployeeFakeBuilder().store_id('store-1').role(EmployeeRole.CASHIER).build(),
        new EmployeeFakeBuilder().store_id('store-1').role(EmployeeRole.MANAGER).build(),
      ];

      for (const employee of employees) {
        await repository.insert(employee);
      }

      const input: ListEmployeesInput = {
        filter: {
          store_id: 'store-1',
          role: EmployeeRole.ADMIN,
        },
      };

      const output = await useCase.execute(input);

      expect(output.items).toHaveLength(0);
      expect(output.total).toBe(0);
    });
  });
});