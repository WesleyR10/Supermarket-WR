import { IUseCase } from '../../../../shared/application/use-case.interface';
import {
  PaginationOutput,
  PaginationOutputMapper,
} from '../../../../shared/application/pagination-output';
import {
  IClientRepository,
  ClientSearchParams,
  ClientSearchResult,
} from '../../../domain/repositories/client.repository.interface';
import { ClientOutput, ClientOutputMapper } from '../common/client-output';
import { ListClientsInput } from './list-clients.input';

export class ListClientsUseCase
  implements IUseCase<ListClientsInput, ListClientsOutput>
{
  constructor(private readonly clientRepo: IClientRepository) {}

  async execute(input: ListClientsInput): Promise<ListClientsOutput> {
    const params = ClientSearchParams.create({
      page: input.page,
      per_page: input.per_page,
      sort: input.sort,
      sort_dir: input.sort_dir,
      filter: input.filter ? {
        store_id: input.filter.store_id,
        filter: input.filter.filter,
        customer_type: input.filter.customer_type,
        loyalty_level: input.filter.loyalty_level,
        is_active: input.filter.is_active,
      } : null
    });
    const searchResult = await this.clientRepo.search(params);
    return this.toOutput(searchResult);
  }

  private toOutput(searchResult: ClientSearchResult): ListClientsOutput {
    const { items: _items } = searchResult;
    const items = _items.map((i) => {
      return ClientOutputMapper.toOutput(i);
    });
    return PaginationOutputMapper.toOutput(items, searchResult);
  }
}

export type ListClientsOutput = PaginationOutput<ClientOutput>;