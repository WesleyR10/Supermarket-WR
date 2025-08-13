import { CreateInventoryUseCase } from '../create-inventory.use-case';
import { InventoryInMemoryRepository } from '../../../../infra/db/in-memory/inventory-in-memory.repository';
import { InventoryId } from '../../../../domain/inventory.aggregate';
import { EntityValidationError } from '@core/shared/domain/validators/validation.error';
import { InvalidQuantityError } from '@core/shared/domain/value-objects/quantity.vo';

describe('CreateInventoryUseCase Unit Tests', () => {
  let useCase: CreateInventoryUseCase;
  let repository: InventoryInMemoryRepository;

  beforeEach(() => {
    repository = new InventoryInMemoryRepository();
    useCase = new CreateInventoryUseCase(repository);
  });

  it('should create a new inventory item', async () => {
    const input = {
      store_id: 'store-123',
      product_id: 'product-456',
      quantity: 50,
      min_stock: 10,
      max_stock: 100,
      cost_price: 2.50,
      supplier_id: 'supplier-789',
      location: 'A-1-2-3', // Formato correto com posição opcional
      expiry_date: new Date('2024-12-31'),
      batch_number: 'BATCH-001',
      is_active: true,
    };

    const output = await useCase.execute(input);

    expect(output).toMatchObject({
      id: expect.any(String),
      store_id: 'store-123',
      product_id: 'product-456',
      quantity: 50,
      min_stock: 10,
      max_stock: 100,
      cost_price: 2.50,
      supplier_id: 'supplier-789',
      location: 'A-1-2-3',
      expiry_date: new Date('2024-12-31'),
      batch_number: 'BATCH-001',
      is_active: true,
      last_movement_date: expect.any(Date),
      created_at: expect.any(Date),
      updated_at: expect.any(Date),
    });

    const entity = await repository.findById(new InventoryId(output.id));
    expect(entity).toBeDefined();
    expect(entity!.product_id).toBe('product-456');
  });

  it('should create inventory with minimal required fields', async () => {
    const input = {
      store_id: 'store-123',
      product_id: 'product-456',
      quantity: 50,
      min_stock: 10,
      max_stock: 100,
    };

    const output = await useCase.execute(input);

    expect(output).toMatchObject({
      id: expect.any(String),
      store_id: 'store-123',
      product_id: 'product-456',
      quantity: 50,
      min_stock: 10,
      max_stock: 100,
      cost_price: null,
      supplier_id: null,
      location: null,
      expiry_date: null,
      batch_number: null,
      is_active: true,
    });
  });

  it('should throw EntityValidationError when contract validation fails', async () => {
    const input = {
      store_id: '', // Erro de contrato/forma - string vazia
      product_id: '', // Erro de contrato/forma - string vazia
      quantity: 50, // OK - quantidade válida (VO não falhará)
      min_stock: 10,
      max_stock: 100,
    };

    await expect(useCase.execute(input)).rejects.toThrow(EntityValidationError);
  });

  it('should throw InvalidQuantityError when Value Object validation fails', async () => {
    const input = {
      store_id: 'store-123',
      product_id: 'product-456',
      quantity: -1, // Erro de invariante do VO - quantidade negativa
      min_stock: 10,
      max_stock: 100,
    };

    // Seguindo padrão FC: VOs lançam suas próprias exceções
    await expect(useCase.execute(input)).rejects.toThrow(InvalidQuantityError);
  });

  it('should throw EntityValidationError when min_stock >= max_stock', async () => {
    const input = {
      store_id: 'store-123',
      product_id: 'product-456',
      quantity: 50,
      min_stock: 100,
      max_stock: 50, // Erro de regra de negócio validada pelo validator
    };

    await expect(useCase.execute(input)).rejects.toThrow(EntityValidationError);
  });

  it('should throw InvalidQuantityError for negative min_stock', async () => {
    const input = {
      store_id: 'store-123',
      product_id: 'product-456',
      quantity: 50,
      min_stock: -5, // Erro de invariante do VO
      max_stock: 100,
    };

    await expect(useCase.execute(input)).rejects.toThrow(InvalidQuantityError);
  });

  it('should throw InvalidQuantityError for zero max_stock', async () => {
    const input = {
      store_id: 'store-123',
      product_id: 'product-456',
      quantity: 50,
      min_stock: 10,
      max_stock: 0, // Erro de invariante do VO (max_stock deve ser > 0)
    };

    await expect(useCase.execute(input)).rejects.toThrow(EntityValidationError);
  });
});