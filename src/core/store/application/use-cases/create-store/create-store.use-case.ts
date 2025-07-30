import { IUseCase } from '../../../../shared/application/use-case.interface';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';
import { Store } from '../../../domain/store.aggregate';
import { IStoreRepository } from '../../../domain/repositories/store.repository.interface';
import { StoreOutput, StoreOutputMapper } from '../common/store-output';
import { CreateStoreInput } from './create-store.input';

export class CreateStoreUseCase
  implements IUseCase<CreateStoreInput, StoreOutput>
{
  constructor(private readonly storeRepository: IStoreRepository) {}

  async execute(input: CreateStoreInput): Promise<StoreOutput> {
    const entity = Store.create(input);

    if (entity.notification.hasErrors()) {
      throw new EntityValidationError(entity.notification.toJSON());
    }

    await this.storeRepository.insert(entity);

    return StoreOutputMapper.toOutput(entity);
  }
}