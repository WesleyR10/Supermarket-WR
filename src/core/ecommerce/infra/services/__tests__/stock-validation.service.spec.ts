import { StockValidationService } from '../stock-validation.service';
import { InventoryInMemoryRepository } from '../../../../inventory/infra/db/in-memory/inventory-in-memory.repository';
import { Inventory } from '../../../../inventory/domain/inventory.aggregate';
import { StockValidationItem } from '../../../domain/stock-validation.service.interface';

describe('StockValidationService Unit Tests', () => {
  let service: StockValidationService;
  let inventoryRepo: InventoryInMemoryRepository;

  beforeEach(() => {
    inventoryRepo = new InventoryInMemoryRepository();
    service = new StockValidationService(inventoryRepo);
  });

  describe('checkStockAvailability', () => {
    it('should return valid when stock is sufficient', async () => {
      // Arrange
      const inventory = Inventory.create({
        store_id: 'store-1',
        product_id: 'product-1',
        quantity: 100,
        min_stock: 10,
        max_stock: 200,
        unit_cost: 10.00,
        unit_price: 15.00,
        location: 'A-1-1',
        is_active: true
      });
      await inventoryRepo.insert(inventory);

      const items: StockValidationItem[] = [
        { product_id: 'product-1', quantity: 50 }
      ];

      // Act
      const result = await service.checkStockAvailability('store-1', items);

      // Assert
      expect(result.is_valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return invalid when stock is insufficient', async () => {
      // Arrange
      const inventory = Inventory.create({
        store_id: 'store-1',
        product_id: 'product-1',
        quantity: 30,
        min_stock: 10,
        max_stock: 200,
        unit_cost: 10.00,
        unit_price: 15.00,
        location: 'A-1-1',
        is_active: true
      });
      await inventoryRepo.insert(inventory);

      const items: StockValidationItem[] = [
        { product_id: 'product-1', quantity: 50 }
      ];

      // Act
      const result = await service.checkStockAvailability('store-1', items);

      // Assert
      expect(result.is_valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toEqual({
        product_id: 'product-1',
        requested_quantity: 50,
        available_quantity: 30,
        message: 'Produto product-1: solicitado 50, disponível 30'
      });
    });

    it('should sum quantities from multiple inventory items for same product', async () => {
      // Arrange - Múltiplos lotes do mesmo produto
      const inventory1 = Inventory.create({
        store_id: 'store-1',
        product_id: 'product-1',
        quantity: 30,
        min_stock: 10,
        max_stock: 200,
        unit_cost: 10.00,
        unit_price: 15.00,
        location: 'A-1-1',
        batch_number: 'BATCH-001',
        is_active: true
      });

      const inventory2 = Inventory.create({
        store_id: 'store-1',
        product_id: 'product-1',
        quantity: 40,
        min_stock: 10,
        max_stock: 200,
        unit_cost: 10.00,
        unit_price: 15.00,
        location: 'A-1-2',
        batch_number: 'BATCH-002',
        is_active: true
      });

      await inventoryRepo.insert(inventory1);
      await inventoryRepo.insert(inventory2);

      const items: StockValidationItem[] = [
        { product_id: 'product-1', quantity: 60 }
      ];

      // Act
      const result = await service.checkStockAvailability('store-1', items);

      // Assert
      expect(result.is_valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should ignore inactive inventory items', async () => {
      // Arrange
      const activeInventory = Inventory.create({
        store_id: 'store-1',
        product_id: 'product-1',
        quantity: 30,
        min_stock: 10,
        max_stock: 200,
        unit_cost: 10.00,
        unit_price: 15.00,
        location: 'A-1-1',
        is_active: true
      });

      const inactiveInventory = Inventory.create({
        store_id: 'store-1',
        product_id: 'product-1',
        quantity: 50,
        min_stock: 10,
        max_stock: 200,
        unit_cost: 10.00,
        unit_price: 15.00,
        location: 'A-1-2',
        is_active: false
      });

      await inventoryRepo.insert(activeInventory);
      await inventoryRepo.insert(inactiveInventory);

      const items: StockValidationItem[] = [
        { product_id: 'product-1', quantity: 40 }
      ];

      // Act
      const result = await service.checkStockAvailability('store-1', items);

      // Assert
      expect(result.is_valid).toBe(false);
      expect(result.errors[0].available_quantity).toBe(30); // Apenas o ativo
    });

    it('should consider reservations when checking availability', async () => {
      // Arrange
      const inventory = Inventory.create({
        store_id: 'store-1',
        product_id: 'product-1',
        quantity: 100,
        min_stock: 10,
        max_stock: 200,
        unit_cost: 10.00,
        unit_price: 15.00,
        location: 'A-1-1',
        is_active: true
      });
      await inventoryRepo.insert(inventory);

      // Fazer uma reserva primeiro
      const reservationItems: StockValidationItem[] = [
        { product_id: 'product-1', quantity: 30 }
      ];
      await service.reserveStock('store-1', reservationItems, 'reservation-1');

      // Tentar validar mais estoque
      const items: StockValidationItem[] = [
        { product_id: 'product-1', quantity: 80 }
      ];

      // Act
      const result = await service.checkStockAvailability('store-1', items);

      // Assert
      expect(result.is_valid).toBe(false);
      expect(result.errors[0].available_quantity).toBe(70); // 100 - 30 reservado
    });

    it('should validate multiple products', async () => {
      // Arrange
      const inventory1 = Inventory.create({
        store_id: 'store-1',
        product_id: 'product-1',
        quantity: 50,
        min_stock: 10,
        max_stock: 200,
        unit_cost: 10.00,
        unit_price: 15.00,
        location: 'A-1-1',
        is_active: true
      });

      const inventory2 = Inventory.create({
        store_id: 'store-1',
        product_id: 'product-2',
        quantity: 20,
        min_stock: 5,
        max_stock: 100,
        unit_cost: 5.00,
        unit_price: 8.00,
        location: 'A-1-2',
        is_active: true
      });

      await inventoryRepo.insert(inventory1);
      await inventoryRepo.insert(inventory2);

      const items: StockValidationItem[] = [
        { product_id: 'product-1', quantity: 30 },
        { product_id: 'product-2', quantity: 25 } // Insuficiente
      ];

      // Act
      const result = await service.checkStockAvailability('store-1', items);

      // Assert
      expect(result.is_valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].product_id).toBe('product-2');
    });
  });

  describe('validateStock', () => {
    it('should not throw when stock is sufficient', async () => {
      // Arrange
      const inventory = Inventory.create({
        store_id: 'store-1',
        product_id: 'product-1',
        quantity: 100,
        min_stock: 10,
        max_stock: 200,
        unit_cost: 10.00,
        unit_price: 15.00,
        location: 'A-1-1',
        is_active: true
      });
      await inventoryRepo.insert(inventory);

      const items: StockValidationItem[] = [
        { product_id: 'product-1', quantity: 50 }
      ];

      // Act & Assert
      await expect(service.validateStock('store-1', items)).resolves.not.toThrow();
    });

    it('should throw error when stock is insufficient', async () => {
      // Arrange
      const inventory = Inventory.create({
        store_id: 'store-1',
        product_id: 'product-1',
        quantity: 30,
        min_stock: 10,
        max_stock: 200,
        unit_cost: 10.00,
        unit_price: 15.00,
        location: 'A-1-1',
        is_active: true
      });
      await inventoryRepo.insert(inventory);

      const items: StockValidationItem[] = [
        { product_id: 'product-1', quantity: 50 }
      ];

      // Act & Assert
      await expect(service.validateStock('store-1', items))
        .rejects.toThrow('Estoque insuficiente: Produto product-1: solicitado 50, disponível 30');
    });
  });

  describe('reserveStock', () => {
    it('should reserve stock successfully when available', async () => {
      // Arrange
      const inventory = Inventory.create({
        store_id: 'store-1',
        product_id: 'product-1',
        quantity: 100,
        min_stock: 10,
        max_stock: 200,
        unit_cost: 10.00,
        unit_price: 15.00,
        location: 'A-1-1',
        is_active: true
      });
      await inventoryRepo.insert(inventory);

      const items: StockValidationItem[] = [
        { product_id: 'product-1', quantity: 50 }
      ];

      // Act
      await service.reserveStock('store-1', items, 'reservation-1');

      // Assert
      const reservations = service.getReservations();
      expect(reservations.has('reservation-1')).toBe(true);
      expect(reservations.get('reservation-1')).toHaveLength(1);
    });

    it('should throw error when trying to reserve insufficient stock', async () => {
      // Arrange
      const inventory = Inventory.create({
        store_id: 'store-1',
        product_id: 'product-1',
        quantity: 30,
        min_stock: 10,
        max_stock: 200,
        unit_cost: 10.00,
        unit_price: 15.00,
        location: 'A-1-1',
        is_active: true
      });
      await inventoryRepo.insert(inventory);

      const items: StockValidationItem[] = [
        { product_id: 'product-1', quantity: 50 }
      ];

      // Act & Assert
      await expect(service.reserveStock('store-1', items, 'reservation-1'))
        .rejects.toThrow('Estoque insuficiente');
    });
  });

  describe('releaseReservation', () => {
    it('should release reservation successfully', async () => {
      // Arrange
      const inventory = Inventory.create({
        store_id: 'store-1',
        product_id: 'product-1',
        quantity: 100,
        min_stock: 10,
        max_stock: 200,
        unit_cost: 10.00,
        unit_price: 15.00,
        location: 'A-1-1',
        is_active: true
      });
      await inventoryRepo.insert(inventory);

      const items: StockValidationItem[] = [
        { product_id: 'product-1', quantity: 50 }
      ];
      await service.reserveStock('store-1', items, 'reservation-1');

      // Act
      await service.releaseReservation('reservation-1');

      // Assert
      const reservations = service.getReservations();
      expect(reservations.has('reservation-1')).toBe(false);
    });

    it('should throw error when reservation not found', async () => {
      // Act & Assert
      await expect(service.releaseReservation('non-existent'))
        .rejects.toThrow('Reserva non-existent não encontrada');
    });
  });

  describe('multi-tenant isolation', () => {
    it('should only consider inventory from the specified store', async () => {
      // Arrange
      const inventory1 = Inventory.create({
        store_id: 'store-1',
        product_id: 'product-1',
        quantity: 30,
        min_stock: 10,
        max_stock: 200,
        unit_cost: 10.00,
        unit_price: 15.00,
        location: 'A-1-1',
        is_active: true
      });

      const inventory2 = Inventory.create({
        store_id: 'store-2', // Loja diferente
        product_id: 'product-1',
        quantity: 100,
        min_stock: 10,
        max_stock: 200,
        unit_cost: 10.00,
        unit_price: 15.00,
        location: 'A-1-1',
        is_active: true
      });

      await inventoryRepo.insert(inventory1);
      await inventoryRepo.insert(inventory2);

      const items: StockValidationItem[] = [
        { product_id: 'product-1', quantity: 50 }
      ];

      // Act
      const result = await service.checkStockAvailability('store-1', items);

      // Assert
      expect(result.is_valid).toBe(false);
      expect(result.errors[0].available_quantity).toBe(30); // Apenas store-1
    });
  });
});