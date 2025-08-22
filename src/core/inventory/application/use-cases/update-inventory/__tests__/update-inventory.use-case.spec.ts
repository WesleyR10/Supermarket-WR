import { InventoryInMemoryRepository } from '../../../../infra/db/in-memory/inventory-in-memory.repository';
import { Inventory, InventoryId } from '../../../../domain/inventory.aggregate';
import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';
import { EntityValidationError } from '../../../../../shared/domain/validators/validation.error';
import { InvalidUuidError } from '../../../../../shared/domain/value-objects/uuid.vo';
import { UpdateInventoryUseCase } from '../update-inventory.use-case';
import { Notification } from '../../../../../shared/domain/validators/notification';

describe('UpdateInventoryUseCase Unit Tests', () => {
  let useCase: UpdateInventoryUseCase;
  let repository: InventoryInMemoryRepository;

  beforeEach(() => {
    repository = new InventoryInMemoryRepository();
    useCase = new UpdateInventoryUseCase(repository);
  });

  it('should throw error when id is invalid', async () => {
    await expect(() =>
      useCase.execute({ id: 'fake id', store_id: 'store-123' }),
    ).rejects.toThrow(new InvalidUuidError());
  });

  it('should throw error when inventory not found', async () => {
    const inventoryId = new InventoryId();
    await expect(() =>
      useCase.execute({ id: inventoryId.id, store_id: 'store-123' }),
    ).rejects.toThrow(new NotFoundError(inventoryId.id, Inventory));
  });

  it('should throw EntityValidationError when inventory belongs to different store', async () => {
    const inventory = Inventory.create({
      store_id: 'store-123',
      product_id: 'product-456',
      quantity: 50,
      min_stock: 10,
      max_stock: 100,
    });
    await repository.insert(inventory);

    await expect(() =>
      useCase.execute({
        id: inventory.inventory_item_id.id,
        store_id: 'different-store',
      }),
    ).rejects.toThrow(EntityValidationError);
  });

  it('should update inventory successfully', async () => {
    const inventory = Inventory.create({
      store_id: 'store-123',
      product_id: 'product-456',
      quantity: 50,
      min_stock: 10,
      max_stock: 100,
      cost_price: 10.00,
      location: 'A-1-2', // Formato correto: A-seção-prateleira
    });
    await repository.insert(inventory);

    const output = await useCase.execute({
      id: inventory.inventory_item_id.id,
      store_id: 'store-123',
      quantity: 75,
      unit_cost: 12.00,
      location_code: 'B-2-3', // Formato correto
      is_active: true,
    });

    expect(output.quantity).toBe(75);
    expect(output.cost_price).toBe(12.00);
    expect(output.location).toBe('B-2-3');
    expect(output.is_active).toBe(true);

    // Verify in repository
    const updatedInventory = await repository.findById(inventory.inventory_item_id);
    expect(updatedInventory?.quantity.value).toBe(75);
    expect(updatedInventory?.cost_price?.value).toBe(12.00);
    expect(updatedInventory?.location_code).toBe('B-2-3'); // location_code agora retorna corredor-seção-prateleira
    expect(updatedInventory?.is_active).toBe(true);
  });

  it('should update only provided fields', async () => {
    const inventory = Inventory.create({
      store_id: 'store-123',
      product_id: 'product-456',
      quantity: 50,
      min_stock: 10,
      max_stock: 100,
      cost_price: 10.00,
      location: 'A-1-2', // Formato correto
    });
    await repository.insert(inventory);

    // Limpar notification que pode ter acumulado erros de operações anteriores
    inventory.notification = new Notification();

    const originalQuantity = inventory.quantity.value;
    const originalLocation = inventory.location_code;

    const output = await useCase.execute({
      id: inventory.inventory_item_id.id,
      store_id: 'store-123', // Adicionar store_id obrigatório
      unit_cost: 15.00,
    });

    expect(output.quantity).toBe(originalQuantity); // Should remain unchanged
    expect(output.location).toBe('A-1-2'); // Should remain unchanged (output.location retorna localização completa)
    expect(output.cost_price).toBe(15.00); // Should be updated
  });
});