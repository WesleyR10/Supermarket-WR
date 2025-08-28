import { IProductValidationService, ProductValidationItem, ProductValidationResult } from '../../domain/product-validation.service.interface';
import { IProductRepository } from '../../../product/domain/repositories/product.repository.interface';
import { ProductId } from '../../../product/domain/product.aggregate';

export class ProductValidationService implements IProductValidationService {
  constructor(private productRepository: IProductRepository) {}

  async validateProducts(items: ProductValidationItem[]): Promise<void> {
    const results = await this.checkProductsAvailability(items);
    
    const invalidProducts = results.filter(result => !result.is_valid);
    
    if (invalidProducts.length > 0) {
      const errors = invalidProducts.map(product => 
        `Product ${product.product_id}: ${product.errors.join(', ')}`
      ).join('; ');
      
      throw new Error(`Product validation failed: ${errors}`);
    }
  }

  async checkProductsAvailability(items: ProductValidationItem[]): Promise<ProductValidationResult[]> {
    const results: ProductValidationResult[] = [];
    
    for (const item of items) {
      const result = await this.validateSingleProduct(item);
      results.push(result);
    }
    
    return results;
  }

  async getProductInfo(product_id: string, store_id: string): Promise<{
    id: string;
    name: string;
    price: number;
    is_active: boolean;
    category_id: string;
  } | null> {
    try {
      const productId = new ProductId(product_id);
      const product = await this.productRepository.findById(productId);
      
      if (!product || product.store_id !== store_id) {
        return null;
      }
      
      return {
        id: product.product_id.id,
        name: product.name,
        price: product.price,
        is_active: product.is_active,
        category_id: product.category_id
      };
    } catch (error) {
      return null;
    }
  }

  private async validateSingleProduct(item: ProductValidationItem): Promise<ProductValidationResult> {
    const errors: string[] = [];
    let exists = false;
    let is_active = false;
    let name: string | undefined;
    let price: number | undefined;
    
    try {
      const productId = new ProductId(item.product_id);
      const product = await this.productRepository.findById(productId);
      
      if (!product) {
        errors.push('Product not found');
      } else {
        exists = true;
        name = product.name;
        price = product.price;
        
        // Verificar se o produto pertence à loja (multi-tenant)
        if (product.store_id !== item.store_id) {
          errors.push('Product does not belong to this store');
        } else {
          // Verificar se o produto está ativo
          if (!product.is_active) {
            errors.push('Product is inactive');
          } else {
            is_active = true;
          }
        }
      }
    } catch (error) {
      errors.push('Invalid product ID format');
    }
    
    const is_valid = exists && is_active && errors.length === 0;
    
    return {
      product_id: item.product_id,
      is_valid,
      is_active,
      exists,
      name,
      price,
      errors
    };
  }
}