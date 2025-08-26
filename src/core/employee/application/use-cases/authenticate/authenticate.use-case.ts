import { IUseCase } from '../../../../shared/application/use-case.interface';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';
import { IEmployeeRepository } from '../../../domain/repositories/employee.repository';
import { EmployeeOutput, EmployeeOutputMapper } from '../common/employee-output';
import { AuthenticateInput } from './authenticate.input';
import { IPasswordHashingService } from '../../../../shared/domain/services/password-hashing.service';

export class AuthenticateUseCase implements IUseCase<AuthenticateInput, AuthenticateOutput> {
  constructor(
    private readonly employeeRepo: IEmployeeRepository,
    private readonly hashingService: IPasswordHashingService,
  ) {}

  async execute(input: AuthenticateInput): Promise<AuthenticateOutput> {
    const employee = await this.employeeRepo.findByEmail(input.email);

    // Segurança: evitar enumeração de usuários
    if (!employee) {
      throw new EntityValidationError([
        { email: ['Invalid credentials'] },
      ]);
    }

    // Multi-tenant validation
    if (employee.store_id !== input.store_id) {
      throw new EntityValidationError([
        { store_id: ['Employee does not belong to this store'] },
      ]);
    }

    if (!employee.is_active) {
      throw new EntityValidationError([
        { email: ['Employee is inactive'] },
      ]);
    }

    const valid = await this.hashingService.compare(input.password, employee.password_hash);
    if (!valid) {
      throw new EntityValidationError([
        { password: ['Invalid credentials'] },
      ]);
    }

    // Atualiza last_login e persiste
    employee.updateLastLogin();
    await this.employeeRepo.update(employee);

    return EmployeeOutputMapper.toOutput(employee);
  }
}

export type AuthenticateOutput = EmployeeOutput;