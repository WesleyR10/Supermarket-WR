import { Store, StoreId, StoreStatus } from '../store.aggregate';

describe('Store Aggregate Unit Tests', () => {
  describe('constructor', () => {
    test('should create store with default values', () => {
      const store = new Store({
        name: 'Supermercado Central',
        cnpj: '12.345.678/0001-90',
      });

      expect(store.store_id).toBeInstanceOf(StoreId);
      expect(store.name).toBe('Supermercado Central');
      expect(store.cnpj).toBe('12.345.678/0001-90');
      expect(store.status).toBe(StoreStatus.PENDING_ACTIVATION);
      expect(store.settings).toBeDefined();
      expect(store.subscription).toBeDefined();
      expect(store.created_at).toBeInstanceOf(Date);
      expect(store.updated_at).toBeInstanceOf(Date);
    });
  });

  describe('create command', () => {
    test('should create store with validation', () => {
      const store = Store.create({
        name: 'Supermercado Central',
        cnpj: '12.345.678/0001-90',
      });

      expect(store).toBeInstanceOf(Store);
      expect(store.name).toBe('Supermercado Central');
      expect(store.cnpj).toBe('12.345.678/0001-90');
    });

    test('should create store with custom settings', () => {
      const store = Store.create({
        name: 'Supermercado Premium',
        cnpj: '98.765.432/0001-10',
        plan_type: 'PREMIUM',
        is_trial: false,
        sales_config: {
          allow_negative_stock: true,
          max_discount_percentage: 20,
        },
      });

      expect(store.subscription.plan_type).toBe('PREMIUM');
      expect(store.subscription.is_trial).toBe(false);
      expect(store.settings.sales_config.allow_negative_stock).toBe(true);
      expect(store.settings.sales_config.max_discount_percentage).toBe(20);
    });
  });

  describe('status methods', () => {
    test('should activate store', () => {
      const store = Store.create({
        name: 'Supermercado Central',
        cnpj: '12.345.678/0001-90',
      });

      store.activate();
      expect(store.status).toBe(StoreStatus.ACTIVE);
    });

    test('should suspend store', () => {
      const store = Store.create({
        name: 'Supermercado Central',
        cnpj: '12.345.678/0001-90',
      });

      store.activate();
      store.suspend();
      expect(store.status).toBe(StoreStatus.SUSPENDED);
    });

    test('should cancel store', () => {
      const store = Store.create({
        name: 'Supermercado Central',
        cnpj: '12.345.678/0001-90',
      });

      store.cancel();
      expect(store.status).toBe(StoreStatus.CANCELLED);
    });
  });

  describe('validation methods', () => {
    test('should check if store is active', () => {
      const store = Store.create({
        name: 'Supermercado Central',
        cnpj: '12.345.678/0001-90',
      });

      expect(store.isActive()).toBe(false);
      store.activate();
      expect(store.isActive()).toBe(true);
    });

    test('should check if store can operate', () => {
      const store = Store.create({
        name: 'Supermercado Central',
        cnpj: '12.345.678/0001-90',
      });

      expect(store.canOperate()).toBe(false);
      store.activate();
      expect(store.canOperate()).toBe(true);
    });
  });
});