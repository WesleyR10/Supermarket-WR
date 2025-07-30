import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';
import { EntityValidationError } from '../../../../../shared/domain/validators/validation.error';
import { StoreInMemoryRepository } from '../../../../infra/db/in-memory/store-in-memory.repository';
import { Store, StoreId } from '../../../../domain/store.aggregate';
import { UpdateStoreUseCase } from '../update-store.use-case';
import { UpdateStoreInput } from '../update-store.input';

describe('UpdateStoreUseCase Unit Tests', () => {
  let useCase: UpdateStoreUseCase;
  let repository: StoreInMemoryRepository;

  beforeEach(() => {
    repository = new StoreInMemoryRepository();
    useCase = new UpdateStoreUseCase(repository);
  });

  it('should throw error when store not found', async () => {
    const storeId = new StoreId();
    const input = new UpdateStoreInput({
      id: storeId.id,
      name: 'Updated Store Name',
    });

    await expect(() => useCase.execute(input)).rejects.toThrow(
      new NotFoundError(storeId.id, Store)
    );
  });

  it('should update store name', async () => {
    const store = Store.fake().aStore().build();
    repository.items = [store];
    const spyUpdate = jest.spyOn(repository, 'update');

    const input = new UpdateStoreInput({
      id: store.store_id.id,
      name: 'Updated Store Name',
    });

    const output = await useCase.execute(input);

    expect(spyUpdate).toHaveBeenCalledTimes(1);
    expect(output).toStrictEqual({
      id: store.store_id.id,
      name: 'Updated Store Name',
      cnpj: store.cnpj,
      status: store.status,
      settings: store.settings,
      subscription: store.subscription,
      created_at: store.created_at,
      updated_at: store.updated_at,
    });
  });

  it('should update store settings', async () => {
    const store = Store.fake().aStore().build();
    repository.items = [store];
    const spyUpdate = jest.spyOn(repository, 'update');

    const validSettings = {
      business_hours: {
        monday: { open: '09:00', close: '17:00', closed: false },
        tuesday: { open: '09:00', close: '17:00', closed: false },
        wednesday: { open: '09:00', close: '17:00', closed: false },
        thursday: { open: '09:00', close: '17:00', closed: false },
        friday: { open: '09:00', close: '17:00', closed: false },
        saturday: { open: '09:00', close: '14:00', closed: false },
        sunday: { open: '00:00', close: '00:00', closed: true }
      },
      sales_config: {
        allow_negative_stock: false,
        auto_approve_sales: true,
        max_discount_percentage: 15,
        require_customer_identification: true
      },
      inventory_config: {
        low_stock_threshold: 20,
        auto_reorder: true,
        track_expiry_dates: true
      }
    };

    const input = new UpdateStoreInput({
      id: store.store_id.id,
      settings: validSettings,
    });

    const output = await useCase.execute(input);

    expect(spyUpdate).toHaveBeenCalledTimes(1);
    expect(output.settings).toMatchObject(validSettings);
  });

  it('should update store subscription', async () => {
    const store = Store.fake().aStore().build();
    repository.items = [store];
    const spyUpdate = jest.spyOn(repository, 'update');

    const validSubscription = {
      plan_type: 'PREMIUM' as const,
      features: {
        max_products: 5000,
        max_employees: 20,
        max_sales_per_month: 10000,
        advanced_reports: true,
        multi_location: true,
        api_access: true
      },
      billing_info: {
        amount: 199.90,
        currency: 'BRL',
        billing_cycle: 'MONTHLY' as const,
        next_billing_date: new Date('2024-02-01')
      }
    };

    const input = new UpdateStoreInput({
      id: store.store_id.id,
      subscription: validSubscription,
    });

    const output = await useCase.execute(input);

    expect(spyUpdate).toHaveBeenCalledTimes(1);
    expect(output.subscription).toMatchObject(validSubscription);
  });

  it('should throw EntityValidationError with invalid data', async () => {
    const store = Store.fake().aStore().build();
    repository.items = [store];

    const input = new UpdateStoreInput({
      id: store.store_id.id,
      name: '', // Nome vazio - inválido
    });

    await expect(() => useCase.execute(input)).rejects.toThrow(
      EntityValidationError
    );
  });

  it('should throw EntityValidationError with invalid settings', async () => {
    const store = Store.fake().aStore().build();
    repository.items = [store];

    const invalidSettings = {
      sales_config: {
        max_discount_percentage: 150, // Valor inválido (> 100)
      },
      inventory_config: {
        low_stock_threshold: -5, // Valor inválido (<= 0)
      }
    };

    const input = new UpdateStoreInput({
      id: store.store_id.id,
      settings: invalidSettings,
    });

    await expect(() => useCase.execute(input)).rejects.toThrow(
      EntityValidationError
    );
  });
});