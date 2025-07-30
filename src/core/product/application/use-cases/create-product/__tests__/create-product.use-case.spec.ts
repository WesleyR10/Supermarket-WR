import { CreateProductUseCase } from '../create-product.use-case';
import { ProductInMemoryRepository } from '../../../../infra/db/in-memory/product-in-memory.repository';
import { FiscalConfigInMemoryRepository } from '../../../../../fiscal-config/infra/db/in-memory/fiscal-config-in-memory.repository';
import { FiscalValidationDomainService } from '../../../../domain/services/fiscal-validation.domain-service';
import { StoreSettingsService } from '../../../../../shared/domain/services/store-settings.service';
import { UnitType } from '../../../../domain/product.aggregate';
import { EntityValidationError } from '../../../../../shared/domain/validators/validation.error';

describe('CreateProductUseCase Unit Tests', () => {
  let useCase: CreateProductUseCase;
  let productRepository: ProductInMemoryRepository;
  let fiscalConfigRepository: FiscalConfigInMemoryRepository;
  let fiscalValidationService: FiscalValidationDomainService;
  let storeSettingsService: StoreSettingsService;

  beforeEach(() => {
    productRepository = new ProductInMemoryRepository();
    fiscalConfigRepository = new FiscalConfigInMemoryRepository();
    fiscalValidationService = new FiscalValidationDomainService(fiscalConfigRepository);
    storeSettingsService = new StoreSettingsService();
    useCase = new CreateProductUseCase(
      productRepository,
      fiscalValidationService,
      storeSettingsService
    );
  });

  it('should create a product with valid data', async () => {
    const input = {
      store_id: 'store-123',
      category_id: 'category-123',
      name: 'Arroz Branco 5kg',
      description: 'Arroz branco longo fino',
      barcode: '1234567890123',
      price: 12.99,
      cost_price: 8.50,
      brand: 'Tio João',
      unit_type: UnitType.PACK,
      weight: 5000,
      supplier_code: 'SUP001',
      ncm_code: '10063021',
      requires_weighing: false,
    };

    const output = await useCase.execute(input);

    expect(output.id).toBeDefined();
    expect(output.name).toBe('Arroz Branco 5kg');
    expect(output.category_id).toBe('category-123');
    expect(output.price).toBe(12.99);
    expect(output.cost_price).toBe(8.50);
    expect(output.brand).toBe('Tio João');
    expect(output.unit_type).toBe(UnitType.PACK);
    expect(output.is_active).toBe(true);
    expect(productRepository.items).toHaveLength(1);
  });

  it('should create a product with minimal required data', async () => {
    const input = {
      store_id: 'store-123',
      category_id: 'category-123',
      name: 'Produto Simples',
      barcode: '1234567890123',
      price: 10.00,
    };

    const output = await useCase.execute(input);

    expect(output.id).toBeDefined();
    expect(output.name).toBe('Produto Simples');
    expect(output.category_id).toBe('category-123');
    expect(output.price).toBe(10.00);
    expect(output.cost_price).toBeNull();
    expect(output.brand).toBeNull();
    expect(output.unit_type).toBe(UnitType.UNIT);
    expect(output.is_active).toBe(true);
  });

  it('should create a weighable product', async () => {
    const input = {
      store_id: 'store-123',
      category_id: 'category-carnes',
      name: 'Carne Bovina Premium',
      barcode: '1234567890123',
      price: 29.99,
      cost_price: 18.50,
      brand: 'Friboi',
      unit_type: UnitType.KG,
      weight: 1000,
      requires_weighing: true,
    };

    const output = await useCase.execute(input);

    expect(output.unit_type).toBe(UnitType.KG);
    expect(output.requires_weighing).toBe(true);
    expect(output.weight).toBe(1000);
  });

  it('should create a beverage product', async () => {
    const input = {
      store_id: 'store-123',
      category_id: 'category-bebidas',
      name: 'Coca-Cola 2L',
      barcode: '7894900011517',
      price: 5.99,
      cost_price: 3.50,
      brand: 'Coca-Cola',
      unit_type: UnitType.LITER,
      volume: 2000,
    };

    const output = await useCase.execute(input);

    expect(output.unit_type).toBe(UnitType.LITER);
    expect(output.volume).toBe(2000);
    expect(output.brand).toBe('Coca-Cola');
  });

  it('should throw error when name is empty', async () => {
    const input = {
      store_id: 'store-123',
      category_id: 'category-123',
      name: '',
      barcode: '1234567890123',
      price: 10.00,
    };

    await expect(useCase.execute(input)).rejects.toThrow(EntityValidationError);
  });

  it('should throw error when category_id is empty', async () => {
    const input = {
      store_id: 'store-123',
      category_id: '',
      name: 'Produto Teste',
      barcode: '1234567890123',
      price: 10.00,
    };

    await expect(useCase.execute(input)).rejects.toThrow(EntityValidationError);
  });

  it('should throw error when barcode is empty', async () => {
    const input = {
      store_id: 'store-123',
      category_id: 'category-123',
      name: 'Produto Teste',
      barcode: '',
      price: 10.00,
    };

    await expect(useCase.execute(input)).rejects.toThrow(EntityValidationError);
  });

  it('should throw error when price is negative', async () => {
    const input = {
      store_id: 'store-123',
      category_id: 'category-123',
      name: 'Produto Teste',
      barcode: '1234567890123',
      price: -10.00,
    };

    await expect(useCase.execute(input)).rejects.toThrow(EntityValidationError);
  });

  it('should throw error when cost_price is negative', async () => {
    const input = {
      store_id: 'store-123',
      category_id: 'category-123',
      name: 'Produto Teste',
      barcode: '1234567890123',
      price: 10.00,
      cost_price: -5.00,
    };

    await expect(useCase.execute(input)).rejects.toThrow(EntityValidationError);
  });

  it('should throw error when store_id is empty', async () => {
    const input = {
      store_id: '',
      category_id: 'category-123',
      name: 'Produto Teste',
      barcode: '1234567890123',
      price: 10.00,
    };

    await expect(useCase.execute(input)).rejects.toThrow(EntityValidationError);
  });

  // Testes para validação fiscal
  it('should throw EntityValidationError when fiscal validation fails and validation is enabled', async () => {
    // Mock para habilitar validação fiscal
    jest.spyOn(storeSettingsService, 'isFiscalValidationEnabled').mockResolvedValue(true);

    const input = {
      store_id: 'store-123',
      category_id: 'category-123',
      name: 'Produto Caro',
      barcode: '1234567890123',
      price: 60.00, // Preço acima de R$ 50 sem NCM
      // ncm_code não fornecido - deve falhar na validação fiscal
    };

    await expect(useCase.execute(input)).rejects.toThrow(EntityValidationError);
  });

  it('should create product when fiscal validation is disabled', async () => {
    // Mock para desabilitar validação fiscal
    jest.spyOn(storeSettingsService, 'isFiscalValidationEnabled').mockResolvedValue(false);

    const input = {
      store_id: 'store-123',
      category_id: 'category-123',
      name: 'Produto Caro',
      barcode: '1234567890123',
      price: 60.00, // Preço acima de R$ 50 sem NCM
      // ncm_code não fornecido - mas validação está desabilitada
    };

    const output = await useCase.execute(input);

    expect(output.id).toBeDefined();
    expect(output.name).toBe('Produto Caro');
    expect(output.price).toBe(60.00);
  });

  it('should create product when fiscal validation passes', async () => {
    // Mock para habilitar validação fiscal
    jest.spyOn(storeSettingsService, 'isFiscalValidationEnabled').mockResolvedValue(true);

    const input = {
      store_id: 'store-123',
      category_id: 'category-123',
      name: 'Produto Caro com NCM',
      barcode: '1234567890123',
      price: 60.00,
      ncm_code: '12345678', // NCM fornecido - validação deve passar
    };

    const output = await useCase.execute(input);

    expect(output.id).toBeDefined();
    expect(output.name).toBe('Produto Caro com NCM');
    expect(output.price).toBe(60.00);
    expect(output.ncm_code).toBe('12345678');
  });
});