import { IUseCase } from '../../../../shared/application/use-case.interface';
import { ICategoryRepository, CategorySearchParams, CategorySearchResult } from '../../../domain/repositories/category.repository.interface';
import { CategoryOutput, CategoryOutputMapper } from '../common/category-output';
import { PaginationOutput, PaginationOutputMapper } from '@core/shared/application/pagination-output';
import { ListCategoriesInput } from './list-categories.input';

export type ListCategoriesOutput = PaginationOutput<CategoryOutput>;

export class ListCategoriesUseCase
  implements IUseCase<ListCategoriesInput, ListCategoriesOutput>
{
  constructor(private readonly categoryRepo: ICategoryRepository) {}

  async execute(input: ListCategoriesInput): Promise<ListCategoriesOutput> {
    const searchParams = CategorySearchParams.create(input);
    const searchResult = await this.categoryRepo.search(searchParams);
    
    return this.toOutput(searchResult);
  }

  private toOutput(searchResult: CategorySearchResult): ListCategoriesOutput {
    const { items: _items } = searchResult;
    const items = _items.map((i) => {
      return CategoryOutputMapper.toOutput(i);
    });
    return PaginationOutputMapper.toOutput(items, searchResult);
  }
}