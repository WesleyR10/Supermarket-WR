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
      const output = await useCase.execute({});

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
          location_code: 'A1-01',
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
          location_code: 'A2-01',
          is_active: true
        })
      ];

      // Simular diferentes datas de criação
      inventories[1].created_at = new Date(inventories[0].created_at.getTime() + 100);
      
      await repository.bulkInsert(inventories);

      const output = await useCase.execute({});

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
          location_code: `A${i + 1}-01`,
          is_active: true
        })
      );

      await repository.bulkInsert(inventories);

      const output = await useCase.execute({
        page: 1,
        per_page: 2
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
          location_code: 'A1-01',
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
          location_code: 'B1-01',
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
          location_code: 'A1-01',
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
          location_code: 'A2-01',
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
          location_code: 'A3-01',
          is_active: true
        })
      ];

      await repository.bulkInsert(inventories);

      const output = await useCase.execute({
        filter: { 
          quantity_min: 50,
          quantity_max: 100
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
          location_code: 'A1-01',
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
          location_code: 'A2-01',
          is_active: false
        })
      ];

      await repository.bulkInsert(inventories);

      const output = await useCase.execute({
        filter: { is_active: true }
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
          location_code: 'A1-01',
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
          location_code: 'A2-01',
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
          location_code: 'A3-01',
          is_active: true
        })
      ];

      await repository.bulkInsert(inventories);

      const output = await useCase.execute({
        sort: 'quantity',
        sort_dir: 'asc'
      });

      expect(output.items).toHaveLength(3);
      expect(output.items[0].quantity).toBe(25);
      expect(output.items[1].quantity).toBe(75);
      expect(output.items[2].quantity).toBe(100);
    });

    // Cenários específicos do supermercado
    describe('supermarket specific scenarios', () => {
      it('should filter low stock items for reorder alerts', async () => {
        const inventories = [
          Inventory.create({
            store_id: 'store-1',
            product_id: 'product-1',
            quantity: 5, // Abaixo do min_stock
            min_stock: 10,
            max_stock: 200,
            unit_cost: 10.00,
            unit_price: 15.00,
            location_code: 'A1-01',
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
            location_code: 'A2-01',
            is_active: true
          })
        ];

        await repository.bulkInsert(inventories);

        const output = await useCase.execute({
          filter: { low_stock: true }
        });

        expect(output.items).toHaveLength(1);
        expect(output.items[0].quantity).toBeLessThan(output.items[0].min_stock);
      });

      it('should filter by location for stock management', async () => {
        const inventories = [
          Inventory.create({
            store_id: 'store-1',
            product_id: 'product-1',
            quantity: 100,
            min_stock: 10,
            max_stock: 200,
            unit_cost: 10.00,
            unit_price: 15.00,
            location_code: 'A1-01',
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
            location_code: 'B1-01',
            is_active: true
          })
        ];

        await repository.bulkInsert(inventories);

        const output = await useCase.execute({
          filter: { location_code: 'A1-01' }
        });

        expect(output.items).toHaveLength(1);
        expect(output.items[0].location_code).toBe('A1-01');
      });

      it('should filter by price range for promotional campaigns', async () => {
        const inventories = [
          Inventory.create({
            store_id: 'store-1',
            product_id: 'product-1',
            quantity: 100,
            min_stock: 10,
            max_stock: 200,
            unit_cost: 10.00,
            unit_price: 15.00,
            location_code: 'A1-01',
            is_active: true
          }),
          Inventory.create({
            store_id: 'store-1',
            product_id: 'product-2',
            quantity: 50,
            min_stock: 5,
            max_stock: 100,
            unit_cost: 5.00,
            unit_price: 25.00,
            location_code: 'A2-01',
            is_active: true
          })
        ];

        await repository.bulkInsert(inventories);

        const output = await useCase.execute({
          filter: { 
            unit_price_min: 10.00,
            unit_price_max: 20.00
          }
        });

        expect(output.items).toHaveLength(1);
        expect(output.items[0].unit_price).toBe(15.00);
      });
    });

    // Testes de integração com repositório
    describe('repository integration', () => {
      it('should call repository search method with correct params', async () => {
        const searchSpy = jest.spyOn(repository, 'search');

        await useCase.execute({
          page: 2,
          per_page: 10,
          sort: 'quantity',
          sort_dir: 'desc',
          filter: { store_id: 'store-1' }
        });

        expect(searchSpy).toHaveBeenCalledTimes(1);
        const calledParams = searchSpy.mock.calls[0][0];
        expect(calledParams.page).toBe(2);
        expect(calledParams.per_page).toBe(10);
        expect(calledParams.sort).toBe('quantity');
        expect(calledParams.sort_dir).toBe('desc');
        expect(calledParams.filter).toEqual({ store_id: 'store-1' });
      });
    });
  });
});