import { ISearchableRepository } from '../../../shared/domain/repository/repository-interface';
import { Category, CategoryId } from '../category.aggregate';
import { SearchParams, SearchParamsConstructorProps } from '../../../shared/domain/repository/search-params';
import { SearchResult } from '../../../shared/domain/repository/search-result';

// Filtro agora inclui store_id como obrigatório para isolamento multi-tenant
export type CategoryFilter = {
  store_id?: string;
  name?: string;
};

export class CategorySearchParams extends SearchParams<CategoryFilter> {
  static create(props: SearchParamsConstructorProps<CategoryFilter>): CategorySearchParams {
    // store_id é obrigatório
    if (!props.filter?.store_id) {
      throw new Error('store_id is required for category search to ensure multi-tenant isolation');
    }
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

    if (!_value || !_value.store_id) {
      throw new Error('store_id is required for category filter to ensure multi-tenant isolation');
    }

    const filter = {
      store_id: `${_value.store_id}`,
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
  // Métodos específicos para supermercado - todos agora requerem store_id para isolamento
  findActiveCategories(storeId: string): Promise<Category[]>;
  findRootCategories(storeId: string): Promise<Category[]>;
  findByParentId(storeId: string, parentId: CategoryId): Promise<Category[]>;
  findPerishableCategories(storeId: string): Promise<Category[]>;
  findPromotionEligibleCategories(storeId: string): Promise<Category[]>;
  
  // Métodos adicionais para multi-tenancy
  findByStoreId(storeId: string): Promise<Category[]>;
  countByStoreId(storeId: string): Promise<number>;
}