import { Inventory, InventoryId } from '../inventory.aggregate';
import { Quantity as QuantityVo } from '../../../shared/domain/value-objects/quantity.vo';
import { Location as LocationOv } from '../../../shared/domain/value-objects/location.vo';
import { ExpiryDate as ExperyDateOv } from '../../../shared/domain/value-objects/expiry-date.vo';
import { Money as MoneyVo } from '../../../shared/domain/value-objects/money.vo';

describe('Inventory Aggregate Unit Tests', () => {
  describe('constructor', () => {
    test('should create inventory with default values', () => {
      const inventory = Inventory.fake()
        .anInventory()
        .withStoreId('store-123')
        .withProductId('product-123')
        .withQuantity(100)
        .withMinStock(10)
        .withMaxStock(500)
        .build();

      expect(inventory.inventory_item_id).toBeInstanceOf(InventoryId);
      expect(inventory.store_id).toBe('store-123');
      expect(inventory.product_id).toBe('product-123');
      expect(inventory.quantity).toBeInstanceOf(QuantityVo);
      expect(inventory.quantity.value).toBe(100);
      expect(inventory.min_stock).toBeInstanceOf(QuantityVo);
      expect(inventory.min_stock.value).toBe(10);
      expect(inventory.max_stock).toBeInstanceOf(QuantityVo);
      expect(inventory.max_stock.value).toBe(500);
      expect(inventory.location).toBeDefined(); // Alterado para expect defined, pois o builder gera valor
      expect(inventory.expiry_date).toBeDefined(); // Pode ser null ou ExpiryDate
      expect(inventory.batch_number).toBeDefined(); // Pode ser null ou string
      expect(inventory.supplier_id).toBeDefined();
      expect(inventory.cost_price).toBeInstanceOf(MoneyVo);
      expect(inventory.cost_price).toBeDefined();
      expect(inventory.unit_price).toBeInstanceOf(MoneyVo);
      expect(inventory.unit_price).toBeDefined(); 
      expect(inventory.last_movement_date).toBeInstanceOf(Date);
      expect(inventory.created_at).toBeInstanceOf(Date);
      expect(inventory.updated_at).toBeInstanceOf(Date);
    });

    test('should create inventory with all properties', () => {
      const expiryDate = new Date('2024-12-31');
      const inventory = Inventory.fake()
        .anInventory()
        .withStoreId('store-123')
        .withProductId('product-123')
        .withQuantity(50)
        .withMinStock(5)
        .withMaxStock(200)
        .withLocation('A-01-01')
        .withExpiryDate(expiryDate)
        .withBatchNumber('BATCH001')
        .withSupplierId('supplier-123')
        .withCostPrice(10.99)
        .build();

      expect(inventory.store_id).toBe('store-123');
      expect(inventory.product_id).toBe('product-123');
      expect(inventory.quantity.value).toBe(50);
      expect(inventory.min_stock.value).toBe(5);
      expect(inventory.max_stock.value).toBe(200);
      expect(inventory.location).toBeInstanceOf(LocationOv);
      expect(inventory.location_code).toBe('A-01-01');
      expect(inventory.expiry_date?.value).toEqual(expiryDate);
      expect(inventory.batch_number).toBe('BATCH001');
      expect(inventory.supplier_id).toBe('supplier-123');
      expect(inventory.cost_price?.value).toBe(10.99);
    });
  });

  describe('create command', () => {
    test('should create inventory with validation', () => {
      const inventory = Inventory.create({
        store_id: 'store-123',
        product_id: 'product-123',
        quantity: 100,
        min_stock: 10,
        max_stock: 500,
      });

      expect(inventory).toBeInstanceOf(Inventory);
      expect(inventory.store_id).toBe('store-123');
      expect(inventory.product_id).toBe('product-123');
      expect(inventory.quantity.value).toBe(100);
      expect(inventory.min_stock.value).toBe(10);
      expect(inventory.max_stock.value).toBe(500);
    });

    test('should create inventory with supermarket specific fields', () => {
      const expiryDate = new Date('2024-12-31');
      const inventory = Inventory.create({
        store_id: 'store-123',
        product_id: 'product-123',
        quantity: 50,
        min_stock: 5,
        max_stock: 200,
        location: 'A-01-01',
        expiry_date: expiryDate,
        batch_number: 'BATCH001',
        supplier_id: 'supplier-123',
        cost_price: 10.99,
      });

      expect(inventory.quantity.value).toBe(50);
      expect(inventory.location).toBeInstanceOf(LocationOv);
      expect(inventory.location_code).toBe('A-01-01');
      expect(inventory.expiry_date).toBeInstanceOf(ExperyDateOv);
      expect(inventory.expiry_date?.value).toEqual(expiryDate);
      expect(inventory.batch_number).toBe('BATCH001');
      expect(inventory.supplier_id).toBe('supplier-123');
      expect(inventory.cost_price?.value).toBe(10.99);
    });
  });

  describe('business methods', () => {
    let inventory: Inventory;

    beforeEach(() => {
      inventory = Inventory.fake()
        .anInventory()
        .withStoreId('store-123')
        .withProductId('product-123')
        .withQuantity(100)
        .withMinStock(10)
        .withMaxStock(500)
        .withCostPrice(5.99)
        .withLocation('A-01-01')
        .build();
    });

    test('should add stock', () => {
      inventory.addStock(50);
      expect(inventory.quantity.value).toBe(150);
    });

    test('should throw error when adding stock exceeds max', () => {
      expect(() => inventory.addStock(450)).toThrow('Cannot add stock. Maximum quantity (500) would be exceeded');
    });

    test('should remove stock', () => {
      inventory.removeStock(20);
      expect(inventory.quantity.value).toBe(80);
    });

    test('should throw error when removing more than available', () => {
      expect(() => inventory.removeStock(150)).toThrow('Cannot remove stock. Insufficient quantity available');
    });

    test('should reserve stock', () => {
      inventory.reserveStock(50);
      expect(inventory.quantity.value).toBe(50);
    });

    test('should throw error when reserving more than available', () => {
      expect(() => inventory.reserveStock(100)).toThrow('Cannot reserve stock. Only 90 units available for reservation');
    });

    test('should update cost price', () => {
      inventory.updateCostPrice(6.99);
      expect(inventory.cost_price?.value).toBe(6.99);
    });

    test('should update unit price', () => {
      inventory.updateUnitPrice(15.99);
      expect(inventory.unit_price?.value).toBe(15.99);
    });

    test('should set supplier', () => {
      inventory.setSupplier('supplier-456');
      expect(inventory.supplier_id).toBe('supplier-456');
    });

    test('should set location', () => {
      inventory.setLocation('B-02-03');
      expect(inventory.location_code).toBe('B-02-03');
    });

    test('should set expiry date', () => {
      const date = new Date('2024-12-31');
      inventory.setExpiryDate(date);
      expect(inventory.expiry_date?.value).toEqual(date);
    });

    test('should set batch number', () => {
      inventory.setBatchNumber('BATCH002');
      expect(inventory.batch_number).toBe('BATCH002');
    });

    test('should check if low stock', () => {
      // Simula quantidade baixa diretamente no Value Object
      inventory.quantity = new QuantityVo(5);
      expect(inventory.isLowStock()).toBe(true);
      inventory.quantity = new QuantityVo(15);
      expect(inventory.isLowStock()).toBe(false);
    });

    test('should check if out of stock', () => {
      inventory.quantity = new QuantityVo(0);
      expect(inventory.isOutOfStock()).toBe(true);
      inventory.quantity = new QuantityVo(1);
      expect(inventory.isOutOfStock()).toBe(false);
    });

    test('should check if full stock', () => {
      inventory.quantity = new QuantityVo(450);
      expect(inventory.isFullStock()).toBe(true);
      inventory.quantity = new QuantityVo(400);
      expect(inventory.isFullStock()).toBe(false);
    });

    test('should check if expired', () => {
      inventory.setExpiryDate(new Date('2020-01-01'));
      expect(inventory.isExpired()).toBe(true);
      inventory.setExpiryDate(new Date('2030-01-01'));
      expect(inventory.isExpired()).toBe(false);
    });

    test('should check if near expiry', () => {
      const nearDate = new Date();
      nearDate.setDate(nearDate.getDate() + 15);
      inventory.setExpiryDate(nearDate);
      expect(inventory.isNearExpiry()).toBe(true);

      const farDate = new Date();
      farDate.setDate(farDate.getDate() + 60);
      inventory.setExpiryDate(farDate);
      expect(inventory.isNearExpiry()).toBe(false);
    });

    test('should calculate total value', () => {
      expect(inventory.calculateTotalValue()).toBe(599);
    });

    test('should check if needs restock', () => {
      inventory.quantity = new QuantityVo(5);
      expect(inventory.needsRestock()).toBe(true);
      inventory.quantity = new QuantityVo(15);
      expect(inventory.needsRestock()).toBe(false);
    });

    test('should calculate restock quantity', () => {
      inventory.quantity = new QuantityVo(100);
      expect(inventory.calculateRestockQuantity()).toBe(400);
      inventory.quantity = new QuantityVo(500);
      expect(inventory.calculateRestockQuantity()).toBe(0);
    });

    test('should check if perishable', () => {
      inventory.setExpiryDate(new Date());
      expect(inventory.isPerishable()).toBe(true);
      inventory.setExpiryDate(null);
      expect(inventory.isPerishable()).toBe(false);
    });

    test('should get days until expiry', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      inventory.setExpiryDate(futureDate);
      expect(inventory.getDaysUntilExpiry()).toBeCloseTo(10, 0);
      inventory.setExpiryDate(null);
      expect(inventory.getDaysUntilExpiry()).toBeNull();
    });
  });

  describe('validation', () => {
    test('should validate inventory on create', () => {
      const inventory = Inventory.create({
        store_id: 'store-123',
        product_id: 'product-123',
        quantity: 100,
        min_stock: 10,
        max_stock: 500,
      });
      expect(inventory).toBeInstanceOf(Inventory);
    });

    test('should have validation error without store_id', () => {
      // @ts-ignore store_id omitido intencionalmente
      const inventory = Inventory.create({
        product_id: 'product-123',
        quantity: 100,
        min_stock: 10,
        max_stock: 500,
      });
      expect(inventory.notification.hasErrors()).toBe(true);
      expect(inventory.notification.errors.has('store_id')).toBe(true);
    });
  });

  describe('InventoryId value object', () => {
    test('should create InventoryId', () => {
      const id = new InventoryId();
      expect(id).toBeInstanceOf(InventoryId);
      expect(id.id).toBeDefined();
    });

    test('should accept valid uuid', () => {
      const uuid = 'c3e9b0d0-7b6f-4a8e-8e1f-3f9e6a2f7e3c';
      const id = new InventoryId(uuid);
      expect(id.id).toBe(uuid);
    });
  });

  describe('fake builder', () => {
    test('should create inventory using fake builder', () => {
      const inventory = Inventory.fake().anInventory().build();
      expect(inventory).toBeInstanceOf(Inventory);
    });

    test('should create perishable inventory', () => {
      const inventory = Inventory.fake().anInventory().withPerishableProduct().build();
      expect(inventory.isPerishable()).toBe(true);
      expect(inventory.expiry_date).not.toBeNull();
    });

    test('should create non-perishable inventory', () => {
      const inventory = Inventory.fake().anInventory().withNonPerishableProduct().build();
      expect(inventory.isPerishable()).toBe(false);
      expect(inventory.expiry_date).toBeNull();
    });
  });

  describe('store_id and multi-tenancy', () => {
    test('should create inventory with specific store_id using fake builder', () => {
      const storeId = 'store-123';
      const inventory = Inventory.fake().anInventory().withStoreId(storeId).build();
      expect(inventory.store_id).toBe(storeId);
    });

    test('should create inventories for different stores', () => {
      const inventory1 = Inventory.fake().anInventory().withStoreId('store-123').build();
      const inventory2 = Inventory.fake().anInventory().withStoreId('store-456').build();
      expect(inventory1.store_id).not.toBe(inventory2.store_id);
    });

    test('should create inventories for specific store', () => {
      const storeId = 'store-456';
      const inventories = [
        Inventory.fake().anInventory().withStoreId(storeId).build(),
        Inventory.fake().anInventory().withStoreId(storeId).build(),
        Inventory.fake().anInventory().withStoreId(storeId).build(),
      ];
      inventories.forEach(inv => {
        expect(inv.store_id).toBe(storeId);
      });
    });
  });
});