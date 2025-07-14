import { ISearchableRepository } from '../../../shared/domain/repository/repository-interface';
import { SearchParams } from '../../../shared/domain/repository/search-params';
import { SearchResult } from '../../../shared/domain/repository/search-result';
import { Product, ProductId, UnitType } from '../product.aggregate';

export type ProductFilter = {
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
  constructor(props: SearchParams<ProductFilter>) {
    super(props);
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
  // Métodos básicos herdados de ISearchableRepository
  // findById, findAll, insert, update, delete, search, etc.

  // Métodos específicos do domínio de supermercado
  
  // Buscar produtos por categoria
  findByCategory(categoryId: string): Promise<Product[]>;
  
  // Buscar produtos por código de barras
  findByBarcode(barcode: string): Promise<Product | null>;
  
  // Buscar produtos por marca
  findByBrand(brand: string): Promise<Product[]>;
  
  // Buscar produtos que requerem pesagem (açougue, frios)
  findWeighableProducts(): Promise<Product[]>;
  
  // Buscar produtos com estoque baixo (integração com inventory)
  findLowStockProducts(): Promise<Product[]>;
  
  // Buscar produtos por faixa de preço
  findByPriceRange(minPrice: number, maxPrice: number): Promise<Product[]>;
  
  // Buscar produtos perecíveis (que expiram)
  findPerishableProducts(): Promise<Product[]>;
  
  // Buscar produtos sem código NCM (para compliance fiscal)
  findProductsWithoutNcm(): Promise<Product[]>;
  
  // Buscar produtos por fornecedor
  findBySupplierCode(supplierCode: string): Promise<Product[]>;
  
  // Buscar produtos inativos
  findInactiveProducts(): Promise<Product[]>;
  
  // Buscar produtos mais vendidos (integração com sales)
  findTopSellingProducts(limit?: number): Promise<Product[]>;
  
  // Buscar produtos com margem baixa
  findLowMarginProducts(minimumMargin: number): Promise<Product[]>;
  
  // Buscar produtos por tipo de unidade
  findByUnitType(unitType: UnitType): Promise<Product[]>;
  
  // Buscar produtos que precisam de análise de preço
  findProductsNeedingPriceReview(): Promise<Product[]>;
  
  // Buscar produtos duplicados (mesmo código de barras)
  findDuplicateProducts(): Promise<Product[]>;
  
  // Relatórios específicos
  
  // Contar produtos por categoria
  countByCategory(): Promise<{ category_id: string; count: number }[]>;
  
  // Contar produtos por marca
  countByBrand(): Promise<{ brand: string; count: number }[]>;
  
  // Valor total do inventário
  getTotalInventoryValue(): Promise<number>;
  
  // Produtos com maior margem
  getHighestMarginProducts(limit?: number): Promise<Product[]>;
  
  // Produtos com menor margem
  getLowestMarginProducts(limit?: number): Promise<Product[]>;
  
  // Validações de negócio
  
  // Verificar se código de barras já existe
  existsByBarcode(barcode: string, excludeId?: ProductId): Promise<boolean>;
  
  // Verificar se nome já existe na categoria
  existsByNameInCategory(name: string, categoryId: string, excludeId?: ProductId): Promise<boolean>;
  
  // Métodos de auditoria
  
  // Produtos modificados recentemente
  findRecentlyModified(days: number): Promise<Product[]>;
  
  // Produtos criados recentemente
  findRecentlyCreated(days: number): Promise<Product[]>;
  
  // Produtos com problemas de compliance
  findComplianceIssues(): Promise<Product[]>;
} 