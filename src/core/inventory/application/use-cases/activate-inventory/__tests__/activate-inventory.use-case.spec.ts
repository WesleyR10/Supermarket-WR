import { ActivateInventoryUseCase } from '../activate-inventory.use-case';
import { ActivateInventoryInput } from '../activate-inventory.input';
import { InventoryInMemoryRepository } from '../../../../infra/db/in-memory/inventory-in-memory.repository';
import { Inventory } from '../../../../domain/inventory.aggregate';
import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';
import { EntityValidationError } from '../../../../../shared/domain/validators/validation.error';
import { InvalidUuidError } from '../../../../../shared/domain/value-objects/uuid.vo';

describe('ActivateInventoryUseCase Unit Tests', () => {
  let useCase: ActivateInventoryUseCase;
  let repository: InventoryInMemoryRepository;
  let inventory: Inventory;

  beforeEach(() => {
    repository = new InventoryInMemoryRepository();
    useCase = new ActivateInventoryUseCase(repository);
    
    // Criar item de inventário inativo
    inventory = Inventory.create({
      store_id: 'store-123',
      product_id: 'product-456',
      quantity: 100,
      min_stock: 10,
      max_stock: 200,
      unit_cost: 10.50,
      unit_price: 15.75,
      location: 'A1-B2',
      is_active: false
    });
    repository.items.push(inventory);
  });

  describe('execute method', () => {
    it('should activate inventory successfully', async () => {
      const input = new ActivateInventoryInput({
        inventory_item_id: inventory.inventory_item_id.id
      });

      const output = await useCase.execute(input);

      expect(output.is_active).toBe(true);
      expect(output.id).toBe(inventory.inventory_item_id.id);
    });

    it('should throw InvalidUuidError when inventory_item_id is invalid', async () => {
      const input = new ActivateInventoryInput({
        inventory_item_id: 'invalid-uuid'
      });

      await expect(useCase.execute(input)).rejects.toThrow(InvalidUuidError);
    });

    it('should throw NotFoundError when inventory item not found', async () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      const input = new ActivateInventoryInput({
        inventory_item_id: validUuid
      });

      await expect(useCase.execute(input)).rejects.toThrow(NotFoundError);
    });

    it('should throw EntityValidationError when inventory is already active', async () => {
      inventory.activate();
      await repository.update(inventory);

      const input = new ActivateInventoryInput({
        inventory_item_id: inventory.inventory_item_id.id
      });

      await expect(useCase.execute(input)).rejects.toThrow(EntityValidationError);
    });

    it('should throw EntityValidationError when location code is missing', async () => {
      // Criar inventário sem location_code
      const inventoryWithoutLocation = Inventory.create({
        store_id: 'store-123',
        product_id: 'product-456',
        quantity: 100,
        min_stock: 10,
        max_stock: 200,
        unit_cost: 10.50,
        unit_price: 15.75,
        is_active: false
      });
      repository.items.push(inventoryWithoutLocation);

      const input = new ActivateInventoryInput({
        inventory_item_id: inventoryWithoutLocation.inventory_item_id.id
      });

      await expect(useCase.execute(input)).rejects.toThrow(EntityValidationError);
    });

    it('should throw EntityValidationError when unit cost or price is invalid', async () => {
      // Criar inventário com preços inválidos
      const inventoryWithInvalidPrices = Inventory.create({
        store_id: 'store-123',
        product_id: 'product-456',
        quantity: 100,
        min_stock: 10,
        max_stock: 200,
        unit_cost: 0,
        unit_price: 0,
        is_active: false
      });
      repository.items.push(inventoryWithInvalidPrices);

      const input = new ActivateInventoryInput({
        inventory_item_id: inventoryWithInvalidPrices.inventory_item_id.id
      });

      await expect(useCase.execute(input)).rejects.toThrow(EntityValidationError);
    });

    // Testes de integração com repositório
    describe('repository integration', () => {
      it('should update inventory in repository', async () => {
        const input = new ActivateInventoryInput({
          inventory_item_id: inventory.inventory_item_id.id
        });

        await useCase.execute(input);

        const updatedInventory = await repository.findById(inventory.inventory_item_id);
        expect(updatedInventory!.is_active).toBe(true);
      });
    });

    // Cenários específicos do supermercado
    describe('supermarket specific scenarios', () => {
      it('should activate products after receiving shipment', async () => {
        const input = new ActivateInventoryInput({
          inventory_item_id: inventory.inventory_item_id.id
        });

        const output = await useCase.execute(input);

        expect(output.is_active).toBe(true);
        expect(output.quantity).toBe(100);
      });

      it('should log activation for audit', async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        
        const input = new ActivateInventoryInput({
          inventory_item_id: inventory.inventory_item_id.id
        });

        await useCase.execute(input);

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Activating inventory item')
        );
        
        consoleSpy.mockRestore();
      });

      it('should activate seasonal products', async () => {
        const input = new ActivateInventoryInput({
          inventory_item_id: inventory.inventory_item_id.id
        });

        const output = await useCase.execute(input);

        expect(output.is_active).toBe(true);
      });

      it('should activate products after quality check', async () => {
        const input = new ActivateInventoryInput({
          inventory_item_id: inventory.inventory_item_id.id
        });

        const output = await useCase.execute(input);

        expect(output.is_active).toBe(true);
        expect(output.location).toBe('A1-B2-1'); // Location.fromString adiciona posição padrão quando não especificada
      });

      it('should activate products for sale after price adjustment', async () => {
        const input = new ActivateInventoryInput({
          inventory_item_id: inventory.inventory_item_id.id
        });

        const output = await useCase.execute(input);

        expect(output.is_active).toBe(true);
        expect(output.unit_price).toBeGreaterThan(output.cost_price || 0);
      });
    });
  });
});