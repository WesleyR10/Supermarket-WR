import { ISearchableRepository } from '../../../shared/domain/repository/repository-interface';
import { Category, CategoryId } from '../category.aggregate';
import { SearchParams } from '../../../shared/domain/repository/search-params';
import { SearchResult } from '../../../shared/domain/repository/search-result';

export type CategoryFilter = string;

export class CategorySearchParams extends SearchParams<CategoryFilter> {}

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