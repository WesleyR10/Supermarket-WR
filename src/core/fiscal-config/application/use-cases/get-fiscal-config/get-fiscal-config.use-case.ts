import { IUseCase } from '../../../../shared/application/use-case.interface';
import { IFiscalConfigRepository } from '../../../domain/repositories/fiscal-config.repository.interface';
import { FiscalConfigId } from '../../../domain/fiscal-config.aggregate';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { FiscalConfig } from '../../../domain/fiscal-config.aggregate';
import { FiscalConfigOutput, FiscalConfigOutputMapper } from '../common/fiscal-config-output';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';

export type GetFiscalConfigInput = {
  id: string;
  store_id: string;
};

export class GetFiscalConfigUseCase
  implements IUseCase<GetFiscalConfigInput, FiscalConfigOutput>
{
  constructor(private readonly fiscalConfigRepo: IFiscalConfigRepository) {}

  async execute(input: GetFiscalConfigInput): Promise<FiscalConfigOutput> {
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
    
    return FiscalConfigOutputMapper.toOutput(fiscalConfig);
  }
}