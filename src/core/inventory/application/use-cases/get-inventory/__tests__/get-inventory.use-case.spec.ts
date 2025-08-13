import { InventoryOutputMapper } from '../../common/inventory-output';
import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';
import { InvalidUuidError } from '../../../../../shared/domain/value-objects/uuid.vo';
import { EntityValidationError } from '../../../../../shared/domain/validators/validation.error';
import { Inventory, InventoryId } from '../../../../domain/inventory.aggregate';
import { InventoryInMemoryRepository } from '../../../../infra/db/in-memory/inventory-in-memory.repository';
import { GetInventoryUseCase } from '../get-inventory.use-case';

describe('GetInventoryUseCase Unit Tests', () => {
  let useCase: GetInventoryUseCase;
  let repository: InventoryInMemoryRepository;

  beforeEach(() => {
    repository = new InventoryInMemoryRepository();
    useCase = new GetInventoryUseCase(repository);
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
      store_id: 'store-456',
      product_id: 'product-123',
      quantity: 10,
      min_stock: 5,
      max_stock: 20,
      cost_price: 5,
    });
    await repository.insert(inventory);

    await expect(() =>
      useCase.execute({ id: inventory.inventory_item_id.id, store_id: 'store-123' }),
    ).rejects.toThrow(EntityValidationError);
  });

  it('should return inventory when it belongs to the correct store', async () => {
    const inventory = Inventory.create({
      store_id: 'store-123',
      product_id: 'product-123',
      quantity: 20,
      min_stock: 5,
      max_stock: 50,
      cost_price: 10,
    });
    await repository.insert(inventory);
    const spyFindById = jest.spyOn(repository, 'findById');

    const output = await useCase.execute({
      id: inventory.inventory_item_id.id,
      store_id: 'store-123',
    });

    expect(spyFindById).toHaveBeenCalledTimes(1);
    expect(output).toStrictEqual(InventoryOutputMapper.toOutput(inventory));
  });
});