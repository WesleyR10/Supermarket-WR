import { IUseCase } from '../../../../shared/application/use-case.interface';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';
import { IEmployeeRepository } from '../../../domain/repositories/employee.repository';
import { IPasswordHashingService } from '../../../../shared/domain/services/password-hashing.service';
import { Employee } from '../../../domain/employee.aggregate';
import { EmployeeOutput, EmployeeOutputMapper } from '../common/employee-output';
import { CreateEmployeeInput } from './create-employee.input';

export class CreateEmployeeUseCase implements IUseCase<CreateEmployeeInput, EmployeeOutput> {
  constructor(
    private readonly employeeRepo: IEmployeeRepository,
    private readonly hashingService: IPasswordHashingService,
  ) {}

  async execute(input: CreateEmployeeInput): Promise<EmployeeOutput> {
    // Verificar se email já existe
    const existingEmployeeByEmail = await this.employeeRepo.findByEmail(input.email);
    if (existingEmployeeByEmail) {
      throw new EntityValidationError([{
        email: ['Email already exists']
      }]);
    }

    // Verificar se código de funcionário já existe (se fornecido)
    if (input.employee_code) {
      const existingEmployeeByCode = await this.employeeRepo.findByEmployeeCode(input.employee_code);
      if (existingEmployeeByCode) {
        throw new EntityValidationError([{
          employee_code: ['Employee code already exists']
        }]);
      }
    }

    // Hash da senha
    const hashedPassword = await this.hashingService.hash(input.password);

    // Criar entidade Employee
    const employee = Employee.create({
      ...input,
      password_hash: hashedPassword,
      hired_at: input.hired_at || new Date(),
    });

    if (employee.notification.hasErrors()) {
      throw new EntityValidationError(employee.notification.toJSON());
    }

    await this.employeeRepo.insert(employee);

    return EmployeeOutputMapper.toOutput(employee);
  }
}

export type CreateEmployeeOutput = EmployeeOutput;