import { NotFoundError } from '@core/shared/domain/errors/not-found.error';
import { EntityValidationError } from '@core/shared/domain/validators/validation.error';
import { FiscalConfig, FiscalConfigId } from '../../../../domain/fiscal-config.aggregate';
import { FiscalConfigInMemoryRepository } from '../../../../infra/db/in-memory/fiscal-config-in-memory.repository';
import { DeleteFiscalConfigUseCase, DeleteFiscalConfigInput } from '../delete-fiscal-config.use-case';

describe('DeleteFiscalConfigUseCase Unit Tests', () => {
  let useCase: DeleteFiscalConfigUseCase;
  let repository: FiscalConfigInMemoryRepository;

  beforeEach(() => {
    repository = new FiscalConfigInMemoryRepository();
    useCase = new DeleteFiscalConfigUseCase(repository);
  });

  it('should throw error when fiscal config not found', async () => {
    const fiscalConfigId = new FiscalConfigId();
    const input: DeleteFiscalConfigInput = {
      id: fiscalConfigId.id,
      store_id: 'store-123'
    };

    await expect(() => useCase.execute(input)).rejects.toThrow(
      new NotFoundError(fiscalConfigId.id, FiscalConfig)
    );
  });

  it('should throw error when fiscal config belongs to different store', async () => {
    const fiscalConfig = FiscalConfig.fake()
      .aFiscalConfig()
      .withStoreId('store-456')
      .build();
    
    await repository.insert(fiscalConfig);

    const input: DeleteFiscalConfigInput = {
      id: fiscalConfig.fiscal_config_id.id,
      store_id: 'store-123' // Different store
    };

    await expect(() => useCase.execute(input)).rejects.toThrow(
      EntityValidationError
    );
  });

  it('should delete fiscal config successfully', async () => {
    const fiscalConfig = FiscalConfig.fake()
      .aFiscalConfig()
      .withStoreId('store-123')
      .deactivate() // Inactive so it can be deleted
      .build();
    
    await repository.insert(fiscalConfig);
    expect(repository.items).toHaveLength(1);

    const input: DeleteFiscalConfigInput = {
      id: fiscalConfig.fiscal_config_id.id,
      store_id: 'store-123'
    };

    const result = await useCase.execute(input);

    expect(result.deleted).toBe(true);
    expect(result.id).toBe(fiscalConfig.fiscal_config_id.id);
    expect(repository.items).toHaveLength(0);
  });

  it('should delete only the specified fiscal config', async () => {
    const fiscalConfig1 = FiscalConfig.fake()
      .aFiscalConfig()
      .withStoreId('store-123')
      .withConfigName('Config 1')
      .deactivate() // Inactive so it can be deleted
      .build();
    
    const fiscalConfig2 = FiscalConfig.fake()
      .aFiscalConfig()
      .withStoreId('store-123')
      .withConfigName('Config 2')
      .build();
    
    await repository.insert(fiscalConfig1);
    await repository.insert(fiscalConfig2);
    expect(repository.items).toHaveLength(2);

    const input: DeleteFiscalConfigInput = {
      id: fiscalConfig1.fiscal_config_id.id,
      store_id: 'store-123'
    };

    const result = await useCase.execute(input);

    expect(result.deleted).toBe(true);
    expect(repository.items).toHaveLength(1);
    expect(repository.items[0].fiscal_config_id.id).toBe(fiscalConfig2.fiscal_config_id.id);
  });

  it('should not delete fiscal config from different store even with same id', async () => {
    const fiscalConfig1 = FiscalConfig.fake()
      .aFiscalConfig()
      .withStoreId('store-123')
      .build();
    
    const fiscalConfig2 = FiscalConfig.fake()
      .aFiscalConfig()
      .withStoreId('store-456')
      .build();
    
    await repository.insert(fiscalConfig1);
    await repository.insert(fiscalConfig2);
    expect(repository.items).toHaveLength(2);

    const input: DeleteFiscalConfigInput = {
      id: fiscalConfig2.fiscal_config_id.id,
      store_id: 'store-123' // Different store
    };

    await expect(() => useCase.execute(input)).rejects.toThrow(
      EntityValidationError
    );

    // Both configs should still exist
    expect(repository.items).toHaveLength(2);
  });

  it('should throw error when trying to delete active fiscal config', async () => {
    const fiscalConfig = FiscalConfig.fake()
      .aFiscalConfig()
      .withStoreId('store-123')
      .activate() // Active config cannot be deleted
      .build();
    await repository.insert(fiscalConfig);

    const input: DeleteFiscalConfigInput = {
      id: fiscalConfig.fiscal_config_id.id,
      store_id: 'store-123'
    };

    await expect(() => useCase.execute(input)).rejects.toThrow(
      EntityValidationError
    );
    expect(repository.items).toHaveLength(1); // Config should still exist
  });
});