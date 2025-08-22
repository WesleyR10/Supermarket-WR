import { Inventory } from '../../../../domain/inventory.aggregate';
import { InventoryInMemoryRepository } from '../inventory-in-memory.repository';
import { InventorySearchParams } from '../../../../domain/repositories/inventory.repository.interface';

describe('InventoryInMemoryRepository Unit Tests', () => {
  let repository: InventoryInMemoryRepository;
  const storeId = 'store-123';
  const otherStoreId = 'store-456';

  beforeEach(() => {
    repository = new InventoryInMemoryRepository();
  });

  describe('search with filters', () => {
    it('should filter by store_id (multi-tenant isolation)', async () => {
      const items = [
        Inventory.fake().anInventory().withStoreId(storeId).build(),
        Inventory.fake().anInventory().withStoreId(otherStoreId).build(),
        Inventory.fake().anInventory().withStoreId(storeId).build(),
      ];
      repository.items = items;

      const params = InventorySearchParams.create({ filter: { store_id: storeId } });
      const result = await repository.search(params);
      expect(result.items).toHaveLength(2);
      expect(result.items.every(item => item.store_id === storeId)).toBe(true);
    });

    it('should filter by location', async () => {
      const targetLocation = 'A-1-2';
      const expectedLocationCode = 'A-1'; // location_code agora retorna apenas corredor-seção
      const items = [
        Inventory.fake().anInventory().withStoreId(storeId).withLocation(targetLocation).build(),
        Inventory.fake().anInventory().withStoreId(storeId).withLocation('C-3-4').build(),
        Inventory.fake().anInventory().withStoreId(storeId).withLocation(targetLocation).build(),
      ];
      repository.items = items;

      const params = InventorySearchParams.create({ filter: { store_id: storeId, location: expectedLocationCode } });
      const result = await repository.search(params);
      expect(result.items).toHaveLength(2);
      expect(result.items.every(item => item.location_code === expectedLocationCode)).toBe(true);
    });

    it('should filter by low_stock', async () => {
      const items = [
        Inventory.fake().anInventory().withStoreId(storeId).withQuantity(5).withMinStock(10).build(), // Low stock
        Inventory.fake().anInventory().withStoreId(storeId).withQuantity(50).withMinStock(10).build(), // Normal stock
        Inventory.fake().anInventory().withStoreId(storeId).withQuantity(8).withMinStock(15).build(), // Low stock
      ];
      repository.items = items;

      const params = InventorySearchParams.create({ filter: { store_id: storeId, low_stock: true } });
      const result = await repository.search(params);
      expect(result.items).toHaveLength(2);
      expect(result.items.every(item => item.isLowStock())).toBe(true);
    });
  });

  describe('search with sorting', () => {
    it('should sort by cost_price', async () => {
      const items = [
        Inventory.fake().anInventory().withStoreId(storeId).withCostPrice(30.00).build(),
        Inventory.fake().anInventory().withStoreId(storeId).withCostPrice(10.00).build(),
        Inventory.fake().anInventory().withStoreId(storeId).withCostPrice(20.00).build(),
      ];
      repository.items = items;

      const paramsAsc = InventorySearchParams.create({ filter: { store_id: storeId }, sort: 'cost_price', sort_dir: 'asc' });
      const resultAsc = await repository.search(paramsAsc);
      expect(resultAsc.items[0].cost_price?.value).toBe(10.00);
      expect(resultAsc.items[2].cost_price?.value).toBe(30.00);

      const paramsDesc = InventorySearchParams.create({ filter: { store_id: storeId }, sort: 'cost_price', sort_dir: 'desc' });
      const resultDesc = await repository.search(paramsDesc);
      expect(resultDesc.items[0].cost_price?.value).toBe(30.00);
      expect(resultDesc.items[2].cost_price?.value).toBe(10.00);
    });

    it('should sort by expiry_date handling null values', async () => {
      const now = new Date();
      const future = new Date(now.getTime() + 100000000);
      const past = new Date(now.getTime() - 100000000);
      const items = [
        Inventory.fake().anInventory().withStoreId(storeId).withExpiryDate(future).build(),
        Inventory.fake().anInventory().withStoreId(storeId).withExpiryDate(null).build(),
        Inventory.fake().anInventory().withStoreId(storeId).withExpiryDate(past).build(),
      ];
      repository.items = items;

      const paramsAsc = InventorySearchParams.create({ filter: { store_id: storeId }, sort: 'expiry_date', sort_dir: 'asc' });
      const resultAsc = await repository.search(paramsAsc);
      expect(resultAsc.items[0].expiry_date?.value).toEqual(past);
      expect(resultAsc.items[1].expiry_date?.value).toEqual(future);
      expect(resultAsc.items[2].expiry_date).toBeNull();

      const paramsDesc = InventorySearchParams.create({ filter: { store_id: storeId }, sort: 'expiry_date', sort_dir: 'desc' });
      const resultDesc = await repository.search(paramsDesc);
      expect(resultDesc.items[0].expiry_date?.value).toEqual(future);
      expect(resultDesc.items[1].expiry_date?.value).toEqual(past);
      expect(resultDesc.items[2].expiry_date).toBeNull();
    });
  });

  describe('domain-specific methods', () => {
    it('should find items by location', async () => {
      const targetLocation = 'A-1-2';
      const expectedLocationCode = 'A-1'; // location_code agora retorna apenas corredor-seção
      const items = [
        Inventory.fake().anInventory().withStoreId(storeId).withLocation(targetLocation).build(),
        Inventory.fake().anInventory().withStoreId(storeId).withLocation('C-3-4').build(),
        Inventory.fake().anInventory().withStoreId(otherStoreId).withLocation(targetLocation).build(), // Different store
      ];
      repository.items = items;

      const result = await repository.findByLocation(storeId, expectedLocationCode);
      expect(result).toHaveLength(1);
      expect(result[0].location_code).toBe(expectedLocationCode);
      expect(result[0].store_id).toBe(storeId);
    });

    it('should find low stock items', async () => {
      const items = [
        Inventory.fake().anInventory().withStoreId(storeId).withQuantity(5).withMinStock(10).build(), // Low stock
        Inventory.fake().anInventory().withStoreId(storeId).withQuantity(50).withMinStock(10).build(), // Normal stock
        Inventory.fake().anInventory().withStoreId(otherStoreId).withQuantity(3).withMinStock(10).build(), // Different store
      ];
      repository.items = items;

      const result = await repository.findLowStockItems(storeId);
      expect(result).toHaveLength(1);
      expect(result[0].isLowStock()).toBe(true);
      expect(result[0].store_id).toBe(storeId);
    });

    it('should find perishable items', async () => {
      const items = [
        Inventory.fake().anInventory().withStoreId(storeId).withPerishableProduct().build(), // Perishable
        Inventory.fake().anInventory().withStoreId(storeId).withNonPerishableProduct().build(), // Non-perishable
        Inventory.fake().anInventory().withStoreId(otherStoreId).withPerishableProduct().build(), // Different store
      ];
      repository.items = items;

      const result = await repository.findPerishableItems(storeId);
      expect(result).toHaveLength(1);
      expect(result[0].isPerishable()).toBe(true);
      expect(result[0].store_id).toBe(storeId);
    });

    it('should find items needing restock', async () => {
      const items = [
        Inventory.fake().anInventory().withStoreId(storeId).withQuantity(5).withMinStock(10).build(), // Needs restock
        Inventory.fake().anInventory().withStoreId(storeId).withQuantity(50).withMinStock(10).build(), // OK
        Inventory.fake().anInventory().withStoreId(otherStoreId).withQuantity(3).withMinStock(10).build(), // Different store
      ];
      repository.items = items;

      const result = await repository.findItemsNeedingRestock(storeId);
      expect(result).toHaveLength(1);
      expect(result[0].needsRestock()).toBe(true);
      expect(result[0].store_id).toBe(storeId);
    });
  });

  describe('multi-tenant isolation', () => {
    it('should ensure complete isolation between stores', async () => {
      const store1Items = [
        Inventory.fake().anInventory().withStoreId(storeId).withLocation('A-1-1').build(),
        Inventory.fake().anInventory().withStoreId(storeId).withLocation('A-2-1').build(),
      ];
      const store2Items = [
        Inventory.fake().anInventory().withStoreId(otherStoreId).withLocation('B-1-1').build(),
        Inventory.fake().anInventory().withStoreId(otherStoreId).withLocation('B-2-1').build(),
      ];
      repository.items = [...store1Items, ...store2Items];

      const store1Result = await repository.findByStoreId(storeId);
      expect(store1Result).toHaveLength(2);
      expect(store1Result.every(item => item.store_id === storeId)).toBe(true);

      const store2Result = await repository.findByStoreId(otherStoreId);
      expect(store2Result).toHaveLength(2);
      expect(store2Result.every(item => item.store_id === otherStoreId)).toBe(true);
    });
  });
});