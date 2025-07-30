import { Store, StoreStatus } from '../../../domain/store.aggregate';
import { StoreInMemoryRepository } from './store-in-memory.repository';
import { StoreSearchParams } from '../../../domain/repositories/store.repository.interface';

describe('StoreInMemoryRepository Unit Tests', () => {
  let repository: StoreInMemoryRepository;

  beforeEach(() => {
    repository = new StoreInMemoryRepository();
  });

  describe('findByCnpj', () => {
    test('should find store by CNPJ', async () => {
      const store = Store.create({
        name: 'Supermercado Central',
        cnpj: '12.345.678/0001-90',
      });
      await repository.insert(store);

      const foundStore = await repository.findByCnpj('12.345.678/0001-90');
      expect(foundStore).toEqual(store);
    });

    test('should return null when store not found', async () => {
      const foundStore = await repository.findByCnpj('99.999.999/0001-99');
      expect(foundStore).toBeNull();
    });
  });

  describe('findActiveStores', () => {
    test('should find only active stores', async () => {
      const activeStore = Store.create({
        name: 'Supermercado Ativo',
        cnpj: '12.345.678/0001-90',
      });
      activeStore.activate();

      const suspendedStore = Store.create({
        name: 'Supermercado Suspenso',
        cnpj: '98.765.432/0001-10',
      });
      suspendedStore.suspend();

      await repository.insert(activeStore);
      await repository.insert(suspendedStore);

      const activeStores = await repository.findActiveStores();
      expect(activeStores).toHaveLength(1);
      expect(activeStores[0]).toEqual(activeStore);
    });
  });

  describe('findByPlanType', () => {
    test('should find stores by plan type', async () => {
      const basicStore = Store.create({
        name: 'Supermercado Básico',
        cnpj: '12.345.678/0001-90',
        plan_type: 'BASIC',
      });

      const premiumStore = Store.create({
        name: 'Supermercado Premium',
        cnpj: '98.765.432/0001-10',
        plan_type: 'PREMIUM',
      });

      await repository.insert(basicStore);
      await repository.insert(premiumStore);

      const premiumStores = await repository.findByPlanType('PREMIUM');
      expect(premiumStores).toHaveLength(1);
      expect(premiumStores[0]).toEqual(premiumStore);
    });
  });

  describe('search', () => {
    test('should search stores with filter', async () => {
      const store1 = Store.create({
        name: 'Supermercado Central',
        cnpj: '12.345.678/0001-90',
      });

      const store2 = Store.create({
        name: 'Supermercado Norte',
        cnpj: '98.765.432/0001-10',
      });

      await repository.insert(store1);
      await repository.insert(store2);

      const searchParams = StoreSearchParams.create({
        filter: { name: 'Central' },
      });

      const result = await repository.search(searchParams);
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toEqual(store1);
    });
  });
});