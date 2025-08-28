import { 
  IProductValidationService, 
  ProductValidationItem, 
  ProductValidationResult 
} from '../../domain/product-validation.service.interface';

interface ProductInfo {
  product_id: string;
  name: string;
  unit_price: number;
  is_active: boolean;
  category_id: string;
  barcode: string;
}

export class MockProductValidationService implements IProductValidationService {
  private productsData: Map<string, ProductInfo> = new Map();

  constructor() {
    // Dados de produtos mock para testes
    this.setProductData('product-1', {
      product_id: 'product-1',
      name: 'Produto Teste 1',
      unit_price: 10.50,
      is_active: true,
      category_id: 'category-1',
      barcode: '1234567890123'
    });

    this.setProductData('product-2', {
      product_id: 'product-2',
      name: 'Produto Teste 2',
      unit_price: 25.99,
      is_active: true,
      category_id: 'category-2',
      barcode: '1234567890124'
    });

    this.setProductData('product-3', {
      product_id: 'product-3',
      name: 'Produto Inativo',
      unit_price: 15.00,
      is_active: false,
      category_id: 'category-1',
      barcode: '1234567890125'
    });
  }

  setProductData(productId: string, productInfo: ProductInfo): void {
    this.productsData.set(productId, productInfo);
  }

  removeProductData(productId: string): void {
    this.productsData.delete(productId);
  }

  async validateProducts(items: ProductValidationItem[]): Promise<void> {
    const results = await this.checkProductsAvailability(items);
    
    const invalidResults = results.filter(result => !result.is_valid);
    if (invalidResults.length > 0) {
      const errorMessages = invalidResults.flatMap(result => result.errors).join('; ');
      throw new Error(`Produtos inválidos: ${errorMessages}`);
    }
  }

  async validateProductsExistenceAndActivity(items: ProductValidationItem[]): Promise<void> {
    return this.validateProducts(items);
  }

  async checkProductsAvailability(items: ProductValidationItem[]): Promise<ProductValidationResult[]> {
    const results: ProductValidationResult[] = [];
    
    for (const item of items) {
      const product = this.productsData.get(item.product_id);
      const errors: string[] = [];
      
      if (!product) {
        errors.push(`Produto ${item.product_id} não encontrado`);
        results.push({
          product_id: item.product_id,
          is_valid: false,
          is_active: false,
          exists: false,
          errors
        });
        continue;
      }
      
      if (!product.is_active) {
        errors.push(`Produto ${item.product_id} está inativo`);
      }
      
      results.push({
        product_id: item.product_id,
        is_valid: errors.length === 0,
        is_active: product.is_active,
        exists: true,
        name: product.name,
        price: product.unit_price,
        errors
      });
    }

    return results;
  }

  async getProductsInfo(product_ids: string[]): Promise<ProductInfo[]> {
    const products: ProductInfo[] = [];
    
    for (const productId of product_ids) {
      const product = this.productsData.get(productId);
      if (product && product.is_active) {
        products.push({ ...product });
      }
    }
    
    return products;
  }

  async getProductInfo(product_id: string, store_id: string): Promise<{
    id: string;
    name: string;
    price: number;
    is_active: boolean;
    category_id: string;
  } | null> {
    const product = this.productsData.get(product_id);
    
    if (!product) {
      return null;
    }
    
    return {
      id: product.product_id,
      name: product.name,
      price: product.unit_price,
      is_active: product.is_active,
      category_id: product.category_id
    };
  }

  // Métodos auxiliares para testes
  clearAllProducts(): void {
    this.productsData.clear();
  }

  getAllProducts(): Map<string, ProductInfo> {
    return new Map(this.productsData);
  }

  setProductActive(productId: string, isActive: boolean): void {
    const product = this.productsData.get(productId);
    if (product) {
      product.is_active = isActive;
    }
  }

  updateProductPrice(productId: string, newPrice: number): void {
    const product = this.productsData.get(productId);
    if (product) {
      product.unit_price = newPrice;
    }
  }
}