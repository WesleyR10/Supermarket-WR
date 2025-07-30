import { IUseCase } from '../../../../shared/application/use-case.interface';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';
import { Store, StoreId } from '../../../domain/store.aggregate';
import { IStoreRepository } from '../../../domain/repositories/store.repository.interface';
import { StoreOutput, StoreOutputMapper } from '../common/store-output';
import { UpdateStoreInput } from './update-store.input';

export class UpdateStoreUseCase implements IUseCase<UpdateStoreInput, StoreOutput> {
  constructor(private readonly storeRepository: IStoreRepository) {}

  async execute(input: UpdateStoreInput): Promise<StoreOutput> {
    const storeId = new StoreId(input.id);
    const store = await this.storeRepository.findById(storeId);
    
    if (!store) {
      throw new NotFoundError(input.id, Store);
    }

    if (input.name !== undefined) {
      store.changeName(input.name);
    }

    if (input.settings) {
      store.updateSettings(input.settings);
    }

    if (input.subscription) {
      store.updateSubscription(input.subscription);
    }

    if (store.notification.hasErrors()) {
      throw new EntityValidationError(store.notification.toJSON());
    }

    await this.storeRepository.update(store);

    return StoreOutputMapper.toOutput(store);
  }
}