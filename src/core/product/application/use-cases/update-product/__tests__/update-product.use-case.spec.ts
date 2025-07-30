import { ProductInMemoryRepository } from '../../../../infra/db/in-memory/product-in-memory.repository';
import { FiscalConfigInMemoryRepository } from '../../../../../fiscal-config/infra/db/in-memory/fiscal-config-in-memory.repository';
import { FiscalValidationDomainService } from '../../../../domain/services/fiscal-validation.domain-service';
import { StoreSettingsService } from '../../../../../shared/domain/services/store-settings.service';
import { UpdateProductUseCase } from '../update-product.use-case';
import { Product, ProductId, UnitType } from '../../../../domain/product.aggregate';
import { UpdateProductInput } from '../update-product.input';
import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';
import { EntityValidationError } from '../../../../../shared/domain/validators/validation.error';
import { InvalidUuidError } from '../../../../../shared/domain/value-objects/uuid.vo';

describe('UpdateProductUseCase Unit Tests', () => {
  let useCase: UpdateProductUseCase;
  let productRepository: ProductInMemoryRepository;
  let fiscalConfigRepository: FiscalConfigInMemoryRepository;
  let fiscalValidationService: FiscalValidationDomainService;
  let storeSettingsService: StoreSettingsService;

  beforeEach(() => {
    productRepository = new ProductInMemoryRepository();
    fiscalConfigRepository = new FiscalConfigInMemoryRepository();
    fiscalValidationService = new FiscalValidationDomainService(fiscalConfigRepository);
    storeSettingsService = new StoreSettingsService();
    useCase = new UpdateProductUseCase(
      productRepository, 
      fiscalValidationService,
      storeSettingsService
    );
  });

  it('should throw error when id is invalid', async () => {
    const input: UpdateProductInput = {
      id: 'invalid-id',
      store_id: 'store-123',
      name: 'Updated Product',
    };

    await expect(() => useCase.execute(input)).rejects.toThrow(
      InvalidUuidError,
    );
  });

  it('should throw error when product not found', async () => {
    const productId = new ProductId();
    const input: UpdateProductInput = {
      id: productId.id,
      store_id: 'store-123',
      name: 'Updated Product',
    };

    await expect(() => useCase.execute(input)).rejects.toThrow(
      new NotFoundError(productId.id, Product)
    );
  });

  it('should update a product when fiscal validation is disabled', async () => {
    // Mock para desabilitar validação fiscal
    jest.spyOn(storeSettingsService, 'isFiscalValidationEnabled').mockResolvedValue(false);

    const product = Product.create({
      category_id: 'category-123',
      name: 'Original Product',
      barcode: '1234567890123',
      price: 10.00,
      cost_price: 7.00,
      brand: 'Original Brand',
      store_id: 'store-123', // ADICIONADO
    });
    await productRepository.insert(product);

    const input: UpdateProductInput = {
      id: product.product_id.id,
      store_id: 'store-123',
      name: 'Updated Product',
      description: 'Updated description',
      price: 45.00,
      cost_price: 30.00,
      is_active: false,
      brand: 'Updated Brand',
      unit_type: UnitType.KG,
      weight: 1000,
      volume: 500,
      dimensions: '10x10x10',
      supplier_code: 'SUP002',
      ncm_code: '87654321',
      requires_weighing: true,
    };

    const output = await useCase.execute(input);

    expect(output).toStrictEqual({
      id: product.product_id.id,
      category_id: 'category-123',
      name: 'Updated Product',
      description: 'Updated description',
      barcode: '1234567890123',
      price: 45.00,
      cost_price: 30.00,
      is_active: false,
      brand: 'Updated Brand',
      unit_type: UnitType.KG,
      weight: 1000,
      volume: 500,
      dimensions: '10x10x10',
      supplier_code: 'SUP002',
      ncm_code: '87654321',
      requires_weighing: true,
      created_at: product.created_at,
      updated_at: expect.any(Date),
    });
  });

  it('should update a product when fiscal validation is enabled and passes', async () => {
    // Mock para habilitar validação fiscal
    jest.spyOn(storeSettingsService, 'isFiscalValidationEnabled').mockResolvedValue(true);

    const product = Product.create({
      category_id: 'category-123',
      name: 'Original Product',
      barcode: '1234567890123',
      price: 10.00,
      cost_price: 7.00,
      brand: 'Original Brand',
      store_id: 'store-123', // ADICIONADO
    });
    await productRepository.insert(product);

    const input: UpdateProductInput = {
      id: product.product_id.id,
      store_id: 'store-123',
      name: 'Updated Product',
      price: 60.00, // Preço acima de R$ 50 com NCM
      ncm_code: '87654321', // NCM fornecido - validação deve passar
    };

    const output = await useCase.execute(input);

    expect(output.name).toBe('Updated Product');
    expect(output.price).toBe(60.00);
    expect(output.ncm_code).toBe('87654321');
  });

  it('should throw EntityValidationError when fiscal validation fails', async () => {
    // Mock para habilitar validação fiscal
    jest.spyOn(storeSettingsService, 'isFiscalValidationEnabled').mockResolvedValue(true);

    const product = Product.create({
      category_id: 'category-123',
      name: 'Test Product',
      barcode: '1234567890123',
      price: 10.00,
      store_id: 'store-123', // ADICIONADO
    });
    await productRepository.insert(product);

    const input: UpdateProductInput = {
      id: product.product_id.id,
      store_id: 'store-123',
      price: 60.00, // Preço acima de R$ 50 sem NCM
      // ncm_code não fornecido - deve falhar na validação fiscal
    };

    await expect(() => useCase.execute(input)).rejects.toThrow(EntityValidationError);
  });
});