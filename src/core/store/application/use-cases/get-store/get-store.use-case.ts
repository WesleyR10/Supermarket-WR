import { IUseCase } from '../../../../shared/application/use-case.interface';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { Store, StoreId } from '../../../domain/store.aggregate';
import { IStoreRepository } from '../../../domain/repositories/store.repository.interface';
import { StoreOutput, StoreOutputMapper } from '../common/store-output';

export type GetStoreInput = {
  id: string;
};

export class GetStoreUseCase implements IUseCase<GetStoreInput, StoreOutput> {
  constructor(private readonly storeRepository: IStoreRepository) {}

  async execute(input: GetStoreInput): Promise<StoreOutput> {
    const storeId = new StoreId(input.id);
    const store = await this.storeRepository.findById(storeId);
    
    if (!store) {
      throw new NotFoundError(input.id, Store)
    }

    return StoreOutputMapper.toOutput(store);
  }
}