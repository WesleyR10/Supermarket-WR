import { IUseCase } from '../../../../shared/application/use-case.interface';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { Store, StoreId } from '../../../domain/store.aggregate';
import { IStoreRepository } from '../../../domain/repositories/store.repository.interface';

export type DeleteStoreInput = {
  id: string;
};

export type DeleteStoreOutput = void;

export class DeleteStoreUseCase implements IUseCase<DeleteStoreInput, DeleteStoreOutput> {
  constructor(private readonly storeRepository: IStoreRepository) {}

  async execute(input: DeleteStoreInput): Promise<DeleteStoreOutput> {
    const storeId = new StoreId(input.id);
    const store = await this.storeRepository.findById(storeId);
    
    if (!store) {
      throw new NotFoundError(input.id, Store);
    }

    await this.storeRepository.delete(storeId);
  }
}