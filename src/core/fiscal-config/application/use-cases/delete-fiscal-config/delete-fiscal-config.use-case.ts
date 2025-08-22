import { IUseCase } from '../../../../shared/application/use-case.interface';
import { IFiscalConfigRepository } from '../../../domain/repositories/fiscal-config.repository.interface';
import { FiscalConfigId } from '../../../domain/fiscal-config.aggregate';
import { FiscalConfig } from '../../../domain/fiscal-config.aggregate';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';

export type DeleteFiscalConfigInput = {
  id: string;
  store_id: string;
};

export type DeleteFiscalConfigOutput = {
  id: string;
  deleted: boolean;
};

export class DeleteFiscalConfigUseCase
  implements IUseCase<DeleteFiscalConfigInput, DeleteFiscalConfigOutput>
{
  constructor(private readonly fiscalConfigRepo: IFiscalConfigRepository) {}

  async execute(input: DeleteFiscalConfigInput): Promise<DeleteFiscalConfigOutput> {
    const fiscalConfigId = new FiscalConfigId(input.id);
    
    const fiscalConfig = await this.fiscalConfigRepo.findById(fiscalConfigId);
    if (!fiscalConfig) throw new NotFoundError(input.id, FiscalConfig);

    if (fiscalConfig.store_id !== input.store_id) {
      throw new EntityValidationError([
        {
          store_id: ['Fiscal config does not belong to this store'],
        },
      ]);
    }

    // Validações específicas antes da exclusão
    this.validateDeletion(fiscalConfig);

    if (fiscalConfig.notification.hasErrors()) {
      throw new EntityValidationError(fiscalConfig.notification.toJSON());
    }

    await this.fiscalConfigRepo.delete(fiscalConfigId);
    return { id: input.id, deleted: true };
  }

  private validateDeletion(fiscalConfig: FiscalConfig): void {
    // Verificar se a configuração fiscal está sendo usada ativamente
    if (fiscalConfig.is_active) {
      fiscalConfig.notification.addError(
        'is_active',
        'Cannot delete an active fiscal configuration. Deactivate it first.'
      );
    }

    // Outras validações específicas do domínio fiscal podem ser adicionadas aqui
    // Por exemplo: verificar se há transações dependentes desta configuração
  }
}