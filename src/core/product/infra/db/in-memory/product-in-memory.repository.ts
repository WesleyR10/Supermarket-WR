import { InMemorySearchableRepository } from '../../../../shared/infra/db/in-memory/in-memory.repository';
import { Product, ProductId, UnitType } from '../../../domain/product.aggregate';
import { IProductRepository, ProductFilter, ProductSearchParams, ProductSearchResult } from '../../../domain/repositories/product.repository.interface';

export class ProductInMemoryRepository
  extends InMemorySearchableRepository<
    Product,
    ProductId,
    ProductFilter,
    ProductSearchParams,
    ProductSearchResult
  >
  implements IProductRepository
{
  sortableFields: string[] = ['name', 'price', 'created_at', 'is_active', 'brand', 'unit_type'];

  // Métodos básicos de busca
  async findByCategory(categoryId: string): Promise<Product[]> {
    return this.items.filter(item => item.category_id === categoryId);
  }

  async findByBarcode(barcode: string): Promise<Product | null> {
    const product = this.items.find(item => item.barcode === barcode);
    return product || null;
  }

  async findByBrand(brand: string): Promise<Product[]> {
    return this.items.filter(item => item.brand === brand);
  }

  async findByUnitType(unitType: UnitType): Promise<Product[]> {
    return this.items.filter(item => item.unit_type === unitType);
  }

  async findBySupplierCode(supplierCode: string): Promise<Product[]> {
    return this.items.filter(item => item.supplier_code === supplierCode);
  }

  // Métodos específicos do negócio de supermercado
  async findWeighableProducts(): Promise<Product[]> {
    return this.items.filter(item => item.requires_weighing || item.unit_type === UnitType.KG);
  }

  async findPerishableProducts(): Promise<Product[]> {
    return this.items.filter(item => item.isPerishable());
  }

  async findProductsWithoutNcm(): Promise<Product[]> {
    return this.items.filter(item => !item.ncm_code || item.ncm_code.trim() === '');
  }

  async findInactiveProducts(): Promise<Product[]> {
    return this.items.filter(item => !item.is_active);
  }

  async findByPriceRange(minPrice: number, maxPrice: number): Promise<Product[]> {
    return this.items.filter(item => 
      item.price >= minPrice && item.price <= maxPrice
    );
  }

  // Métodos de análise de margem
  async findLowMarginProducts(minimumMargin: number): Promise<Product[]> {
    return this.items.filter(item => {
      const margin = item.calculateMarginPercentage();
      return margin !== null && margin < minimumMargin;
    });
  }

  async getHighestMarginProducts(limit: number = 10): Promise<Product[]> {
    const productsWithMargin = this.items
      .filter(item => item.calculateMarginPercentage() !== null)
      .sort((a, b) => {
        const marginA = a.calculateMarginPercentage() || 0;
        const marginB = b.calculateMarginPercentage() || 0;
        return marginB - marginA;
      });
    
    return productsWithMargin.slice(0, limit);
  }

  async getLowestMarginProducts(limit: number = 10): Promise<Product[]> {
    const productsWithMargin = this.items
      .filter(item => item.calculateMarginPercentage() !== null)
      .sort((a, b) => {
        const marginA = a.calculateMarginPercentage() || 0;
        const marginB = b.calculateMarginPercentage() || 0;
        return marginA - marginB;
      });
    
    return productsWithMargin.slice(0, limit);
  }

  // Métodos de análise de vendas (simulados)
  async findTopSellingProducts(limit: number = 10): Promise<Product[]> {
    // Implementação simulada - em produção integraria com bounded context de sales
    // Por enquanto, retorna produtos ativos ordenados por nome
    return this.items
      .filter(item => item.is_active)
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
      .slice(0, limit);
  }

  async findLowStockProducts(): Promise<Product[]> {
    // Implementação simulada - em produção integraria com bounded context de inventory
    // Por enquanto, retorna produtos ativos (simulando que têm estoque)
    return this.items.filter(item => item.is_active);
  }

  // Métodos de validação e verificação
  async existsByBarcode(barcode: string, excludeId?: ProductId): Promise<boolean> {
    return this.items.some(item => 
      item.barcode === barcode && 
      (!excludeId || !item.product_id.equals(excludeId))
    );
  }

  async existsByNameInCategory(name: string, categoryId: string, excludeId?: ProductId): Promise<boolean> {
    return this.items.some(item => 
      item.name.toLowerCase() === name.toLowerCase() &&
      item.category_id === categoryId &&
      (!excludeId || !item.product_id.equals(excludeId))
    );
  }

  // Métodos de auditoria e compliance
  async findComplianceIssues(): Promise<Product[]> {
    return this.items.filter(item => {
      // Produtos que precisam de NCM mas não têm (preço > R$ 50)
      const needsNcm = item.requiresNcmCode() && (!item.ncm_code || item.ncm_code.trim() === '');
      
      // Produtos perecíveis sem informações de peso/volume
      const perishableWithoutSpecs = item.isPerishable() && !item.weight && !item.volume;
      
      // Produtos sem custo definido (verificação mais robusta)
      const noCostPrice = !item.cost_price || item.cost_price <= 0;
      
      return needsNcm || perishableWithoutSpecs || noCostPrice;
    });
  }

  async findProductsNeedingPriceReview(): Promise<Product[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return this.items.filter(item => {
      // Produtos sem custo definido
      const noCostPrice = !item.cost_price;
      
      // Produtos com margem muito baixa (< 10%)
      const lowMargin = item.calculateMarginPercentage() !== null && 
                       item.calculateMarginPercentage()! < 10;
      
      // Produtos não atualizados há mais de 30 dias
      const outdated = item.updated_at < thirtyDaysAgo;
      
      return noCostPrice || lowMargin || outdated;
    });
  }

  async findDuplicateProducts(): Promise<Product[]> {
    const duplicates: Product[] = [];
    const seen = new Set<string>();
    
    for (const item of this.items) {
      // Considera duplicata se tem mesmo código de barras ou mesmo nome na mesma categoria
      const barcodeKey = `barcode:${item.barcode}`;
      const nameKey = `name:${item.name.toLowerCase()}:${item.category_id}`;
      
      if (seen.has(barcodeKey) || seen.has(nameKey)) {
        duplicates.push(item);
      } else {
        seen.add(barcodeKey);
        seen.add(nameKey);
      }
    }
    
    return duplicates;
  }

  // Métodos de análise temporal
  async findRecentlyCreated(days: number): Promise<Product[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return this.items.filter(item => item.created_at >= cutoffDate);
  }

  async findRecentlyModified(days: number): Promise<Product[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return this.items.filter(item => 
      item.updated_at >= cutoffDate && 
      item.created_at < cutoffDate // Excluir recém-criados
    );
  }

  // Métodos de estatísticas
  async countByCategory(): Promise<{ category_id: string; count: number; }[]> {
    const categoryCount = new Map<string, number>();
    
    this.items.forEach(item => {
      const current = categoryCount.get(item.category_id) || 0;
      categoryCount.set(item.category_id, current + 1);
    });
    
    return Array.from(categoryCount.entries()).map(([category_id, count]) => ({
      category_id,
      count
    }));
  }

  async countByBrand(): Promise<{ brand: string; count: number; }[]> {
    const brandCount = new Map<string, number>();
    
    this.items.forEach(item => {
      if (item.brand) {
        const current = brandCount.get(item.brand) || 0;
        brandCount.set(item.brand, current + 1);
      }
    });
    
    return Array.from(brandCount.entries()).map(([brand, count]) => ({
      brand,
      count
    }));
  }

  async getTotalInventoryValue(): Promise<number> {
    // Implementação simulada - em produção integraria com inventory
    // Calcula valor baseado no preço de custo dos produtos ativos
    return this.items
      .filter(item => item.is_active && item.cost_price)
      .reduce((total, item) => total + (item.cost_price || 0), 0);
  }

  // Métodos de filtro e ordenação (herdados da classe base)
  protected async applyFilter(
    items: Product[],
    filter: ProductFilter | null,
  ): Promise<Product[]> {
    if (!filter) {
      return items;
    }

    return items.filter((item) => {
      // Filtro por nome (busca parcial, case insensitive)
      if (filter.name && !item.name.toLowerCase().includes(filter.name.toLowerCase())) {
        return false;
      }

      // Filtro por categoria
      if (filter.category_id && item.category_id !== filter.category_id) {
        return false;
      }

      // Filtro por marca
      if (filter.brand && item.brand !== filter.brand) {
        return false;
      }

      // Filtro por tipo de unidade
      if (filter.unit_type && item.unit_type !== filter.unit_type) {
        return false;
      }

      // Filtro por status ativo
      if (filter.is_active !== undefined && item.is_active !== filter.is_active) {
        return false;
      }

      // Filtro por código de barras
      if (filter.barcode && item.barcode !== filter.barcode) {
        return false;
      }

      // Filtro por faixa de preço
      if (filter.price_min !== undefined && item.price < filter.price_min) {
        return false;
      }

      if (filter.price_max !== undefined && item.price > filter.price_max) {
        return false;
      }

      // Filtro por produtos que requerem pesagem
      if (filter.requires_weighing !== undefined && item.requires_weighing !== filter.requires_weighing) {
        return false;
      }

      return true;
    });
  }

  protected applySort(
    items: Product[],
    sort: string | null,
    sort_dir: string | null,
  ): Product[] {
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
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'created_at':
          aValue = a.created_at;
          bValue = b.created_at;
          break;
        case 'is_active':
          aValue = a.is_active ? 1 : 0;
          bValue = b.is_active ? 1 : 0;
          break;
        case 'brand':
          aValue = a.brand ?? '';
          bValue = b.brand ?? '';
          break;
        case 'unit_type':
          aValue = a.unit_type;
          bValue = b.unit_type;
          break;
        default:
          aValue = a[sort as keyof Product];
          bValue = b[sort as keyof Product];
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

  getEntity(): new (...args: any[]) => Product {
    return Product;
  }
}