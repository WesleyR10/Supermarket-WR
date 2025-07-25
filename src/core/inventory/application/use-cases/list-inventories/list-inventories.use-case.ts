import { IUseCase } from '../../../../shared/application/use-case.interface';
import { PaginationOutput, PaginationOutputMapper } from '../../../../shared/application/pagination-output';
import { IInventoryRepository, InventorySearchParams, InventorySearchResult } from '../../../domain/repositories/inventory.repository.interface';
import { InventoryOutput, InventoryOutputMapper } from '../common/inventory-output';
import { ListInventoriesInput } from './list-inventories.input';

export class ListInventoriesUseCase
  implements IUseCase<ListInventoriesInput, ListInventoriesOutput>
{
  constructor(private readonly inventoryRepo: IInventoryRepository) {}

  async execute(input: ListInventoriesInput): Promise<ListInventoriesOutput> {
    const params = new InventorySearchParams(input);
    const searchResult = await this.inventoryRepo.search(params);
    return this.toOutput(searchResult);
  }

  private toOutput(searchResult: InventorySearchResult): ListInventoriesOutput {
    const { items: _items } = searchResult;
    const items = _items.map((item) => InventoryOutputMapper.toOutput(item));
    return PaginationOutputMapper.toOutput(items, searchResult);
  }
}

export type ListInventoriesOutput = PaginationOutput<InventoryOutput>;