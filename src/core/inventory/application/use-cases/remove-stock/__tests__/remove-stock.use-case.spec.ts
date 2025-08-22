import { RemoveStockUseCase } from '../remove-stock.use-case';
import { RemoveStockInput } from '../remove-stock.input';
import { InventoryInMemoryRepository } from '../../../../infra/db/in-memory/inventory-in-memory.repository';
import { Inventory } from '../../../../domain/inventory.aggregate';
import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';
import { EntityValidationError } from '../../../../../shared/domain/validators/validation.error';
import { InvalidUuidError } from '../../../../../shared/domain/value-objects/uuid.vo';

describe('RemoveStockUseCase Unit Tests', () => {
  let useCase: RemoveStockUseCase;
  let repository: InventoryInMemoryRepository;
  let inventory: Inventory;

  beforeEach(() => {
    repository = new InventoryInMemoryRepository();
    useCase = new RemoveStockUseCase(repository);
    
    // Criar item de inventário válido
    inventory = Inventory.create({
      store_id: 'store-123',
      product_id: 'product-456',
      quantity: 100,
      min_stock: 10,
      max_stock: 200,
      unit_cost: 10.50,
      unit_price: 15.75,
      is_active: true
    });
    repository.items.push(inventory);
  });

  describe('execute method', () => {
    it('should remove stock successfully', async () => {
      const input = new RemoveStockInput({
        inventory_item_id: inventory.inventory_item_id.id,
        quantity: 25
      });

      const output = await useCase.execute(input);

      expect(output.quantity).toBe(75); // 100 - 25
      expect(output.id).toBe(inventory.inventory_item_id.id);
    });

    it('should throw InvalidUuidError when inventory_item_id is invalid', async () => {
      const input = new RemoveStockInput({
        inventory_item_id: 'invalid-uuid',
        quantity: 10
      });

      await expect(useCase.execute(input)).rejects.toThrow(InvalidUuidError);
    });

    it('should throw NotFoundError when inventory item not found', async () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      const input = new RemoveStockInput({
        inventory_item_id: validUuid,
        quantity: 10
      });

      await expect(useCase.execute(input)).rejects.toThrow(NotFoundError);
    });

    it('should throw EntityValidationError when removing more than available quantity', async () => {
      const input = new RemoveStockInput({
        inventory_item_id: inventory.inventory_item_id.id,
        quantity: 150 // Mais que os 100 disponíveis
      });

      await expect(useCase.execute(input)).rejects.toThrow(EntityValidationError);
    });

    it('should throw EntityValidationError when inventory is inactive', async () => {
      inventory.deactivate();
      await repository.update(inventory);

      const input = new RemoveStockInput({
        inventory_item_id: inventory.inventory_item_id.id,
        quantity: 10
      });

      await expect(useCase.execute(input)).rejects.toThrow(EntityValidationError);
    });

    it('should allow removing stock down to zero', async () => {
      const input = new RemoveStockInput({
        inventory_item_id: inventory.inventory_item_id.id,
        quantity: 100 // Remove todo o estoque
      });

      const output = await useCase.execute(input);

      expect(output.quantity).toBe(0);
    });

    it('should throw EntityValidationError when trying to remove negative quantity would result', async () => {
      const input = new RemoveStockInput({
        inventory_item_id: inventory.inventory_item_id.id,
        quantity: 101 // Mais que os 100 disponíveis
      });

      await expect(useCase.execute(input)).rejects.toThrow(EntityValidationError);
    });

    // Testes de integração com repositório
    describe('repository integration', () => {
      it('should update inventory in repository', async () => {
        const input = new RemoveStockInput({
          inventory_item_id: inventory.inventory_item_id.id,
          quantity: 30
        });

        await useCase.execute(input);

        const updatedInventory = await repository.findById(inventory.inventory_item_id);
        expect(updatedInventory!.quantity.value).toBe(70); // 100 - 30
      });
    });

    // Cenários específicos do supermercado
    describe('supermarket specific scenarios', () => {
      it('should handle fractional quantities for weighted products', async () => {
        const input = new RemoveStockInput({
          inventory_item_id: inventory.inventory_item_id.id,
          quantity: 12.5 // 12.5kg -> será convertido para 12 (inteiro)
        });

        const output = await useCase.execute(input);

        expect(output.quantity).toBe(88); // 100 - 12 (Math.floor(12.5))
      });

      it('should handle large stock removals with audit log', async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
        
        const input = new RemoveStockInput({
          inventory_item_id: inventory.inventory_item_id.id,
          quantity: 600
        });

        // Criar um novo inventário com capacidade maior para permitir a remoção
        const bulkInventory = Inventory.fake().anInventory().withQuantity(800).withMaxStock(1000).build();
        await repository.insert(bulkInventory);
        
        const bulkInput = new RemoveStockInput({
          inventory_item_id: bulkInventory.inventory_item_id.id,
          quantity: 600
        });

        await useCase.execute(bulkInput);

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Large stock removal detected: 600 units')
        );
        
        consoleSpy.mockRestore();
      });

      it('should handle removal leaving minimum stock', async () => {
        const input = new RemoveStockInput({
          inventory_item_id: inventory.inventory_item_id.id,
          quantity: 90 // Deixará 10, que é o mínimo
        });

        const output = await useCase.execute(input);

        expect(output.quantity).toBe(10);
        expect(output.quantity).toBe(inventory.min_stock.value);
      });

      it('should handle product expiry scenarios', async () => {
        // Simular produto próximo ao vencimento
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 5); // 5 dias para vencer
        inventory.setExpiryDate(expiryDate);
        await repository.update(inventory);

        const input = new RemoveStockInput({
          inventory_item_id: inventory.inventory_item_id.id,
          quantity: 50
        });

        const output = await useCase.execute(input);

        expect(output.quantity).toBe(50);
        expect(inventory.isNearExpiry()).toBe(true);
      });

      it('should handle bulk product removal for promotions', async () => {
        // Simular remoção em massa para promoções
        // Criar um novo inventory com quantidade maior para evitar limite de max_stock
        const bulkInventory = Inventory.fake().anInventory().withQuantity(500).withMaxStock(1000).build();
        await repository.insert(bulkInventory);

        const input = new RemoveStockInput({
          inventory_item_id: bulkInventory.inventory_item_id.id,
          quantity: 300
        });

        const output = await useCase.execute(input);

        expect(output.quantity).toBe(200);
      });

      it('should handle removal for damaged goods', async () => {
        const input = new RemoveStockInput({
          inventory_item_id: inventory.inventory_item_id.id,
          quantity: 5 // Pequena quantidade de produtos danificados
        });

        const output = await useCase.execute(input);

        expect(output.quantity).toBe(95);
      });

      it('should validate business rules before domain operation', async () => {
        // Testar que validações de negócio são executadas antes da operação do domínio
        inventory.deactivate();
        await repository.update(inventory);

        const input = new RemoveStockInput({
          inventory_item_id: inventory.inventory_item_id.id,
          quantity: 10
        });

        await expect(useCase.execute(input)).rejects.toThrow(EntityValidationError);
        
        // Verificar que a quantidade não foi alterada
        const unchangedInventory = await repository.findById(inventory.inventory_item_id);
        expect(unchangedInventory!.quantity.value).toBe(100); // Quantidade original
      });
    });
  });
});