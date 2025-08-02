import { ISearchableRepository } from '../../../shared/domain/repository/repository-interface';
import { SearchParams, SearchParamsConstructorProps } from '../../../shared/domain/repository/search-params';
import { SearchResult } from '../../../shared/domain/repository/search-result';
import { Product, ProductId, UnitType } from '../product.aggregate';

// Filtro agora inclui store_id como obrigatório para isolamento multi-tenant
export type ProductFilter = {
  store_id?: string;
  name?: string;
  category_id?: string;
  brand?: string;
  unit_type?: UnitType;
  is_active?: boolean;
  barcode?: string;
  price_min?: number;
  price_max?: number;
  requires_weighing?: boolean;
  has_stock?: boolean;
};

export class ProductSearchParams extends SearchParams<ProductFilter> {
  static create(props: SearchParamsConstructorProps<ProductFilter>): ProductSearchParams {
    // store_id é obrigatório
    if (!props.filter?.store_id) {
      throw new Error('store_id is required for product search');
    }
    return new ProductSearchParams(props);
  }

  get filter(): ProductFilter | null {
    return this._filter;
  }

  protected set filter(value: ProductFilter | null) {
    const _value =
      !value || (value as unknown) === '' || typeof value !== 'object'
        ? null
        : value;

    if (!_value || !_value.store_id) {
      throw new Error('store_id is required for product filter to ensure multi-tenant isolation');
    }

    const filter = {
      store_id: `${_value.store_id}`,
      ...(_value && _value.name && { name: `${_value.name}` }),
      ...(_value && _value.category_id && { category_id: `${_value.category_id}` }),
      ...(_value && _value.brand && { brand: `${_value.brand}` }),
      ...(_value && _value.barcode && { barcode: `${_value.barcode}` }),
      ...(_value && _value.unit_type && { unit_type: _value.unit_type }),
      ...(_value && _value.is_active !== undefined && { is_active: _value.is_active }),
      ...(_value && _value.requires_weighing !== undefined && { requires_weighing: _value.requires_weighing }),
      ...(_value && _value.has_stock !== undefined && { has_stock: _value.has_stock }),
      ...(_value && _value.price_min !== undefined && { price_min: _value.price_min }),
      ...(_value && _value.price_max !== undefined && { price_max: _value.price_max }),
    };

    this._filter = Object.keys(filter).length === 0 ? null : filter;
  }
}

export class ProductSearchResult extends SearchResult<Product> {
  constructor(props: SearchResult<Product>) {
    super(props);
  }
}

export interface IProductRepository extends ISearchableRepository<
  Product,
  ProductId,
  ProductFilter,
  ProductSearchParams,
  ProductSearchResult
> {
  // Métodos específicos para supermercado - todos agora requerem store_id para isolamento
  // Buscar produtos por categoria
  findByCategory(storeId: string, categoryId: string): Promise<Product[]>;
  // Buscar produtos por código de barras
  findByBarcode(storeId: string, barcode: string): Promise<Product | null>;
  // Buscar produtos por marca
  findByBrand(storeId: string, brand: string): Promise<Product[]>;
  // Buscar produtos que requerem pesagem (açougue, frios)
  findWeighableProducts(storeId: string): Promise<Product[]>;
  // Buscar produtos com estoque baixo (integração com inventory)
  findLowStockProducts(storeId: string): Promise<Product[]>;
  // Buscar produtos por faixa de preço
  findByPriceRange(storeId: string, minPrice: number, maxPrice: number): Promise<Product[]>;
  // Buscar produtos perecíveis (que expiram)
  findPerishableProducts(storeId: string): Promise<Product[]>;
  // Buscar produtos sem código NCM (para compliance fiscal)
  findProductsWithoutNcm(storeId: string): Promise<Product[]>;
  // Buscar produtos por fornecedor
  findBySupplierCode(storeId: string, supplierCode: string): Promise<Product[]>;
  // Buscar produtos inativos
  findInactiveProducts(storeId: string): Promise<Product[]>;
  // Buscar produtos mais vendidos (integração com sales)
  findTopSellingProducts(storeId: string, limit?: number): Promise<Product[]>;
  // Buscar produtos com margem baixa
  findLowMarginProducts(storeId: string, minimumMargin: number): Promise<Product[]>;
  // Buscar produtos por tipo de unidade
  findByUnitType(storeId: string, unitType: UnitType): Promise<Product[]>;
  // Buscar produtos que precisam de análise de preço
  findProductsNeedingPriceReview(storeId: string): Promise<Product[]>;
  // Buscar produtos duplicados (mesmo código de barras)
  findDuplicateProducts(storeId: string): Promise<Product[]>;
  
  // Relatórios específicos
  // Contar produtos por categoria
  countByCategory(storeId: string): Promise<{ category_id: string; count: number }[]>;
  // Contar produtos por marca
  countByBrand(storeId: string): Promise<{ brand: string; count: number }[]>;
  // Valor total do inventário
  getTotalInventoryValue(storeId: string): Promise<number>;
  // Produtos com maior margem
  getHighestMarginProducts(storeId: string, limit?: number): Promise<Product[]>;
  // Produtos com menor margem
  getLowestMarginProducts(storeId: string, limit?: number): Promise<Product[]>;
  
  // Validações de negócio
  // Verificar se código de barras já existe
  existsByBarcode(storeId: string, barcode: string, excludeId?: ProductId): Promise<boolean>;
  // Verificar se nome já existe na categoria
  existsByNameInCategory(storeId: string, name: string, categoryId: string, excludeId?: ProductId): Promise<boolean>;
  
  // Métodos de auditoria
  // Produtos modificados recentemente
  findRecentlyModified(storeId: string, days: number): Promise<Product[]>;
  // Produtos criados recentemente
  findRecentlyCreated(storeId: string, days: number): Promise<Product[]>;
  // Produtos com problemas de compliance
  findComplianceIssues(storeId: string): Promise<Product[]>;
  // Buscar produtos por store_id
  findByStoreId(storeId: string): Promise<Product[]>; 
  // Contar produtos por store_id
  countByStoreId(storeId: string): Promise<number>;
}