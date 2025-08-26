import {
  PaginationOutput,
  PaginationOutputMapper,
} from '../../../../shared/application/pagination-output';
import { IUseCase } from '../../../../shared/application/use-case.interface';
import {
  EmployeeSearchParams,
  EmployeeSearchResult,
  IEmployeeRepository,
  EmployeeFilter,
} from '../../../domain/repositories/employee.repository';
import {
  EmployeeOutput,
  EmployeeOutputMapper,
} from '../common/employee-output';
import { ListEmployeesInput } from './list-employees.input';

export class ListEmployeesUseCase
  implements IUseCase<ListEmployeesInput, ListEmployeesOutput>
{
  constructor(private employeeRepo: IEmployeeRepository) {}

  async execute(input: ListEmployeesInput): Promise<ListEmployeesOutput> {
    const employeeFilter: EmployeeFilter | null = input.filter ? {
      store_id: input.filter.store_id,
      name: input.filter.name,
      email: input.filter.email,
      role: input.filter.role,
      department: input.filter.department,
      is_active: input.filter.is_active,
      employee_code: input.filter.employee_code,
      hired_after: input.filter.hired_after ? new Date(input.filter.hired_after) : undefined,
      hired_before: input.filter.hired_before ? new Date(input.filter.hired_before) : undefined,
      salary_min: input.filter.salary_min,
      salary_max: input.filter.salary_max,
    } : null;

    const params = new EmployeeSearchParams({
      page: input.page,
      per_page: input.per_page,
      sort: input.sort,
      sort_dir: input.sort_dir,
      filter: employeeFilter,
    });
    const searchResult = await this.employeeRepo.search(params);
    return this.toOutput(searchResult);
  }

  private toOutput(searchResult: EmployeeSearchResult): ListEmployeesOutput {
    const { items: _items } = searchResult;
    const items = _items.map((i) => {
      return EmployeeOutputMapper.toOutput(i);
    });
    return PaginationOutputMapper.toOutput(items, searchResult);
  }
}

export type ListEmployeesOutput = PaginationOutput<EmployeeOutput>;