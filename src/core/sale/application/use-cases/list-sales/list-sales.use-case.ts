import { PaginationOutput, PaginationOutputMapper } from '../../../../shared/application/pagination-output';
import { IUseCase } from '../../../../shared/application/use-case.interface';
import { ISaleRepository, SaleSearchParams, SaleSearchResult } from '../../../domain/repositories/sale.repository.interface';
import { SaleOutput, SaleOutputMapper } from '../common/sale-output';
import { ListSalesInput } from './list-sales.input';

export class ListSalesUseCase implements IUseCase<ListSalesInput, ListSalesOutput> {
  constructor(private readonly saleRepo: ISaleRepository) {}

  async execute(input: ListSalesInput): Promise<ListSalesOutput> {
    const params = SaleSearchParams.create(input);
    const searchResult = await this.saleRepo.search(params);
    return this.toOutput(searchResult);
  }

  private toOutput(searchResult: SaleSearchResult): ListSalesOutput {
    const { items: _items } = searchResult;
    const items = _items.map((i) => SaleOutputMapper.toOutput(i));
    return PaginationOutputMapper.toOutput(items, searchResult);
  }
}

export type ListSalesOutput = PaginationOutput<SaleOutput>;