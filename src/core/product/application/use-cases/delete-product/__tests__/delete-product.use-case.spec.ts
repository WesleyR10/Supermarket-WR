import { ProductInMemoryRepository } from '../../../../infra/db/in-memory/product-in-memory.repository';
import { DeleteProductUseCase } from '../delete-product.use-case';
import { Product, ProductId } from '../../../../domain/product.aggregate';
import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';
import { InvalidUuidError } from '../../../../../shared/domain/value-objects/uuid.vo';

describe('DeleteProductUseCase Unit Tests', () => {
  let useCase: DeleteProductUseCase;
  let repository: ProductInMemoryRepository;

  beforeEach(() => {
    repository = new ProductInMemoryRepository();
    useCase = new DeleteProductUseCase(repository);
  });

  it('should throw error when id is invalid', async () => {
    await expect(() => useCase.execute({ id: 'invalid-id' })).rejects.toThrow(
      InvalidUuidError,
    );
  });

  it('should throw error when product does not exist', async () => {
    const productId = new ProductId();
    await expect(() => useCase.execute({ id: productId.id })).rejects.toThrow(
      NotFoundError,
    );
  });

  it('should delete an existing product', async () => {
    const product = Product.fake().aProduct().build() as Product;
    await repository.insert(product);
    
    const spyDelete = jest.spyOn(repository, 'delete');
    
    await useCase.execute({ id: product.product_id.id });
    
    expect(spyDelete).toHaveBeenCalledTimes(1);
    expect(spyDelete).toHaveBeenCalledWith(product.product_id);
    expect(repository.items).toHaveLength(0);
  });

  it('should delete product with specific characteristics', async () => {
    // Produto pesável
    const weighableProduct = Product.fake()
      .aProduct()
      .withWeighableProduct()
      .build() as Product;
    
    // Produto de bebida
    const beverageProduct = Product.fake()
      .aProduct()
      .withBeverage()
      .build() as Product;
    
    await repository.insert(weighableProduct);
    await repository.insert(beverageProduct);
    
    expect(repository.items).toHaveLength(2);
    
    // Deletar produto pesável
    await useCase.execute({ id: weighableProduct.product_id.id });
    expect(repository.items).toHaveLength(1);
    expect(repository.items[0].product_id.id).toBe(beverageProduct.product_id.id);
    
    // Deletar produto de bebida
    await useCase.execute({ id: beverageProduct.product_id.id });
    expect(repository.items).toHaveLength(0);
  });

  it('should delete inactive product', async () => {
    const inactiveProduct = Product.fake()
      .aProduct()
      .withInactiveProduct()
      .build() as Product;
    
    await repository.insert(inactiveProduct);
    expect(repository.items).toHaveLength(1);
    expect(repository.items[0].is_active).toBe(false);
    
    await useCase.execute({ id: inactiveProduct.product_id.id });
    expect(repository.items).toHaveLength(0);
  });

  it('should delete high value product', async () => {
    const highValueProduct = Product.fake()
      .aProduct()
      .withHighValueProduct()
      .build() as Product;
    
    await repository.insert(highValueProduct);
    expect(repository.items).toHaveLength(1);
    expect(repository.items[0].price).toBeGreaterThan(100);
    
    await useCase.execute({ id: highValueProduct.product_id.id });
    expect(repository.items).toHaveLength(0);
  });
});