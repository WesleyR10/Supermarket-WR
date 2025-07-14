import { SearchInput } from '@core/shared/application/search-input';
import { IUseCase } from '../../../../shared/application/use-case.interface';
import { ICategoryRepository, CategorySearchParams, CategorySearchResult } from '../../../domain/repositories/category.repository.interface';
import { ListCategoriesOutput } from './list-categories.output';

export type ListCategoriesInput = SearchInput<string>; 

export class ListCategoriesUseCase
  implements IUseCase<ListCategoriesInput, ListCategoriesOutput>
{
  constructor(private readonly categoryRepo: ICategoryRepository) {}

  async execute(input: ListCategoriesInput): Promise<ListCategoriesOutput> {
    const searchParams = new CategorySearchParams(input);
    const searchResult = await this.categoryRepo.search(searchParams);
    
    return this.toOutput(searchResult);
  }

  private toOutput(searchResult: CategorySearchResult): ListCategoriesOutput {
    const { items: categories, ...otherProps } = searchResult;
    const categoriesOutput = categories.map(category => ({
      id: category.category_id.id,
      name: category.name,
      description: category.description,
      is_active: category.is_active,
      parent_category_id: category.parent_category_id?.id || null,
      tax_rate: category.tax_rate,
      default_margin_percentage: category.default_margin_percentage,
      requires_expiry_date: category.requires_expiry_date,
      display_order: category.display_order,
      icon_name: category.icon_name,
      created_at: category.created_at,
    }));

    return {
      items: categoriesOutput,
      total: otherProps.total,
      current_page: otherProps.current_page,
      last_page: otherProps.last_page,
      per_page: otherProps.per_page,
    };
  }
} 