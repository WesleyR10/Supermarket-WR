import { IUseCase } from '../../../../shared/application/use-case.interface';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';
import { FiscalConfig } from '../../../domain/fiscal-config.aggregate';
import { IFiscalConfigRepository } from '../../../domain/repositories/fiscal-config.repository.interface';
import { FiscalConfigOutput, FiscalConfigOutputMapper } from '../common/fiscal-config-output';
import { CreateFiscalConfigInput } from './create-fiscal-config.input';

export class CreateFiscalConfigUseCase
  implements IUseCase<CreateFiscalConfigInput, CreateFiscalConfigOutput>
{
  constructor(private readonly fiscalConfigRepo: IFiscalConfigRepository) {}

  async execute(input: CreateFiscalConfigInput): Promise<CreateFiscalConfigOutput> {
    // Verificar se já existe configuração com o mesmo nome para a loja
    const existingConfig = await this.fiscalConfigRepo.findByStoreAndName(
      input.store_id,
      input.config_name
    );

    // Criação da entidade (Domain responsibility)
    const entity = FiscalConfig.create(input);

    // Adicionar erro de duplicação ao notification se existir
    if (existingConfig) {
      entity.notification.addError(
        `Já existe uma configuração fiscal com o nome "${input.config_name}" para esta loja`,
        'config_name'
      );
    }

    // Verificação de erros de validação (incluindo duplicação)
    if (entity.notification.hasErrors()) {
      throw new EntityValidationError(entity.notification.toJSON());
    }

    // Persistência
    await this.fiscalConfigRepo.insert(entity);

    return FiscalConfigOutputMapper.toOutput(entity);
  }
}

export type CreateFiscalConfigOutput = FiscalConfigOutput;