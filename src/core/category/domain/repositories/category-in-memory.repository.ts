import { SortDirection } from '../../../shared/domain/repository/search-params';
import { InMemorySearchableRepository } from '../../../shared/infra/db/in-memory/in-memory.repository';
import { Category, CategoryId } from '../category.aggregate';
import { CategoryFilter, ICategoryRepository } from './category.repository.interface';

export class CategoryInMemoryRepository
  extends InMemorySearchableRepository<Category, CategoryId>
  implements ICategoryRepository
{
  // Campos ordenáveis específicos para supermercado
  sortableFields: string[] = [
    'name', 
    'display_order', 
    'created_at', 
    'is_active',
    'tax_rate',
    'default_margin_percentage'
  ];

  protected async applyFilter(
    items: Category[],
    filter: CategoryFilter | null,
  ): Promise<Category[]> {
    if (!filter) {
      return items;
    }

    // Filtro específico para supermercado - busca em múltiplos campos
    return items.filter((category) => {
      const searchTerm = filter.toLowerCase();
      return (
        category.name.toLowerCase().includes(searchTerm) ||
        (category.description && category.description.toLowerCase().includes(searchTerm)) ||
        (category.icon_name && category.icon_name.toLowerCase().includes(searchTerm))
      );
    });
  }

  getEntity(): new (...args: any[]) => Category {
    return Category;
  }

  protected async applySort(
    items: Category[],
    sort: string | null,
    sort_dir: SortDirection | null,
  ): Promise<Category[]> {
    // Ordenação padrão específica para supermercado
    if (!sort) {
      // Primeiro por ordem de exibição (display_order), depois por nome
      const orderedItems = await super.applySort(items, 'display_order', 'asc');
      return orderedItems.sort((a, b) => {
        if (a.display_order === b.display_order) {
          return a.name.localeCompare(b.name);
        }
        return 0;
      });
    }

    // Ordenação personalizada com prioridades específicas do supermercado
    if (sort === 'is_active') {
      // Categorias ativas primeiro, depois inativas
      return [...items].sort((a, b) => {
        if (a.is_active === b.is_active) {
          return a.name.localeCompare(b.name); // Alfabético como critério secundário
        }
        return sort_dir === 'desc' 
          ? (a.is_active ? -1 : 1) 
          : (a.is_active ? 1 : -1);
      });
    }

    if (sort === 'name') {
      // Ordenação alfabética com locale brasileiro
      return [...items].sort((a, b) => {
        const comparison = a.name.localeCompare(b.name, 'pt-BR');
        return sort_dir === 'desc' ? -comparison : comparison;
      });
    }

    // Para outros campos, usa ordenação padrão
    return super.applySort(items, sort, sort_dir);
  }

  // Métodos específicos para supermercado (seguindo padrão do projeto de referência)
  async findActiveCategories(): Promise<Category[]> {
    return this.items.filter(category => category.is_active);
  }

  async findRootCategories(): Promise<Category[]> {
    return this.items.filter(category => category.isRootCategory());
  }

  async findByParentId(parentId: CategoryId): Promise<Category[]> {
    return this.items.filter(category => 
      category.parent_category_id && category.parent_category_id.equals(parentId)
    );
  }

  async findPerishableCategories(): Promise<Category[]> {
    return this.items.filter(category => category.needsExpiryControl());
  }

  async findPromotionEligibleCategories(): Promise<Category[]> {
    return this.items.filter(category => category.isPromotionEligible());
  }
} 