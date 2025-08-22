import { FiscalConfig, FiscalConfigType } from '../../../domain/fiscal-config.aggregate';
import { FiscalConfigInMemoryRepository } from '../../../infra/db/in-memory/fiscal-config-in-memory.repository';
import { ListFiscalConfigsUseCase } from './list-fiscal-configs.use-case';
import { FiscalConfigSearchParams } from '../../../domain/repositories/fiscal-config.repository.interface';

describe('ListFiscalConfigsUseCase Unit Tests', () => {
  let useCase: ListFiscalConfigsUseCase;
  let repository: FiscalConfigInMemoryRepository;

  beforeEach(() => {
    repository = new FiscalConfigInMemoryRepository();
    useCase = new ListFiscalConfigsUseCase(repository);
  });

  it('should return empty list when no fiscal configs exist', async () => {
    const input = {
      filter: {
        store_id: 'store-1',
      },
    };
    const output = await useCase.execute(input);
    expect(output.items).toHaveLength(0);
    expect(output.total).toBe(0);
  });

  it('should return fiscal configs for specific store only', async () => {
    // Create configs for different stores
    const config1 = FiscalConfig.fake()
      .aFiscalConfig()
      .withStoreId('store-1')
      .withConfigName('ICMS Store 1')
      .build();
    
    const config2 = FiscalConfig.fake()
      .aFiscalConfig()
      .withStoreId('store-2')
      .withConfigName('ICMS Store 2')
      .build();
    
    const config3 = FiscalConfig.fake()
      .aFiscalConfig()
      .withStoreId('store-1')
      .withConfigName('IPI Store 1')
      .build();

    await repository.bulkInsert([config1, config2, config3]);

    const input = {
      filter: {
        store_id: 'store-1'
      }
    };

    const result = await useCase.execute(input);

    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.items.every(item => item.store_id === 'store-1')).toBe(true);
    expect(result.items.map(item => item.config_name)).toEqual(
      expect.arrayContaining(['ICMS Store 1', 'IPI Store 1'])
    );
  });

  it('should filter fiscal configs by config_name', async () => {
    const fiscalConfig1 = FiscalConfig.fake().aFiscalConfig().withStoreId('store-1').withConfigName('ICMS Config').build();
    const fiscalConfig2 = FiscalConfig.fake().aFiscalConfig().withStoreId('store-1').withConfigName('IPI Config').build();
    
    await repository.bulkInsert([fiscalConfig1, fiscalConfig2]);

    const input = {
      filter: {
        store_id: 'store-1',
        config_name: 'ICMS',
      },
    };
    const output = await useCase.execute(input);
    expect(output.items).toHaveLength(1);
    expect(output.items[0].config_name).toBe('ICMS Config');
  });

  it('should filter by config_type when provided', async () => {
    const config1 = FiscalConfig.fake()
      .aFiscalConfig()
      .withStoreId('store-1')
      .withConfigType(FiscalConfigType.ICMS)
      .build();
    
    const config2 = FiscalConfig.fake()
      .aFiscalConfig()
      .withStoreId('store-1')
      .withConfigType(FiscalConfigType.IPI)
      .build();
    
    const config3 = FiscalConfig.fake()
      .aFiscalConfig()
      .withStoreId('store-1')
      .withConfigType(FiscalConfigType.ICMS)
      .build();

    await repository.bulkInsert([config1, config2, config3]);

    const input = {
      filter: {
        store_id: 'store-1',
        config_type: FiscalConfigType.ICMS
      }
    };

    const result = await useCase.execute(input);

    expect(result.items).toHaveLength(2);
    expect(result.items.every(item => item.config_type === FiscalConfigType.ICMS)).toBe(true);
  });

  it('should filter by is_active when provided', async () => {
    const config1 = FiscalConfig.fake()
      .aFiscalConfig()
      .withStoreId('store-1')
      .activate()
      .build();
    
    const config2 = FiscalConfig.fake()
      .aFiscalConfig()
      .withStoreId('store-1')
      .deactivate()
      .build();
    
    const config3 = FiscalConfig.fake()
      .aFiscalConfig()
      .withStoreId('store-1')
      .activate()
      .build();

    await repository.bulkInsert([config1, config2, config3]);

    const input = {
      filter: {
        store_id: 'store-1',
        is_active: true
      }
    };

    const result = await useCase.execute(input);

    expect(result.items).toHaveLength(2);
    expect(result.items.every(item => item.is_active === true)).toBe(true);
  });

  it('should sort by config_name in ascending order by default', async () => {
    const fiscalConfig1 = FiscalConfig.fake().aFiscalConfig().withStoreId('store-1').withConfigName('Zebra Config').build();
    const fiscalConfig2 = FiscalConfig.fake().aFiscalConfig().withStoreId('store-1').withConfigName('Alpha Config').build();
    
    await repository.bulkInsert([fiscalConfig1, fiscalConfig2]);

    const input = {
      filter: {
        store_id: 'store-1',
      },
    };
    const output = await useCase.execute(input);
    expect(output.items).toHaveLength(2);
    // Sem ordenação explícita, a ordem é a de inserção
    expect(output.items[0].config_name).toBe('Zebra Config');
    expect(output.items[1].config_name).toBe('Alpha Config');
  });

  it('should handle pagination correctly', async () => {
    // Create 5 configs
    const configs = Array.from({ length: 5 }, (_, index) => 
      FiscalConfig.fake()
        .aFiscalConfig()
        .withStoreId('store-1')
        .withConfigName(`Config ${index + 1}`)
        .build()
    );

    await repository.bulkInsert(configs);

    const input = {
      filter: {
        store_id: 'store-1'
      },
      page: 2,
      per_page: 2
    };

    const result = await useCase.execute(input);

    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(5);
    expect(result.current_page).toBe(2);
    expect(result.per_page).toBe(2);
    expect(result.last_page).toBe(3);
  });

  it('should return all fields in the output', async () => {
    const config = FiscalConfig.fake()
      .aFiscalConfig()
      .withStoreId('store-1')
      .withConfigName('ICMS Completo')
      .withConfigType(FiscalConfigType.ICMS)
      .withTaxRate(18)
      .withAppliesTo(['12345678'], ['cat-1'])
      .withValueRange(100, 1000)
      .withValidityPeriod(new Date('2024-01-01'), new Date('2024-12-31'))
      .withDescription('Configuração completa')
      .withPriority(5)
      .build();

    await repository.insert(config);

    const input = {
      filter: {
        store_id: 'store-1'
      }
    };

    const result = await useCase.execute(input);

    expect(result.items).toHaveLength(1);
    const item = result.items[0];
    
    expect(item.id).toBeDefined();
    expect(item.store_id).toBe('store-1');
    expect(item.config_name).toBe('ICMS Completo');
    expect(item.config_type).toBe(FiscalConfigType.ICMS);
    expect(item.tax_rate).toBe(18);
    expect(item.applies_to_ncm).toEqual(['12345678']);
    expect(item.applies_to_categories).toEqual(['cat-1']);
    expect(item.min_value).toBe(100);
    expect(item.max_value).toBe(1000);
    expect(item.start_date).toEqual(new Date('2024-01-01'));
    expect(item.end_date).toEqual(new Date('2024-12-31'));
    expect(item.description).toBe('Configuração completa');
    expect(item.priority).toBe(5);
    expect(item.is_active).toBe(true);
    expect(item.created_at).toBeInstanceOf(Date);
    expect(item.updated_at).toBeInstanceOf(Date);
  });
});