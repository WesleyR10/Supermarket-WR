import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';
import { InvalidUuidError } from '../../../../../shared/domain/value-objects/uuid.vo';
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

  it('should throw error when entity not found', async () => {
    await expect(() => useCase.execute({ id: 'fake id' })).rejects.toThrow(
      new InvalidUuidError(),
    );

    const productId = new ProductId();
    await expect(() => useCase.execute({ id: productId.id })).rejects.toThrow(
      new NotFoundError(productId.id, Product),
    );
  });

  it('should return a product', async () => {
    const product = Product.fake().aProduct().build() as Product;
    repository.items = [product];
    const spyFindById = jest.spyOn(repository, 'findById');
    
    const output = await useCase.execute({ id: product.product_id.id });
    
    expect(spyFindById).toHaveBeenCalledTimes(1);
    expect(output).toStrictEqual({
      id: product.product_id.id,
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