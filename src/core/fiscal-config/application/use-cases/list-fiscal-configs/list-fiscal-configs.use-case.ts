import { IUseCase } from '../../../../shared/application/use-case.interface';
import { IFiscalConfigRepository, FiscalConfigSearchParams, FiscalConfigSearchResult } from '../../../domain/repositories/fiscal-config.repository.interface';
import { FiscalConfigOutput, FiscalConfigOutputMapper } from '../common/fiscal-config-output';
import { PaginationOutput, PaginationOutputMapper } from '@core/shared/application/pagination-output';
import { ListFiscalConfigsInput } from './list-fiscal-configs.input';

export type ListFiscalConfigsOutput = PaginationOutput<FiscalConfigOutput>;

export class ListFiscalConfigsUseCase
  implements IUseCase<ListFiscalConfigsInput, ListFiscalConfigsOutput>
{
  constructor(private readonly fiscalConfigRepo: IFiscalConfigRepository) {}

  async execute(input: ListFiscalConfigsInput): Promise<ListFiscalConfigsOutput> {
    const searchParams = FiscalConfigSearchParams.create(input);
    const searchResult = await this.fiscalConfigRepo.search(searchParams);
    
    return this.toOutput(searchResult);
  }

  private toOutput(searchResult: FiscalConfigSearchResult): ListFiscalConfigsOutput {
    const { items: _items } = searchResult;
    const items = _items.map((i) => {
      return FiscalConfigOutputMapper.toOutput(i);
    });
    return PaginationOutputMapper.toOutput(items, searchResult);
  }
}