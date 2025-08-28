export interface ProductValidationItem {
  product_id: string;
  store_id: string;
}

export interface ProductValidationResult {
  product_id: string;
  is_valid: boolean;
  is_active: boolean;
  exists: boolean;
  name?: string;
  price?: number;
  errors: string[];
}

export interface IProductValidationService {
  /**
   * Valida se os produtos existem e estão ativos
   * @param items Lista de produtos para validar
   * @throws Error se algum produto for inválido
   */
  validateProducts(items: ProductValidationItem[]): Promise<void>;

  /**
   * Verifica disponibilidade dos produtos sem lançar exceção
   * @param items Lista de produtos para validar
   * @returns Lista com resultado da validação de cada produto
   */
  checkProductsAvailability(items: ProductValidationItem[]): Promise<ProductValidationResult[]>;

  /**
   * Obtém informações atualizadas do produto
   * @param product_id ID do produto
   * @param store_id ID da loja
   * @returns Informações do produto ou null se não encontrado
   */
  getProductInfo(product_id: string, store_id: string): Promise<{
    id: string;
    name: string;
    price: number;
    is_active: boolean;
    category_id: string;
  } | null>;
}