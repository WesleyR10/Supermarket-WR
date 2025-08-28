import { IUseCase } from '../../../../shared/application/use-case.interface';
import { PaginationOutput, PaginationOutputMapper } from '../../../../shared/application/pagination-output';
import { OnlineOrderOutput, OnlineOrderOutputMapper } from '../common/online-order-output';
import { ListOnlineOrdersInput, ValidateListOnlineOrdersInput } from './list-online-orders.input';
import { IOnlineOrderRepository, OnlineOrderSearchParams, OnlineOrderSearchResult } from '../../../domain/repositories/online-order.repository.interface';
import { OrderStatus } from '../../../domain/online-order.aggregate';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';

export type ListOnlineOrdersOutput = PaginationOutput<OnlineOrderOutput>;

export class ListOnlineOrdersUseCase
  implements IUseCase<ListOnlineOrdersInput, ListOnlineOrdersOutput>
{
  constructor(
    private readonly onlineOrderRepo: IOnlineOrderRepository
  ) {}

  async execute(input: ListOnlineOrdersInput): Promise<ListOnlineOrdersOutput> {
    const params = new OnlineOrderSearchParams({
      page: input.page || 1,
      per_page: input.per_page || 15,
      sort: input.sort || 'created_at',
      sort_dir: input.sort_dir || 'desc',
      filter: {
        store_id: input.store_id,
        client_id: input.client_id,
        status: input.status ? input.status as OrderStatus : undefined,
      },
    });

    const searchResult: OnlineOrderSearchResult = await this.onlineOrderRepo.search(params);

    return this.toOutput(searchResult);
  }

  private toOutput(searchResult: OnlineOrderSearchResult): ListOnlineOrdersOutput {
    const { items: _items } = searchResult;
    const items = _items.map(order => OnlineOrderOutputMapper.toOutput(order));
    return PaginationOutputMapper.toOutput(items, searchResult);
  }
}