import { InMemorySearchableRepository } from '../../../../shared/infra/db/in-memory/in-memory.repository';
import { Category, CategoryId } from '../../../domain/category.aggregate';
import { ICategoryRepository, CategorySearchParams, CategorySearchResult } from '../../../domain/repositories/category.repository.interface';

export class CategoryInMemoryRepository
  extends InMemorySearchableRepository<
    Category,
    CategoryId,
    string,
    CategorySearchParams,
    CategorySearchResult
  >
  implements ICategoryRepository
{
  sortableFields: string[] = ['name', 'display_order', 'created_at', 'is_active', 'tax_rate', 'default_margin_percentage'];

  async findActiveCategories(): Promise<Category[]> {
    return this.items.filter(item => item.is_active);
  }

  async findRootCategories(): Promise<Category[]> {
    return this.items.filter(item => item.parent_category_id === null);
  }

  async findByParentId(parentId: CategoryId): Promise<Category[]> {
    return this.items.filter(item => 
      item.parent_category_id && item.parent_category_id.equals(parentId)
    );
  }

  async findPerishableCategories(): Promise<Category[]> {
    return this.items.filter(item => item.requires_expiry_date);
  }

  async findPromotionEligibleCategories(): Promise<Category[]> {
    return this.items.filter(item => item.isPromotionEligible());
  }

  protected async applyFilter(
    items: Category[],
    filter: string | null,
  ): Promise<Category[]> {
    if (!filter) {
      return items;
    }

    return items.filter((item) => {
      const searchTerm = filter.toLowerCase();
      return (
        item.name.toLowerCase().includes(searchTerm) ||
        (item.description && item.description.toLowerCase().includes(searchTerm)) ||
        (item.icon_name && item.icon_name.toLowerCase().includes(searchTerm))
      );
    });
  }

  protected applySort(
    items: Category[],
    sort: string | null,
    sort_dir: string | null,
  ): Category[] {
    if (!sort || !this.sortableFields.includes(sort)) {
      return items;
    }

    const sortedItems = [...items];
    return sortedItems.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sort) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'display_order':
          aValue = a.display_order;
          bValue = b.display_order;
          break;
        case 'created_at':
          aValue = a.created_at;
          bValue = b.created_at;
          break;
        case 'is_active':
          aValue = a.is_active ? 1 : 0;
          bValue = b.is_active ? 1 : 0;
          break;
        case 'tax_rate':
          aValue = a.tax_rate ?? 0;
          bValue = b.tax_rate ?? 0;
          break;
        case 'default_margin_percentage':
          aValue = a.default_margin_percentage ?? 0;
          bValue = b.default_margin_percentage ?? 0;
          break;
        default:
          aValue = a[sort as keyof Category];
          bValue = b[sort as keyof Category];
      }

      if (aValue < bValue) {
        return sort_dir === 'desc' ? 1 : -1;
      }

      if (aValue > bValue) {
        return sort_dir === 'desc' ? -1 : 1;
      }

      // Critério secundário: sempre ordenar por nome alfabeticamente
      if (sort !== 'name') {
        const nameComparison = a.name.localeCompare(b.name, 'pt-BR');
        if (nameComparison !== 0) {
          return nameComparison;
        }
      }

      return 0;
    });
  }

  getEntity(): new (...args: any[]) => Category {
    return Category;
  }
} 