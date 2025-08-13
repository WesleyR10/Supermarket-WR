import { ISearchableRepository } from '../../../shared/domain/repository/repository-interface';
import { SearchParams, SearchParamsConstructorProps } from '../../../shared/domain/repository/search-params';
import { SearchResult } from '../../../shared/domain/repository/search-result';
import { Inventory, InventoryId } from '../inventory.aggregate';

export type InventoryFilter = {
  store_id?: string;
  product_id?: string;
  location?: string;
  supplier_id?: string;
  batch_number?: string;
  is_active?: boolean;
  low_stock?: boolean;
  out_of_stock?: boolean;
  expired?: boolean;
  near_expiry?: boolean;
  min_quantity?: number;
  max_quantity?: number;
  unit_price_min?: number;
  unit_price_max?: number;
};

export class InventorySearchParams extends SearchParams<InventoryFilter> {
  static create(props: SearchParamsConstructorProps<InventoryFilter>): InventorySearchParams {
    // store_id é obrigatório
    if (!props.filter?.store_id) {
      throw new Error('store_id is required for inventory search to ensure multi-tenant isolation');
    }
    return new InventorySearchParams(props);
  }

  get filter(): InventoryFilter | null {
    return this._filter;
  }

  protected set filter(value: InventoryFilter | null) {
    const _value =
      !value || (value as unknown) === '' || typeof value !== 'object'
        ? null
        : value;

    if (!_value || !_value.store_id) {
      throw new Error('store_id is required for inventory filter to ensure multi-tenant isolation');
    }

    const filter = {
      store_id: `${_value.store_id}`,
      ...(_value && _value.product_id && { product_id: `${_value.product_id}` }),
      ...(_value && _value.location && { location: `${_value.location}` }),
      ...(_value && _value.supplier_id && { supplier_id: `${_value.supplier_id}` }),
      ...(_value && _value.batch_number && { batch_number: `${_value.batch_number}` }),
      ...(_value && _value.is_active !== undefined && { is_active: _value.is_active }),
      ...(_value && _value.low_stock !== undefined && { low_stock: _value.low_stock }),
      ...(_value && _value.out_of_stock !== undefined && { out_of_stock: _value.out_of_stock }),
      ...(_value && _value.expired !== undefined && { expired: _value.expired }),
      ...(_value && _value.near_expiry !== undefined && { near_expiry: _value.near_expiry }),
      ...(_value && _value.min_quantity !== undefined && { min_quantity: _value.min_quantity }),
      ...(_value && _value.max_quantity !== undefined && { max_quantity: _value.max_quantity }),
      ...(_value && _value.unit_price_min !== undefined && { unit_price_min: _value.unit_price_min }),
      ...(_value && _value.unit_price_max !== undefined && { unit_price_max: _value.unit_price_max }),
    };

    this._filter = Object.keys(filter).length === 0 ? null : filter;
  }
}

export class InventorySearchResult extends SearchResult<Inventory> {
  constructor(props: SearchResult<Inventory>) {
    super(props);
  }
}

export interface IInventoryRepository extends ISearchableRepository<
  Inventory,
  InventoryId,
  InventoryFilter,
  InventorySearchParams,
  InventorySearchResult
> {
  // Métodos específicos para inventário - todos agora requerem store_id para isolamento
  
  // Buscar inventário por produto
  findByProduct(storeId: string, productId: string): Promise<Inventory[]>;
  
  // Buscar inventário por localização
  findByLocation(storeId: string, location: string): Promise<Inventory[]>;
  
  // Buscar inventário por fornecedor
  findBySupplier(storeId: string, supplierId: string): Promise<Inventory[]>;
  
  // Buscar inventário por lote
  findByBatchNumber(storeId: string, batchNumber: string): Promise<Inventory[]>;
  
  // Buscar produtos com estoque baixo
  findLowStockItems(storeId: string): Promise<Inventory[]>;
  
  // Buscar produtos sem estoque
  findOutOfStockItems(storeId: string): Promise<Inventory[]>;
  
  // Buscar produtos vencidos
  findExpiredItems(storeId: string): Promise<Inventory[]>;
  
  // Buscar produtos próximos ao vencimento
  findNearExpiryItems(storeId: string, days?: number): Promise<Inventory[]>;
  
  // Buscar produtos que precisam de reposição
  findItemsNeedingRestock(storeId: string): Promise<Inventory[]>;
  
  // Buscar produtos perecíveis
  findPerishableItems(storeId: string): Promise<Inventory[]>;
  
  // Buscar por faixa de quantidade
  findByQuantityRange(storeId: string, minQuantity: number, maxQuantity: number): Promise<Inventory[]>;
  
  // Buscar produtos com movimento recente
  findRecentlyMoved(storeId: string, days: number): Promise<Inventory[]>;
  
  // Buscar produtos sem movimento
  findSlowMovingItems(storeId: string, days: number): Promise<Inventory[]>;
  
  // Verificar se produto existe no inventário
  existsByProduct(storeId: string, productId: string): Promise<boolean>;
  
  // Verificar se lote existe
  existsByBatch(storeId: string, batchNumber: string, excludeId?: InventoryId): Promise<boolean>;
  
  // Contar itens por localização
  countByLocation(storeId: string): Promise<{ location: string; count: number }[]>;
  
  // Contar itens por fornecedor
  countBySupplier(storeId: string): Promise<{ supplier_id: string; count: number }[]>;
  
  // Calcular valor total do inventário
  getTotalInventoryValue(storeId: string): Promise<number>;
  
  // Calcular valor por localização
  getInventoryValueByLocation(storeId: string): Promise<{ location: string; value: number }[]>;
  
  // Buscar itens criados recentemente
  findRecentlyCreated(storeId: string, days: number): Promise<Inventory[]>;
  
  // Buscar itens modificados recentemente
  findRecentlyModified(storeId: string, days: number): Promise<Inventory[]>;
  
  // Buscar todos os itens de uma loja
  findByStoreId(storeId: string): Promise<Inventory[]>;
  
  // Contar itens por loja
  countByStoreId(storeId: string): Promise<number>;
  
  // Buscar problemas de compliance no inventário
  findComplianceIssues(storeId: string): Promise<Inventory[]>;
  
  // Buscar itens que precisam de revisão de preço
  findItemsNeedingPriceReview(storeId: string): Promise<Inventory[]>;
}