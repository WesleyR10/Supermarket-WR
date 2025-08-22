import { FiscalConfig, FiscalConfigId, FiscalConfigType } from '../../../domain/fiscal-config.aggregate';
import { FiscalConfigInMemoryRepository } from '../../../infra/db/in-memory/fiscal-config-in-memory.repository';
import { UpdateFiscalConfigUseCase } from './update-fiscal-config.use-case';
import { EntityValidationError } from '@core/shared/domain/validators/validation.error';
import { NotFoundError } from '@core/shared/domain/errors/not-found.error';

describe('UpdateFiscalConfigUseCase Unit Tests', () => {
  let useCase: UpdateFiscalConfigUseCase;
  let repository: FiscalConfigInMemoryRepository;

  beforeEach(() => {
    repository = new FiscalConfigInMemoryRepository();
    useCase = new UpdateFiscalConfigUseCase(repository);
  });

  it('should throw error when fiscal config not found', async () => {
    const fakeId = '550e8400-e29b-41d4-a716-446655440000';
    const input = {
      id: fakeId,
      store_id: 'store-1',
      config_name: 'Updated Config',
    };

    await expect(() => useCase.execute(input)).rejects.toThrow(
      new NotFoundError(fakeId, FiscalConfig)
    );
  });

  it('should throw error when fiscal config belongs to different store', async () => {
    const fiscalConfig = FiscalConfig.fake()
      .aFiscalConfig()
      .withStoreId('store-1')
      .build();
    
    await repository.insert(fiscalConfig);

    const input = {
      id: fiscalConfig.fiscal_config_id.id,
      store_id: 'store-2',
      config_name: 'Updated Config',
    };

    await expect(() => useCase.execute(input)).rejects.toThrow(
      EntityValidationError
    );
  });

  it('should update fiscal config with valid data', async () => {
    const fiscalConfig = FiscalConfig.fake()
      .aFiscalConfig()
      .withStoreId('store-1')
      .withConfigName('Original Config')
      .withTaxRate(10)
      .build();
    
    await repository.insert(fiscalConfig);

    const input = {
      id: fiscalConfig.fiscal_config_id.id,
      store_id: 'store-1',
      config_name: 'Updated Config',
      tax_rate: 15,
    };

    const result = await useCase.execute(input);

    expect(result.id).toBe(fiscalConfig.fiscal_config_id.id);
    expect(result.config_name).toBe('Updated Config');
    expect(result.tax_rate).toBe(15);
    expect(result.store_id).toBe('store-1');

    const updatedFiscalConfig = await repository.findById(new FiscalConfigId(result.id));
    expect(updatedFiscalConfig!.config_name).toBe('Updated Config');
    expect(updatedFiscalConfig!.tax_rate).toBe(15);
  });

  it('should update fiscal config with optional fields', async () => {
    const fiscalConfig = FiscalConfig.fake()
      .aFiscalConfig()
      .withStoreId('store-1')
      .build();
    
    await repository.insert(fiscalConfig);

    const input = {
      id: fiscalConfig.fiscal_config_id.id,
      store_id: 'store-1',
      config_name: 'Updated Config',
      config_type: FiscalConfigType.IPI,
      tax_rate: 5,
      applies_to_ncm: ['12345678'],
      applies_to_categories: ['category-1'],
      min_value: 100,
      max_value: 1000,
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-12-31'),
      is_active: false,
      priority: 5,
      description: 'Updated description',
    };

    const result = await useCase.execute(input);

    expect(result.config_type).toBe(FiscalConfigType.IPI);
    expect(result.applies_to_ncm).toEqual(['12345678']);
    expect(result.applies_to_categories).toEqual(['category-1']);
    expect(result.min_value).toBe(100);
    expect(result.max_value).toBe(1000);
    expect(result.start_date).toEqual(new Date('2024-01-01'));
    expect(result.end_date).toEqual(new Date('2024-12-31'));
    expect(result.is_active).toBe(false);
    expect(result.priority).toBe(5);
    expect(result.description).toBe('Updated description');
  });

  it('should throw error when config_name is empty', async () => {
    const input = {
      id: 'valid-id',
      store_id: 'store-1',
      config_name: '',
    };

    await expect(() => useCase.execute(input)).rejects.toThrow(
      EntityValidationError
    );
  });

  it('should throw error when tax_rate is negative', async () => {
    const input = {
      id: 'valid-id',
      store_id: 'store-1',
      config_name: 'Valid Config',
      tax_rate: -5,
    };

    await expect(() => useCase.execute(input)).rejects.toThrow(
      EntityValidationError
    );
  });

  it('should update updated_at timestamp', async () => {
    const fiscalConfig = FiscalConfig.fake()
      .aFiscalConfig()
      .withStoreId('store-1')
      .build();
    
    const originalUpdatedAt = fiscalConfig.updated_at;
    await repository.insert(fiscalConfig);

    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const input = {
      id: fiscalConfig.fiscal_config_id.id,
      store_id: 'store-1',
      config_name: 'Updated Config',
    };

    const result = await useCase.execute(input);

    expect(new Date(result.updated_at).getTime()).toBeGreaterThan(
      originalUpdatedAt.getTime()
    );
  });
});