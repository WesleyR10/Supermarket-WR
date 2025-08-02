import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';
import { InvalidUuidError } from '../../../../../shared/domain/value-objects/uuid.vo';
import { EntityValidationError } from '../../../../../shared/domain/validators/validation.error';
import { Product, ProductId } from '../../../../domain/product.aggregate';
import { ProductInMemoryRepository } from '../../../../infra/db/in-memory/product-in-memory.repository';
import { GetProductUseCase } from '../get-product.use-case';

describe('GetProductUseCase Unit Tests', () => {
  let useCase: GetProductUseCase;
  let repository: ProductInMemoryRepository;

  beforeEach(() => {
    repository = new ProductInMemoryRepository();
    useCase = new GetProductUseCase(repository);
  });

  it('should throw error when id is invalid', async () => {
    await expect(() => useCase.execute({ 
      id: 'fake id', 
      store_id: 'store-123' 
    })).rejects.toThrow(new InvalidUuidError());
  });

  it('should throw error when product not found', async () => {
    const productId = new ProductId();
    await expect(() => useCase.execute({ 
      id: productId.id, 
      store_id: 'store-123' 
    })).rejects.toThrow(new NotFoundError(productId.id, Product));
  });

  it('should throw EntityValidationError when product belongs to different store', async () => {
    const product = Product.create({
      store_id: 'store-456',
      category_id: 'category-123',
      name: 'Test Product',
      barcode: '1234567890123',
      price: 10.00,
    });
    await repository.insert(product);

    await expect(() => useCase.execute({ 
      id: product.product_id.id, 
      store_id: 'store-123' // Tentando acessar produto de outra loja
    })).rejects.toThrow(EntityValidationError);
  });

  it('should return a product when it belongs to the correct store', async () => {
    const product = Product.create({
      store_id: 'store-123',
      category_id: 'category-123',
      name: 'Test Product',
      description: 'Test Description',
      barcode: '1234567890123',
      price: 10.00,
      cost_price: 7.00,
      is_active: true,
      brand: 'Test Brand',
    });
    await repository.insert(product);
    const spyFindById = jest.spyOn(repository, 'findById');
    
    const output = await useCase.execute({ 
      id: product.product_id.id, 
      store_id: 'store-123' 
    });
    
    expect(spyFindById).toHaveBeenCalledTimes(1);
    expect(output).toStrictEqual({
      id: product.product_id.id,
      store_id: product.store_id,
      category_id: product.category_id,
      name: product.name,
      description: product.description,
      barcode: product.barcode,
      price: product.price,
      cost_price: product.cost_price,
      is_active: product.is_active,
      brand: product.brand,
      unit_type: product.unit_type,
      weight: product.weight,
      volume: product.volume,
      dimensions: product.dimensions,
      supplier_code: product.supplier_code,
      ncm_code: product.ncm_code,
      requires_weighing: product.requires_weighing,
      created_at: product.created_at,
      updated_at: product.updated_at,
    });
  });
});