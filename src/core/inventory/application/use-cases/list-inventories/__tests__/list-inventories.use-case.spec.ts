import { ListInventoriesUseCase } from '../list-inventories.use-case';
import { InventoryInMemoryRepository } from '../../../../infra/db/in-memory/inventory-in-memory.repository';
import { Inventory } from '../../../../domain/inventory.aggregate';

describe('ListInventoriesUseCase Unit Tests', () => {
  let useCase: ListInventoriesUseCase;
  let repository: InventoryInMemoryRepository;

  beforeEach(() => {
    repository = new InventoryInMemoryRepository();
    useCase = new ListInventoriesUseCase(repository);
  });

  describe('execute method', () => {
    it('should return empty list when no inventories exist', async () => {
      const output = await useCase.execute({
        filter: { store_id: 'store-1' }
      });

      expect(output.items).toHaveLength(0);
      expect(output.total).toBe(0);
      expect(output.current_page).toBe(1);
      expect(output.per_page).toBe(15);
      expect(output.last_page).toBe(0);
    });

    it('should list inventories sorted by created_at when input is empty', async () => {
      const inventories = [
        Inventory.create({
          store_id: 'store-1',
          product_id: 'product-1',
          quantity: 100,
          min_stock: 10,
          max_stock: 200,
          unit_cost: 10.00,
          unit_price: 15.00,
          location: 'A-1-1', // Formato correto
          is_active: true
        }),
        Inventory.create({
          store_id: 'store-1',
          product_id: 'product-2',
          quantity: 50,
          min_stock: 5,
          max_stock: 100,
          unit_cost: 5.00,
          unit_price: 8.00,
          location: 'A-2-1', // Formato correto
          is_active: true
        })
      ];

      // Simular diferentes datas de criação
      inventories[1].created_at = new Date(inventories[0].created_at.getTime() + 100);
      
      await repository.bulkInsert(inventories);

      const output = await useCase.execute({
        filter: { store_id: 'store-1' }
      });

      expect(output.items).toHaveLength(2);
      expect(output.total).toBe(2);
      expect(output.current_page).toBe(1);
      expect(output.per_page).toBe(15);
      expect(output.last_page).toBe(1);
      
      // Deve estar ordenado por created_at desc (mais recente primeiro)
      expect(output.items[0].id).toBe(inventories[1].inventory_item_id.id);
      expect(output.items[1].id).toBe(inventories[0].inventory_item_id.id);
    });

    it('should apply pagination correctly', async () => {
      const inventories = Array.from({ length: 5 }, (_, i) => 
        Inventory.create({
          store_id: 'store-1',
          product_id: `product-${i + 1}`,
          quantity: 100,
          min_stock: 10,
          max_stock: 200,
          unit_cost: 10.00,
          unit_price: 15.00,
          location: `A-${i + 1}-1`, // Formato correto
          is_active: true
        })
      );

      await repository.bulkInsert(inventories);

      const output = await useCase.execute({
        page: 1,
        per_page: 2,
        filter: { store_id: 'store-1' }
      });

      expect(output.items).toHaveLength(2);
      expect(output.total).toBe(5);
      expect(output.current_page).toBe(1);
      expect(output.per_page).toBe(2);
      expect(output.last_page).toBe(3);
    });

    it('should filter by store_id', async () => {
      const inventories = [
        Inventory.create({
          store_id: 'store-1',
          product_id: 'product-1',
          quantity: 100,
          min_stock: 10,
          max_stock: 200,
          unit_cost: 10.00,
          unit_price: 15.00,
          location: 'A-1-1', // Formato correto
          is_active: true
        }),
        Inventory.create({
          store_id: 'store-2',
          product_id: 'product-2',
          quantity: 50,
          min_stock: 5,
          max_stock: 100,
          unit_cost: 5.00,
          unit_price: 8.00,
          location: 'B-1-1', // Formato correto
          is_active: true
        })
      ];

      await repository.bulkInsert(inventories);

      const output = await useCase.execute({
        filter: { store_id: 'store-1' }
      });

      expect(output.items).toHaveLength(1);
      expect(output.items[0].store_id).toBe('store-1');
    });

    it('should filter by quantity range', async () => {
      const inventories = [
        Inventory.create({
          store_id: 'store-1',
          product_id: 'product-1',
          quantity: 25,
          min_stock: 10,
          max_stock: 200,
          unit_cost: 10.00,
          unit_price: 15.00,
          location: 'A-1-1', // Formato correto
          is_active: true
        }),
        Inventory.create({
          store_id: 'store-1',
          product_id: 'product-2',
          quantity: 75,
          min_stock: 5,
          max_stock: 100,
          unit_cost: 5.00,
          unit_price: 8.00,
          location: 'A-2-1', // Formato correto
          is_active: true
        }),
        Inventory.create({
          store_id: 'store-1',
          product_id: 'product-3',
          quantity: 150,
          min_stock: 20,
          max_stock: 300,
          unit_cost: 15.00,
          unit_price: 22.00,
          location: 'A-3-1', // Formato correto
          is_active: true
        })
      ];

      await repository.bulkInsert(inventories);

      const output = await useCase.execute({
        filter: { 
          store_id: 'store-1',
          min_quantity: 50,
          max_quantity: 100
        }
      });

      expect(output.items).toHaveLength(1);
      expect(output.items[0].quantity).toBe(75);
    });

    it('should filter by is_active status', async () => {
      const inventories = [
        Inventory.create({
          store_id: 'store-1',
          product_id: 'product-1',
          quantity: 100,
          min_stock: 10,
          max_stock: 200,
          unit_cost: 10.00,
          unit_price: 15.00,
          location: 'A-1-1', // Formato correto
          is_active: true
        }),
        Inventory.create({
          store_id: 'store-1',
          product_id: 'product-2',
          quantity: 50,
          min_stock: 5,
          max_stock: 100,
          unit_cost: 5.00,
          unit_price: 8.00,
          location: 'A-2-1', // Formato correto
          is_active: false
        })
      ];

      await repository.bulkInsert(inventories);

      const output = await useCase.execute({
        filter: { 
          store_id: 'store-1',
          is_active: true 
        }
      });

      expect(output.items).toHaveLength(1);
      expect(output.items[0].is_active).toBe(true);
    });

    it('should sort by quantity ascending', async () => {
      const inventories = [
        Inventory.create({
          store_id: 'store-1',
          product_id: 'product-1',
          quantity: 100,
          min_stock: 10,
          max_stock: 200,
          unit_cost: 10.00,
          unit_price: 15.00,
          location: 'A-1-1', // Formato correto
          is_active: true
        }),
        Inventory.create({
          store_id: 'store-1',
          product_id: 'product-2',
          quantity: 25,
          min_stock: 5,
          max_stock: 100,
          unit_cost: 5.00,
          unit_price: 8.00,
          location: 'A-2-1', // Formato correto
          is_active: true
        }),
        Inventory.create({
          store_id: 'store-1',
          product_id: 'product-3',
          quantity: 75,
          min_stock: 15,
          max_stock: 150,
          unit_cost: 8.00,
          unit_price: 12.00,
          location: 'A-3-1', // Formato correto
          is_active: true
        })
      ];

      await repository.bulkInsert(inventories);

      const output = await useCase.execute({
        sort: 'quantity',
        sort_dir: 'asc',
        filter: { store_id: 'store-1' }
      });

      expect(output.items).toHaveLength(3);
      expect(output.items[0].quantity).toBe(25);
      expect(output.items[1].quantity).toBe(75);
      expect(output.items[2].quantity).toBe(100);
    });

    it('should sort by created_at descending (default)', async () => {
      const inventories = [
        Inventory.create({
          store_id: 'store-1',
          product_id: 'product-1',
          quantity: 100,
          min_stock: 10,
          max_stock: 200,
          unit_cost: 10.00,
          unit_price: 15.00,
          location: 'A-1-1', // Formato correto
          is_active: true
        }),
        Inventory.create({
          store_id: 'store-1',
          product_id: 'product-2',
          quantity: 50,
          min_stock: 5,
          max_stock: 100,
          unit_cost: 5.00,
          unit_price: 8.00,
          location: 'A-2-1', // Formato correto
          is_active: true
        })
      ];

      // Definir datas diferentes
      inventories[0].created_at = new Date('2023-01-01');
      inventories[1].created_at = new Date('2023-01-02');

      await repository.bulkInsert(inventories);

      const output = await useCase.execute({
        filter: { store_id: 'store-1' }
      });

      expect(output.items).toHaveLength(2);
      // Primeiro item deve ser o mais recente
      expect(output.items[0].id).toBe(inventories[1].inventory_item_id.id);
      expect(output.items[1].id).toBe(inventories[0].inventory_item_id.id);
    });

    it('should handle pagination with sort', async () => {
      const inventories = Array.from({ length: 10 }, (_, i) => 
        Inventory.create({
          store_id: 'store-1',
          product_id: `product-${i + 1}`,
          quantity: (i + 1) * 10, // 10, 20, 30, ...
          min_stock: 5,
          max_stock: 200,
          unit_cost: 10.00,
          unit_price: 15.00,
          location: `A-${i + 1}-1`, // Formato correto
          is_active: true
        })
      );

      await repository.bulkInsert(inventories);

      const output = await useCase.execute({
        page: 2,
        per_page: 3,
        sort: 'quantity',
        sort_dir: 'asc',
        filter: { store_id: 'store-1' }
      });

      expect(output.items).toHaveLength(3);
      expect(output.current_page).toBe(2);
      expect(output.per_page).toBe(3);
      expect(output.total).toBe(10);
      // Segunda página deve ter quantidades 40, 50, 60
      expect(output.items[0].quantity).toBe(40);
      expect(output.items[1].quantity).toBe(50);
      expect(output.items[2].quantity).toBe(60);
    });

    it('should ensure store isolation in multi-tenant environment', async () => {
      const store1Inventories = [
        Inventory.create({
          store_id: 'store-1',
          product_id: 'product-1',
          quantity: 100,
          min_stock: 10,
          max_stock: 200,
          unit_cost: 10.00,
          unit_price: 15.00,
          location: 'A-1-1', // Formato correto
          is_active: true
        }),
        Inventory.create({
          store_id: 'store-1',
          product_id: 'product-2',
          quantity: 50,
          min_stock: 5,
          max_stock: 100,
          unit_cost: 5.00,
          unit_price: 8.00,
          location: 'A-2-1', // Formato correto
          is_active: true
        })
      ];

      const store2Inventories = [
        Inventory.create({
          store_id: 'store-2',
          product_id: 'product-3',
          quantity: 75,
          min_stock: 15,
          max_stock: 150,
          unit_cost: 8.00,
          unit_price: 12.00,
          location: 'B-1-1', // Formato correto
          is_active: true
        })
      ];

      await repository.bulkInsert([...store1Inventories, ...store2Inventories]);

      // Testar isolamento store-1
      const output1 = await useCase.execute({
        filter: { store_id: 'store-1' }
      });

      expect(output1.items).toHaveLength(2);
      expect(output1.items.every(item => item.store_id === 'store-1')).toBe(true);

      // Testar isolamento store-2
      const output2 = await useCase.execute({
        filter: { store_id: 'store-2' }
      });

      expect(output2.items).toHaveLength(1);
      expect(output2.items.every(item => item.store_id === 'store-2')).toBe(true);
    });
  });
});