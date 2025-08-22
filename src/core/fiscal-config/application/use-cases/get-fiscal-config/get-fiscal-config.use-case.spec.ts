import { FiscalConfig, FiscalConfigId } from '../../../domain/fiscal-config.aggregate';
import { FiscalConfigInMemoryRepository } from '../../../infra/db/in-memory/fiscal-config-in-memory.repository';
import { GetFiscalConfigUseCase } from './get-fiscal-config.use-case';
import { NotFoundError } from '@core/shared/domain/errors/not-found.error';
import { InvalidUuidError } from '@core/shared/domain/value-objects/uuid.vo';
import { EntityValidationError } from '@core/shared/domain/validators/validation.error';

describe('GetFiscalConfigUseCase Unit Tests', () => {
  let useCase: GetFiscalConfigUseCase;
  let repository: FiscalConfigInMemoryRepository;

  beforeEach(() => {
    repository = new FiscalConfigInMemoryRepository();
    useCase = new GetFiscalConfigUseCase(repository);
  });

  it('should throw error when fiscal config id is invalid', async () => {
    await expect(() =>
      useCase.execute({ id: 'invalid-id', store_id: 'store-1' })
    ).rejects.toThrow(new InvalidUuidError());
  });

  it('should throw error when fiscal config not found', async () => {
    const fiscalConfigId = new FiscalConfigId();
    await expect(() =>
      useCase.execute({ id: fiscalConfigId.id, store_id: 'store-1' })
    ).rejects.toThrow(
      new NotFoundError(fiscalConfigId.id, FiscalConfig)
    );
  });

  it('should throw error when fiscal config belongs to different store', async () => {
    const fiscalConfig = FiscalConfig.fake()
      .aFiscalConfig()
      .withStoreId('store-1')
      .build();
    
    await repository.insert(fiscalConfig);

    await expect(() =>
      useCase.execute({ 
        id: fiscalConfig.fiscal_config_id.id, 
        store_id: 'store-2' 
      })
    ).rejects.toThrow(EntityValidationError);
  });

  it('should return fiscal config when found and belongs to correct store', async () => {
    const fiscalConfig = FiscalConfig.fake()
      .aFiscalConfig()
      .withStoreId('store-1')
      .withConfigName('ICMS Padrão')
      .withTaxRate(18)
      .build();
    
    await repository.insert(fiscalConfig);

    const result = await useCase.execute({ 
      id: fiscalConfig.fiscal_config_id.id, 
      store_id: 'store-1' 
    });

    expect(result).toEqual({
      id: fiscalConfig.fiscal_config_id.id,
      store_id: fiscalConfig.store_id,
      config_name: fiscalConfig.config_name,
      config_type: fiscalConfig.config_type,
      tax_rate: fiscalConfig.tax_rate,
      applies_to_ncm: fiscalConfig.applies_to_ncm,
      applies_to_categories: fiscalConfig.applies_to_categories,
      min_value: fiscalConfig.min_value,
      max_value: fiscalConfig.max_value,
      start_date: fiscalConfig.start_date,
      end_date: fiscalConfig.end_date,
      is_active: fiscalConfig.is_active,
      priority: fiscalConfig.priority,
      description: fiscalConfig.description,
      metadata: fiscalConfig.metadata,
      created_at: fiscalConfig.created_at,
      updated_at: fiscalConfig.updated_at
    });
  });

  it('should return fiscal config with all optional fields when they exist', async () => {
    const fiscalConfig = FiscalConfig.fake()
      .aFiscalConfig()
      .withStoreId('store-1')
      .withConfigName('ICMS Específico')
      .withTaxRate(12)
      .withAppliesTo(['12345678', '87654321'], ['cat-1', 'cat-2'])
      .withValueRange(100, 1000)
      .withValidityPeriod(new Date('2024-01-01'), new Date('2024-12-31'))
      .withDescription('Configuração específica para produtos importados')
      .build();
    
    await repository.insert(fiscalConfig);

    const result = await useCase.execute({ 
      id: fiscalConfig.fiscal_config_id.id, 
      store_id: 'store-1' 
    });

    expect(result.applies_to_ncm).toEqual(['12345678', '87654321']);
    expect(result.applies_to_categories).toEqual(['cat-1', 'cat-2']);
    expect(result.min_value).toBe(100);
    expect(result.max_value).toBe(1000);
    expect(result.start_date).toEqual(new Date('2024-01-01'));
    expect(result.end_date).toEqual(new Date('2024-12-31'));
    expect(result.description).toBe('Configuração específica para produtos importados');
  });
});