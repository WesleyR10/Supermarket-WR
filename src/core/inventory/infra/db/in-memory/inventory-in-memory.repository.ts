import { InMemorySearchableRepository } from '../../../../shared/infra/db/in-memory/in-memory.repository';
import { Inventory, InventoryId } from '../../../domain/inventory.aggregate';
import { IInventoryRepository, InventoryFilter, InventorySearchParams, InventorySearchResult } from '../../../domain/repositories/inventory.repository.interface';

export class InventoryInMemoryRepository
  extends InMemorySearchableRepository<
    Inventory,
    InventoryId,
    InventoryFilter,
    InventorySearchParams,
    InventorySearchResult
  >
  implements IInventoryRepository
{
  sortableFields: string[] = ['quantity', 'min_stock', 'max_stock', 'cost_price', 'unit_price', 'last_movement_date', 'created_at', 'expiry_date'];

  // Métodos básicos de busca - todos com store_id para isolamento
  async findByProduct(storeId: string, productId: string): Promise<Inventory[]> {
    return this.items.filter(item => item.store_id === storeId && item.product_id === productId);
  }

  async findByLocation(storeId: string, location: string): Promise<Inventory[]> {
    return this.items.filter(item => item.store_id === storeId && item.location_code === location);
  }

  async findBySupplier(storeId: string, supplierId: string): Promise<Inventory[]> {
    return this.items.filter(item => item.store_id === storeId && item.supplier_id === supplierId);
  }

  async findByBatchNumber(storeId: string, batchNumber: string): Promise<Inventory[]> {
    return this.items.filter(item => item.store_id === storeId && item.batch_number === batchNumber);
  }

  // Métodos específicos do negócio de inventário
  async findLowStockItems(storeId: string): Promise<Inventory[]> {
    return this.items.filter(item => item.store_id === storeId && item.isLowStock());
  }

  async findOutOfStockItems(storeId: string): Promise<Inventory[]> {
    return this.items.filter(item => item.store_id === storeId && item.isOutOfStock());
  }

  async findExpiredItems(storeId: string): Promise<Inventory[]> {
    return this.items.filter(item => item.store_id === storeId && item.isExpired());
  }

  async findNearExpiryItems(storeId: string, days: number = 7): Promise<Inventory[]> {
    return this.items.filter(item => {
      if (item.store_id !== storeId) return false;
      const daysUntilExpiry = item.getDaysUntilExpiry();
      return daysUntilExpiry !== null && daysUntilExpiry <= days && daysUntilExpiry > 0;
    });
  }

  async findItemsNeedingRestock(storeId: string): Promise<Inventory[]> {
    return this.items.filter(item => item.store_id === storeId && item.needsRestock());
  }

  async findPerishableItems(storeId: string): Promise<Inventory[]> {
    return this.items.filter(item => item.store_id === storeId && item.isPerishable());
  }

  async findByQuantityRange(storeId: string, minQuantity: number, maxQuantity: number): Promise<Inventory[]> {
    return this.items.filter(item => 
      item.store_id === storeId && 
      item.quantity.value >= minQuantity && 
      item.quantity.value <= maxQuantity
    );
  }

  async findRecentlyMoved(storeId: string, days: number): Promise<Inventory[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return this.items.filter(item => 
      item.store_id === storeId && 
      item.last_movement_date >= cutoffDate
    );
  }

  async findSlowMovingItems(storeId: string, days: number): Promise<Inventory[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return this.items.filter(item => 
      item.store_id === storeId && 
      item.last_movement_date < cutoffDate
    );
  }

  // Métodos de verificação de existência
  async existsByProduct(storeId: string, productId: string): Promise<boolean> {
    return this.items.some(item => item.store_id === storeId && item.product_id === productId);
  }

  async existsByBatch(storeId: string, batchNumber: string, excludeId?: InventoryId): Promise<boolean> {
    return this.items.some(item => 
      item.store_id === storeId && 
      item.batch_number === batchNumber && 
      (!excludeId || !item.inventory_item_id.equals(excludeId))
    );
  }

  // Métodos de contagem e estatísticas
  async countByLocation(storeId: string): Promise<{ location: string; count: number }[]> {
    const locationCounts = new Map<string, number>();
    
    this.items
      .filter(item => item.store_id === storeId && item.location_code)
      .forEach(item => {
        const location = item.location_code!;
        locationCounts.set(location, (locationCounts.get(location) || 0) + 1);
      });
    
    return Array.from(locationCounts.entries()).map(([location, count]) => ({ location, count }));
  }

  async countBySupplier(storeId: string): Promise<{ supplier_id: string; count: number }[]> {
    const supplierCounts = new Map<string, number>();
    
    this.items
      .filter(item => item.store_id === storeId && item.supplier_id)
      .forEach(item => {
        const supplierId = item.supplier_id!;
        supplierCounts.set(supplierId, (supplierCounts.get(supplierId) || 0) + 1);
      });
    
    return Array.from(supplierCounts.entries()).map(([supplier_id, count]) => ({ supplier_id, count }));
  }

  async getTotalInventoryValue(storeId: string): Promise<number> {
    return this.items
      .filter(item => item.store_id === storeId)
      .reduce((total, item) => {
        const value = item.calculateTotalValue();
        return total + (isNaN(value) ? 0 : value);
      }, 0);
  }

  async getInventoryValueByLocation(storeId: string): Promise<{ location: string; value: number }[]> {
    const locationValues = new Map<string, number>();
    
    this.items
      .filter(item => item.store_id === storeId && item.location_code)
      .forEach(item => {
        const location = item.location_code!;
        const value = item.calculateTotalValue();
        locationValues.set(location, (locationValues.get(location) || 0) + (isNaN(value) ? 0 : value));
      });
    
    return Array.from(locationValues.entries()).map(([location, value]) => ({ location, value }));
  }

  async findRecentlyCreated(storeId: string, days: number): Promise<Inventory[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return this.items.filter(item => 
      item.store_id === storeId && 
      item.created_at >= cutoffDate
    );
  }

  async findRecentlyModified(storeId: string, days: number): Promise<Inventory[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return this.items.filter(item => 
      item.store_id === storeId && 
      item.updated_at >= cutoffDate
    );
  }

  async findByStoreId(storeId: string): Promise<Inventory[]> {
    return this.items.filter(item => item.store_id === storeId);
  }

  async countByStoreId(storeId: string): Promise<number> {
    return this.items.filter(item => item.store_id === storeId).length;
  }

  async findComplianceIssues(storeId: string): Promise<Inventory[]> {
    return this.items.filter(item => {
      if (item.store_id !== storeId) return false;
      
      // Verifica problemas de compliance
      const hasExpiredItems = item.isExpired();
      const hasNegativeStock = item.quantity.value < 0;
      const hasMissingBatch = item.isPerishable() && !item.batch_number;
      const hasMissingExpiry = item.isPerishable() && !item.expiry_date;
      const hasInvalidCostPrice = item.cost_price !== null && item.cost_price.value <= 0;
      
      return hasExpiredItems || hasNegativeStock || hasMissingBatch || hasMissingExpiry || hasInvalidCostPrice;
    });
  }

  async findItemsNeedingPriceReview(storeId: string): Promise<Inventory[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return this.items.filter(item => {
      if (item.store_id !== storeId) return false;
      
      // Itens que precisam de revisão de preço
      const hasOldCostPrice = item.cost_price !== null && item.updated_at < thirtyDaysAgo;
      const hasZeroCostPrice = item.cost_price === null || item.cost_price.value === 0;
      const isNearExpiry = item.isNearExpiry();
      
      return hasOldCostPrice || hasZeroCostPrice || isNearExpiry;
    });
  }

  // Implementação do filtro específico
  protected async applyFilter(
    items: Inventory[],
    filter: InventoryFilter | null,
  ): Promise<Inventory[]> {
    if (!filter) {
      return items;
    }

    return items.filter((item) => {
      // store_id é obrigatório e já validado na interface
      if (filter.store_id && item.store_id !== filter.store_id) {
        return false;
      }

      if (filter.product_id && item.product_id !== filter.product_id) {
        return false;
      }

      if (filter.location && item.location_code !== filter.location) {
        return false;
      }

      if (filter.supplier_id && item.supplier_id !== filter.supplier_id) {
        return false;
      }

      if (filter.batch_number && item.batch_number !== filter.batch_number) {
        return false;
      }

      // Adicionar filtro is_active
      if (filter.is_active !== undefined && item.is_active !== filter.is_active) {
        return false;
      }

      if (filter.low_stock !== undefined && filter.low_stock !== item.isLowStock()) {
        return false;
      }

      if (filter.out_of_stock !== undefined && filter.out_of_stock !== item.isOutOfStock()) {
        return false;
      }

      if (filter.expired !== undefined && filter.expired !== item.isExpired()) {
        return false;
      }

      if (filter.near_expiry !== undefined && filter.near_expiry !== item.isNearExpiry()) {
        return false;
      }

      if (filter.min_quantity !== undefined && item.quantity.value < filter.min_quantity) {
        return false;
      }

      if (filter.max_quantity !== undefined && item.quantity.value > filter.max_quantity) {
        return false;
      }

      // Adicionar filtros unit_price_min e unit_price_max
      if (filter.unit_price_min !== undefined) {
        const unitPrice = item.unit_price ? item.unit_price.value : 0;
        if (unitPrice < filter.unit_price_min) {
          return false;
        }
      }

      if (filter.unit_price_max !== undefined) {
        const unitPrice = item.unit_price ? item.unit_price.value : 0;
        if (unitPrice > filter.unit_price_max) {
          return false;
        }
      }

      return true;
    });
  }

  protected applySort(
    items: Inventory[],
    sort: string | null,
    sort_dir: 'asc' | 'desc' | null,
  ): Inventory[] {
    if (!sort || !this.sortableFields.includes(sort)) {
      // Ordenação padrão por created_at desc
      return [...items].sort((a, b) => {
        const direction = -1; // desc
        if (a.created_at < b.created_at) return -1 * direction;
        if (a.created_at > b.created_at) return 1 * direction;
        return 0;
      });
    }
  
    return [...items].sort((a, b) => {
      let aValue: any = null;
      let bValue: any = null;
  
      if (sort === 'quantity') {
        aValue = a.quantity.value;
        bValue = b.quantity.value;
      } else if (sort === 'min_stock') {
        aValue = a.min_stock.value;
        bValue = b.min_stock.value;
      } else if (sort === 'max_stock') {
        aValue = a.max_stock.value;
        bValue = b.max_stock.value;
      } else if (sort === 'expiry_date') {
        aValue = a.expiry_date ? a.expiry_date.value.getTime() : null;
        bValue = b.expiry_date ? b.expiry_date.value.getTime() : null;
      } else if (sort === 'cost_price') {
        aValue = a.cost_price ? a.cost_price.value : null;
        bValue = b.cost_price ? b.cost_price.value : null;
      } else if (sort === 'unit_price') {
        aValue = a.unit_price ? a.unit_price.value : null;
        bValue = b.unit_price ? b.unit_price.value : null;
      } else {
        // Para campos que não são Value Objects
        aValue = a[sort as keyof Inventory];
        bValue = b[sort as keyof Inventory];
      }
  
      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return 1; // Nulls last
      if (bValue === null) return -1; // Nulls last
  
      const direction = sort_dir === 'asc' ? 1 : -1;
      if (aValue < bValue) return -1 * direction;
      if (aValue > bValue) return 1 * direction;
      return 0;
    });
  }

  getEntity(): new (...args: any[]) => Inventory {
    return Inventory;
  }
}