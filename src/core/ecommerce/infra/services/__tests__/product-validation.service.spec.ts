import { ProductValidationService } from '../product-validation.service';
import { IProductRepository } from '../../../../product/domain/repositories/product.repository.interface';
import { Product, ProductId } from '../../../../product/domain/product.aggregate';
import { ProductValidationItem } from '../../../domain/product-validation.service.interface';

describe('ProductValidationService', () => {
  let service: ProductValidationService;
  let mockProductRepository: jest.Mocked<IProductRepository>;
  
  const storeId = 'store-123';
  const otherStoreId = 'store-456';
  
  beforeEach(() => {
    mockProductRepository = {
      findById: jest.fn(),
    } as any;
    
    service = new ProductValidationService(mockProductRepository);
  });
  
  describe('checkProductsAvailability', () => {
    it('should return valid result for existing active product', async () => {
      const product = Product.fake()
        .aProduct()
        .withStoreId(storeId)
        .withName('Test Product')
        .withPrice(10.99)
        .withIsActive(true)
        .build();
      
      mockProductRepository.findById.mockResolvedValue(product);
      
      const items: ProductValidationItem[] = [
        { product_id: product.product_id.id, store_id: storeId }
      ];
      
      const results = await service.checkProductsAvailability(items);
      
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        product_id: product.product_id.id,
        is_valid: true,
        is_active: true,
        exists: true,
        name: 'Test Product',
        price: 10.99,
        errors: []
      });
    });
    
    it('should return invalid result for non-existing product', async () => {
      mockProductRepository.findById.mockResolvedValue(null);
      
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      const items: ProductValidationItem[] = [
        { product_id: validUuid, store_id: storeId }
      ];
      
      const results = await service.checkProductsAvailability(items);
      
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        product_id: validUuid,
        is_valid: false,
        is_active: false,
        exists: false,
        name: undefined,
        price: undefined,
        errors: ['Product not found']
      });
    });
    
    it('should return invalid result for inactive product', async () => {
      const product = Product.fake()
        .aProduct()
        .withStoreId(storeId)
        .withName('Inactive Product')
        .withPrice(15.50)
        .withIsActive(false)
        .build();
      
      mockProductRepository.findById.mockResolvedValue(product);
      
      const items: ProductValidationItem[] = [
        { product_id: product.product_id.id, store_id: storeId }
      ];
      
      const results = await service.checkProductsAvailability(items);
      
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        product_id: product.product_id.id,
        is_valid: false,
        is_active: false,
        exists: true,
        name: 'Inactive Product',
        price: 15.50,
        errors: ['Product is inactive']
      });
    });
    
    it('should return invalid result for product from different store (multi-tenant)', async () => {
      const product = Product.fake()
        .aProduct()
        .withStoreId(otherStoreId)
        .withName('Other Store Product')
        .withPrice(20.00)
        .withIsActive(true)
        .build();
      
      mockProductRepository.findById.mockResolvedValue(product);
      
      const items: ProductValidationItem[] = [
        { product_id: product.product_id.id, store_id: storeId }
      ];
      
      const results = await service.checkProductsAvailability(items);
      
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        product_id: product.product_id.id,
        is_valid: false,
        is_active: false,
        exists: true,
        name: 'Other Store Product',
        price: 20.00,
        errors: ['Product does not belong to this store']
      });
    });
    
    it('should handle invalid product ID format', async () => {
      mockProductRepository.findById.mockRejectedValue(new Error('Invalid UUID'));
      
      const items: ProductValidationItem[] = [
        { product_id: 'invalid-uuid', store_id: storeId }
      ];
      
      const results = await service.checkProductsAvailability(items);
      
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        product_id: 'invalid-uuid',
        is_valid: false,
        is_active: false,
        exists: false,
        name: undefined,
        price: undefined,
        errors: ['Invalid product ID format']
      });
    });
    
    it('should validate multiple products', async () => {
      const product1 = Product.fake()
        .aProduct()
        .withStoreId(storeId)
        .withIsActive(true)
        .build();
      
      const product2 = Product.fake()
        .aProduct()
        .withStoreId(storeId)
        .withIsActive(false)
        .build();
      
      mockProductRepository.findById
        .mockResolvedValueOnce(product1)
        .mockResolvedValueOnce(product2);
      
      const items: ProductValidationItem[] = [
        { product_id: product1.product_id.id, store_id: storeId },
        { product_id: product2.product_id.id, store_id: storeId }
      ];
      
      const results = await service.checkProductsAvailability(items);
      
      expect(results).toHaveLength(2);
      expect(results[0].is_valid).toBe(true);
      expect(results[1].is_valid).toBe(false);
      expect(results[1].errors).toContain('Product is inactive');
    });
  });
  
  describe('validateProducts', () => {
    it('should not throw error for valid products', async () => {
      const product = Product.fake()
        .aProduct()
        .withStoreId(storeId)
        .withIsActive(true)
        .build();
      
      mockProductRepository.findById.mockResolvedValue(product);
      
      const items: ProductValidationItem[] = [
        { product_id: product.product_id.id, store_id: storeId }
      ];
      
      await expect(service.validateProducts(items)).resolves.not.toThrow();
    });
    
    it('should throw error for invalid products', async () => {
      mockProductRepository.findById.mockResolvedValue(null);
      
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      const items: ProductValidationItem[] = [
        { product_id: validUuid, store_id: storeId }
      ];
      
      await expect(service.validateProducts(items))
        .rejects
        .toThrow(`Product validation failed: Product ${validUuid}: Product not found`);
    });
    
    it('should throw error with multiple product errors', async () => {
      const inactiveProduct = Product.fake()
        .aProduct()
        .withStoreId(storeId)
        .withIsActive(false)
        .build();
      
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      
      mockProductRepository.findById
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(inactiveProduct);
      
      const items: ProductValidationItem[] = [
        { product_id: validUuid, store_id: storeId },
        { product_id: inactiveProduct.product_id.id, store_id: storeId }
      ];
      
      const result = service.validateProducts(items);
      
      await expect(result).rejects.toThrow('Product validation failed');
      await expect(result).rejects.toThrow('Product not found');
      await expect(result).rejects.toThrow('Product is inactive');
    });
  });
  
  describe('getProductInfo', () => {
    it('should return product info for existing product', async () => {
      const product = Product.fake()
        .aProduct()
        .withStoreId(storeId)
        .withName('Test Product')
        .withPrice(25.99)
        .withIsActive(true)
        .withCategoryId('category-123')
        .build();
      
      mockProductRepository.findById.mockResolvedValue(product);
      
      const result = await service.getProductInfo(product.product_id.id, storeId);
      
      expect(result).toEqual({
        id: product.product_id.id,
        name: 'Test Product',
        price: 25.99,
        is_active: true,
        category_id: 'category-123'
      });
    });
    
    it('should return null for non-existing product', async () => {
      mockProductRepository.findById.mockResolvedValue(null);
      
      const result = await service.getProductInfo('non-existing-id', storeId);
      
      expect(result).toBeNull();
    });
    
    it('should return null for product from different store', async () => {
      const product = Product.fake()
        .aProduct()
        .withStoreId(otherStoreId)
        .build();
      
      mockProductRepository.findById.mockResolvedValue(product);
      
      const result = await service.getProductInfo(product.product_id.id, storeId);
      
      expect(result).toBeNull();
    });
    
    it('should return null for invalid product ID', async () => {
      mockProductRepository.findById.mockRejectedValue(new Error('Invalid UUID'));
      
      const result = await service.getProductInfo('invalid-uuid', storeId);
      
      expect(result).toBeNull();
    });
  });
  
  describe('multi-tenant isolation', () => {
    it('should ensure products are isolated by store', async () => {
      const productStore1 = Product.fake()
        .aProduct()
        .withStoreId('store-1')
        .withIsActive(true)
        .build();
      
      const productStore2 = Product.fake()
        .aProduct()
        .withStoreId('store-2')
        .withIsActive(true)
        .build();
      
      // Tentar acessar produto da store-1 usando store-2
      mockProductRepository.findById.mockResolvedValue(productStore1);
      
      const items: ProductValidationItem[] = [
        { product_id: productStore1.product_id.id, store_id: 'store-2' }
      ];
      
      const results = await service.checkProductsAvailability(items);
      
      expect(results[0].is_valid).toBe(false);
      expect(results[0].errors).toContain('Product does not belong to this store');
    });
  });
});