import { InventoryInMemoryRepository } from '../../../../infra/db/in-memory/inventory-in-memory.repository';
import { DeleteInventoryUseCase } from '../delete-inventory.use-case';
import { Inventory, InventoryId } from '../../../../domain/inventory.aggregate';
import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';
import { InvalidUuidError } from '../../../../../shared/domain/value-objects/uuid.vo';
import { EntityValidationError } from '../../../../../shared/domain/validators/validation.error';

describe('DeleteInventoryUseCase Unit Tests', () => {
  let repository: InventoryInMemoryRepository;
  let useCase: DeleteInventoryUseCase;

  beforeEach(() => {
    repository = new InventoryInMemoryRepository();
    useCase = new DeleteInventoryUseCase(repository);
  });

  it('should throw InvalidUuidError when id is invalid', async () => {
    await expect(() =>
      useCase.execute({ id: 'invalid-id', store_id: 'store-123' })
    ).rejects.toThrow(InvalidUuidError);
  });

  it('should throw NotFoundError when item does not exist', async () => {
    const id = new InventoryId().id;
    await expect(() =>
      useCase.execute({ id, store_id: 'store-123' })
    ).rejects.toThrow(NotFoundError);
  });

  it('should delete an existing inventory item', async () => {
    const inventory = Inventory.create({
      store_id: 'store-123',
      product_id: 'product-456',
      quantity: 50,
      min_stock: 5,
      max_stock: 100,
    });
    await repository.insert(inventory);

    const spyDelete = jest.spyOn(repository, 'delete');

    await useCase.execute({ id: inventory.inventory_item_id.id, store_id: 'store-123' });

    expect(spyDelete).toHaveBeenCalledTimes(1);
    expect(spyDelete).toHaveBeenCalledWith(inventory.inventory_item_id);
    expect(repository.items).toHaveLength(0);
  });

  it('should throw EntityValidationError for multi-tenancy violation', async () => {
    const inventory = Inventory.create({
      store_id: 'store-123',
      product_id: 'product-456',
      quantity: 20,
      min_stock: 2,
      max_stock: 60,
    });
    await repository.insert(inventory);

    await expect(() =>
      useCase.execute({ id: inventory.inventory_item_id.id, store_id: 'store-999' })
    ).rejects.toThrow(EntityValidationError);
    // Item must remain in repository
    expect(repository.items).toHaveLength(1);
  });
});