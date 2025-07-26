import { ISearchableRepository } from '../../../shared/domain/repository/repository-interface';
import { Category, CategoryId } from '../category.aggregate';
import { SearchParams, SearchParamsConstructorProps } from '../../../shared/domain/repository/search-params';
import { SearchResult } from '../../../shared/domain/repository/search-result';

export type CategoryFilter = {
  name?: string;
};

export class CategorySearchParams extends SearchParams<CategoryFilter> {
  static create(props: SearchParamsConstructorProps<CategoryFilter> = {}): CategorySearchParams {
    return new CategorySearchParams(props);
  }

  get filter(): CategoryFilter | null {
    return this._filter;
  }

  protected set filter(value: CategoryFilter | null) {
    const _value =
      !value || (value as unknown) === '' || typeof value !== 'object'
        ? null
        : value;

    const filter = {
      ...(_value && _value.name && { name: `${_value.name}` }),
    };

    this._filter = Object.keys(filter).length === 0 ? null : filter;
  }
}

export class CategorySearchResult extends SearchResult<Category> {}

export interface ICategoryRepository extends ISearchableRepository<
  Category,
  CategoryId,
  CategoryFilter,
  CategorySearchParams,
  CategorySearchResult
> {
  // Métodos específicos para supermercado
  findActiveCategories(): Promise<Category[]>;
  findRootCategories(): Promise<Category[]>;
  findByParentId(parentId: CategoryId): Promise<Category[]>;
  findPerishableCategories(): Promise<Category[]>;
  findPromotionEligibleCategories(): Promise<Category[]>;
}