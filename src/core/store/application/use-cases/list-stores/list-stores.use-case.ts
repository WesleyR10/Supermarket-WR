import { PaginationOutput, PaginationOutputMapper } from '../../../../shared/application/pagination-output';
import { IUseCase } from '../../../../shared/application/use-case.interface';
import { StoreSearchParams } from '../../../domain/repositories/store.repository.interface';
import { IStoreRepository } from '../../../domain/repositories/store.repository.interface';
import { StoreOutput, StoreOutputMapper } from '../common/store-output';
import { ListStoresInput } from './list-stores.input';

export type ListStoresOutput = PaginationOutput<StoreOutput>;

export class ListStoresUseCase implements IUseCase<ListStoresInput, ListStoresOutput> {
  constructor(private readonly storeRepository: IStoreRepository) {}

  async execute(input: ListStoresInput): Promise<ListStoresOutput> {
    const params = StoreSearchParams.create(input);
    const searchResult = await this.storeRepository.search(params);
    
    return this.toOutput(searchResult);
  }

  private toOutput(searchResult: any): ListStoresOutput {
    const { items: _items } = searchResult;
    const items = _items.map((item) => {
      return StoreOutputMapper.toOutput(item);
    });
    
    return PaginationOutputMapper.toOutput(items, searchResult);
  }
}