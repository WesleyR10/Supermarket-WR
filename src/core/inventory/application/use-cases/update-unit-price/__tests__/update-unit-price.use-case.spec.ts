import { UpdateUnitPriceUseCase } from '../update-unit-price.use-case';
import { UpdateUnitPriceInput } from '../update-unit-price.input';
import { InventoryInMemoryRepository } from '../../../../infra/db/in-memory/inventory-in-memory.repository';
import { Inventory } from '../../../../domain/inventory.aggregate';
import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';
import { EntityValidationError } from '../../../../../shared/domain/validators/validation.error';
import { InvalidUuidError } from '../../../../../shared/domain/value-objects/uuid.vo';

describe('UpdateUnitPriceUseCase Unit Tests', () => {
  let useCase: UpdateUnitPriceUseCase;
  let repository: InventoryInMemoryRepository;
  let inventory: Inventory;

  beforeEach(() => {
    repository = new InventoryInMemoryRepository();
    useCase = new UpdateUnitPriceUseCase(repository);
    
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
    it('should update unit price successfully', async () => {
      const input = new UpdateUnitPriceInput({
        inventory_item_id: inventory.inventory_item_id.id,
        unit_price: 18.00
      });

      const output = await useCase.execute(input);

      expect(output.unit_price).toBe(18.00);
      expect(output.id).toBe(inventory.inventory_item_id.id);
    });

    it('should throw InvalidUuidError when inventory_item_id is invalid', async () => {
      const input = new UpdateUnitPriceInput({
        inventory_item_id: 'invalid-uuid',
        unit_price: 18.00
      });

      await expect(useCase.execute(input)).rejects.toThrow(InvalidUuidError);
    });

    it('should throw NotFoundError when inventory item not found', async () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      const input = new UpdateUnitPriceInput({
        inventory_item_id: validUuid,
        unit_price: 18.00
      });

      await expect(useCase.execute(input)).rejects.toThrow(NotFoundError);
    });

    it('should throw EntityValidationError when inventory is inactive', async () => {
      inventory.deactivate();
      await repository.update(inventory);

      const input = new UpdateUnitPriceInput({
        inventory_item_id: inventory.inventory_item_id.id,
        unit_price: 18.00
      });

      await expect(useCase.execute(input)).rejects.toThrow(EntityValidationError);
    });

    it('should throw EntityValidationError when unit price is lower than unit cost', async () => {
      const input = new UpdateUnitPriceInput({
        inventory_item_id: inventory.inventory_item_id.id,
        unit_price: 8.00 // Menor que o custo (10.50)
      });

      await expect(useCase.execute(input)).rejects.toThrow(EntityValidationError);
    });

    it('should throw EntityValidationError when profit margin is below 5%', async () => {
      const input = new UpdateUnitPriceInput({
        inventory_item_id: inventory.inventory_item_id.id,
        unit_price: 10.75 // Margem de ~2.3%
      });

      await expect(useCase.execute(input)).rejects.toThrow(EntityValidationError);
    });

    // Testes de integração com repositório
    describe('repository integration', () => {
      it('should update inventory in repository', async () => {
        const input = new UpdateUnitPriceInput({
          inventory_item_id: inventory.inventory_item_id.id,
          unit_price: 17.50
        });

        await useCase.execute(input);

        const updatedInventory = await repository.findById(inventory.inventory_item_id);
        expect(updatedInventory!.unit_price).toBe(17.50);
      });
    });

    // Cenários específicos do supermercado
    describe('supermarket specific scenarios', () => {
      it('should handle price adjustments for promotions', async () => {
        const input = new UpdateUnitPriceInput({
          inventory_item_id: inventory.inventory_item_id.id,
          unit_price: 13.99 // Preço promocional
        });

        const output = await useCase.execute(input);

        expect(output.unit_price).toBe(13.99);
        expect(inventory.calculateProfitMargin()).toBeGreaterThan(25);
      });

      it('should log large price variations for audit', async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        
        const input = new UpdateUnitPriceInput({
          inventory_item_id: inventory.inventory_item_id.id,
          unit_price: 35.00 // Aumento de ~122%
        });

        await useCase.execute(input);

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Large price variation detected')
        );
        
        consoleSpy.mockRestore();
      });

      it('should handle competitive pricing adjustments', async () => {
        const input = new UpdateUnitPriceInput({
          inventory_item_id: inventory.inventory_item_id.id,
          unit_price: 14.99 // Ajuste competitivo
        });

        const output = await useCase.execute(input);

        expect(output.unit_price).toBe(14.99);
        expect(inventory.calculateProfitMargin()).toBeGreaterThan(30);
      });

      it('should maintain healthy profit margins', async () => {
        const input = new UpdateUnitPriceInput({
          inventory_item_id: inventory.inventory_item_id.id,
          unit_price: 12.00 // Margem de ~12.5%
        });

        const output = await useCase.execute(input);

        expect(output.unit_price).toBe(12.00);
        expect(inventory.calculateProfitMargin()).toBeGreaterThan(10);
      });

      it('should handle fractional prices for retail', async () => {
        const input = new UpdateUnitPriceInput({
          inventory_item_id: inventory.inventory_item_id.id,
          unit_price: 16.99 // Preço psicológico
        });

        const output = await useCase.execute(input);

        expect(output.unit_price).toBe(16.99);
      });
    });
  });
});