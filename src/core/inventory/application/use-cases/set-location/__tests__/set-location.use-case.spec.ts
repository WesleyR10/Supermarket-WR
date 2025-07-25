import { SetLocationUseCase } from '../set-location.use-case';
import { SetLocationInput } from '../set-location.input';
import { InventoryInMemoryRepository } from '../../../../infra/db/in-memory/inventory-in-memory.repository';
import { Inventory } from '../../../../domain/inventory.aggregate';
import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';
import { EntityValidationError } from '../../../../../shared/domain/validators/validation.error';
import { InvalidUuidError } from '../../../../../shared/domain/value-objects/uuid.vo';

describe('SetLocationUseCase Unit Tests', () => {
  let useCase: SetLocationUseCase;
  let repository: InventoryInMemoryRepository;
  let inventory: Inventory;

  beforeEach(() => {
    repository = new InventoryInMemoryRepository();
    useCase = new SetLocationUseCase(repository);
    
    // Criar item de inventário válido
    inventory = Inventory.create({
      store_id: 'store-123',
      product_id: 'product-456',
      quantity: 100,
      min_stock: 10,
      max_stock: 200,
      unit_cost: 10.50,
      unit_price: 15.75,
      location_code: 'A1-B2',
      is_active: true
    });
    repository.items.push(inventory);
  });

  describe('execute method', () => {
    it('should set location successfully', async () => {
      const input = new SetLocationInput({
        inventory_item_id: inventory.inventory_item_id.id,
        location_code: 'C3-D4'
      });

      const output = await useCase.execute(input);

      expect(output.location_code).toBe('C3-D4');
      expect(output.id).toBe(inventory.inventory_item_id.id);
    });

    it('should throw InvalidUuidError when inventory_item_id is invalid', async () => {
      const input = new SetLocationInput({
        inventory_item_id: 'invalid-uuid',
        location_code: 'C3-D4'
      });

      await expect(useCase.execute(input)).rejects.toThrow(InvalidUuidError);
    });

    it('should throw NotFoundError when inventory item not found', async () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      const input = new SetLocationInput({
        inventory_item_id: validUuid,
        location_code: 'C3-D4'
      });

      await expect(useCase.execute(input)).rejects.toThrow(NotFoundError);
    });

    it('should throw EntityValidationError when inventory is inactive', async () => {
      inventory.deactivate();
      await repository.update(inventory);

      const input = new SetLocationInput({
        inventory_item_id: inventory.inventory_item_id.id,
        location_code: 'C3-D4'
      });

      await expect(useCase.execute(input)).rejects.toThrow(EntityValidationError);
    });

    it('should throw EntityValidationError when location code format is invalid', async () => {
      const input = new SetLocationInput({
        inventory_item_id: inventory.inventory_item_id.id,
        location_code: 'invalid-format'
      });

      await expect(useCase.execute(input)).rejects.toThrow(EntityValidationError);
    });

    // Testes de integração com repositório
    describe('repository integration', () => {
      it('should update inventory in repository', async () => {
        const input = new SetLocationInput({
          inventory_item_id: inventory.inventory_item_id.id,
          location_code: 'E5-F6'
        });

        await useCase.execute(input);

        const updatedInventory = await repository.findById(inventory.inventory_item_id);
        expect(updatedInventory!.location_code).toBe('E5-F6');
      });
    });

    // Cenários específicos do supermercado
    describe('supermarket specific scenarios', () => {
      it('should handle moving products to different aisles', async () => {
        const input = new SetLocationInput({
          inventory_item_id: inventory.inventory_item_id.id,
          location_code: 'B2-C3' // Mudança de corredor
        });

        const output = await useCase.execute(input);

        expect(output.location_code).toBe('B2-C3');
      });

      it('should log location changes for audit', async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        
        const input = new SetLocationInput({
          inventory_item_id: inventory.inventory_item_id.id,
          location_code: 'Z9-Y8'
        });

        await useCase.execute(input);

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Location changed for item')
        );
        
        consoleSpy.mockRestore();
      });

      it('should handle moving to storage areas', async () => {
        const input = new SetLocationInput({
          inventory_item_id: inventory.inventory_item_id.id,
          location_code: 'S1-S2' // Área de estoque
        });

        const output = await useCase.execute(input);

        expect(output.location_code).toBe('S1-S2');
      });

      it('should handle moving to promotional areas', async () => {
        const input = new SetLocationInput({
          inventory_item_id: inventory.inventory_item_id.id,
          location_code: 'P1-P2' // Área promocional
        });

        const output = await useCase.execute(input);

        expect(output.location_code).toBe('P1-P2');
      });

      it('should handle moving to checkout areas', async () => {
        const input = new SetLocationInput({
          inventory_item_id: inventory.inventory_item_id.id,
          location_code: 'C1-C2' // Área de checkout
        });

        const output = await useCase.execute(input);

        expect(output.location_code).toBe('C1-C2');
      });
    });
  });
});