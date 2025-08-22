import { FiscalConfigInMemoryRepository } from '../fiscal-config-in-memory.repository';
import { FiscalConfigType } from '../../../../domain/fiscal-config.aggregate';
import { FiscalConfigFakeBuilder } from '../../../../domain/fiscal-config-fake.builder';
import { FiscalConfigSearchParams } from '../../../../domain/repositories/fiscal-config.repository.interface';

describe('FiscalConfigInMemoryRepository', () => {
  let repository: FiscalConfigInMemoryRepository;

  beforeEach(() => {
    repository = new FiscalConfigInMemoryRepository();
  });

  describe('findByStoreId', () => {
    it('should return fiscal configs by store id', async () => {
      const storeId = 'store-1';
      const fiscalConfig1 = FiscalConfigFakeBuilder.aFiscalConfig()
        .withStoreId(storeId)
        .build();
      const fiscalConfig2 = FiscalConfigFakeBuilder.aFiscalConfig()
        .withStoreId('store-2')
        .build();
      const fiscalConfig3 = FiscalConfigFakeBuilder.aFiscalConfig()
        .withStoreId(storeId)
        .build();

      await repository.insert(fiscalConfig1);
      await repository.insert(fiscalConfig2);
      await repository.insert(fiscalConfig3);

      const result = await repository.findByStoreId(storeId);

      expect(result).toHaveLength(2);
      expect(result).toContain(fiscalConfig1);
      expect(result).toContain(fiscalConfig3);
      expect(result).not.toContain(fiscalConfig2);
    });
  });

  describe('findActiveByStoreId', () => {
    it('should return only active fiscal configs by store id', async () => {
      const storeId = 'store-1';
      const activeFiscalConfig = FiscalConfigFakeBuilder.aFiscalConfig()
        .withStoreId(storeId)
        .activate()
        .build();
      const inactiveFiscalConfig = FiscalConfigFakeBuilder.aFiscalConfig()
        .withStoreId(storeId)
        .deactivate()
        .build();

      await repository.insert(activeFiscalConfig);
      await repository.insert(inactiveFiscalConfig);

      const result = await repository.findActiveByStoreId(storeId);

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(activeFiscalConfig);
    });
  });

  describe('findByStoreAndType', () => {
    it('should return fiscal configs by store and type', async () => {
      const storeId = 'store-1';
      const configType = FiscalConfigType.ICMS;
      
      const matchingConfig = FiscalConfigFakeBuilder.aFiscalConfig()
        .withStoreId(storeId)
        .withConfigType(configType)
        .build();
      const differentTypeConfig = FiscalConfigFakeBuilder.aFiscalConfig()
        .withStoreId(storeId)
        .withConfigType(FiscalConfigType.IPI)
        .build();

      await repository.insert(matchingConfig);
      await repository.insert(differentTypeConfig);

      const result = await repository.findByStoreAndType(storeId, configType);

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(matchingConfig);
    });
  });

  describe('findByStoreAndName', () => {
    it('should return fiscal config by store and name', async () => {
      const storeId = 'store-1';
      const configName = 'ICMS Configuration';
      
      const matchingConfig = FiscalConfigFakeBuilder.aFiscalConfig()
        .withStoreId(storeId)
        .withConfigName(configName)
        .build();
      const differentNameConfig = FiscalConfigFakeBuilder.aFiscalConfig()
        .withStoreId(storeId)
        .withConfigName('IPI Configuration')
        .build();

      await repository.insert(matchingConfig);
      await repository.insert(differentNameConfig);

      const result = await repository.findByStoreAndName(storeId, configName);

      expect(result).toBe(matchingConfig);
    });

    it('should return null when no config found', async () => {
      const result = await repository.findByStoreAndName('store-1', 'Non-existent Config');
      expect(result).toBeNull();
    });
  });

  describe('findApplicableConfigs', () => {
    it('should return configs that apply to given product data', async () => {
      const storeId = 'store-1';
      const ncmCode = '12345678';
      
      // Definir datas válidas para o período atual
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 1); // ontem
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30); // 30 dias no futuro
      
      const applicableConfig = FiscalConfigFakeBuilder.aFiscalConfig()
        .withStoreId(storeId)
        .withAppliesTo([ncmCode], [])
        .withValidityPeriod(startDate, endDate)
        .activate()
        .build();
      const nonApplicableConfig = FiscalConfigFakeBuilder.aFiscalConfig()
        .withStoreId(storeId)
        .withAppliesTo(['87654321'], [])
        .withValidityPeriod(startDate, endDate)
        .activate()
        .build();

      await repository.insert(applicableConfig);
      await repository.insert(nonApplicableConfig);

      const result = await repository.findApplicableConfigs(storeId, {
        ncm_code: ncmCode
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(applicableConfig);
    });
  });

  describe('search', () => {
    it('should filter by store_id', async () => {
      const storeId = 'store-1';
      const fiscalConfig1 = FiscalConfigFakeBuilder.aFiscalConfig()
        .withStoreId(storeId)
        .build();
      const fiscalConfig2 = FiscalConfigFakeBuilder.aFiscalConfig()
        .withStoreId('store-2')
        .build();

      await repository.insert(fiscalConfig1);
      await repository.insert(fiscalConfig2);

      const searchParams = FiscalConfigSearchParams.create({
        filter: { store_id: storeId }
      });
      const result = await repository.search(searchParams);

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toBe(fiscalConfig1);
    });

    it('should filter by config_type', async () => {
      const configType = FiscalConfigType.ICMS;
      const fiscalConfig1 = FiscalConfigFakeBuilder.aFiscalConfig()
        .withConfigType(configType)
        .build();
      const fiscalConfig2 = FiscalConfigFakeBuilder.aFiscalConfig()
        .withConfigType(FiscalConfigType.IPI)
        .build();

      await repository.insert(fiscalConfig1);
      await repository.insert(fiscalConfig2);

      const searchParams = FiscalConfigSearchParams.create({
        filter: { config_type: configType }
      });
      const result = await repository.search(searchParams);

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toBe(fiscalConfig1);
    });

    it('should filter by is_active', async () => {
      const activeFiscalConfig = FiscalConfigFakeBuilder.aFiscalConfig()
        .activate()
        .build();
      const inactiveFiscalConfig = FiscalConfigFakeBuilder.aFiscalConfig()
        .deactivate()
        .build();

      await repository.insert(activeFiscalConfig);
      await repository.insert(inactiveFiscalConfig);

      const searchParams = FiscalConfigSearchParams.create({
        filter: { is_active: true }
      });
      const result = await repository.search(searchParams);

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toBe(activeFiscalConfig);
    });

    it('should filter by config_name', async () => {
      const fiscalConfig1 = FiscalConfigFakeBuilder.aFiscalConfig()
        .withConfigName('ICMS Configuration')
        .build();
      const fiscalConfig2 = FiscalConfigFakeBuilder.aFiscalConfig()
        .withConfigName('IPI Configuration')
        .build();

      await repository.insert(fiscalConfig1);
      await repository.insert(fiscalConfig2);

      const searchParams = FiscalConfigSearchParams.create({
        filter: { config_name: 'ICMS' }
      });
      const result = await repository.search(searchParams);

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toBe(fiscalConfig1);
    });

    it('should sort by config_name', async () => {
      const fiscalConfig1 = FiscalConfigFakeBuilder.aFiscalConfig()
        .withConfigName('B Config')
        .build();
      const fiscalConfig2 = FiscalConfigFakeBuilder.aFiscalConfig()
        .withConfigName('A Config')
        .build();

      await repository.insert(fiscalConfig1);
      await repository.insert(fiscalConfig2);

      const searchParams = FiscalConfigSearchParams.create({
        sort: 'config_name',
        sort_dir: 'asc'
      });
      const result = await repository.search(searchParams);

      expect(result.items[0]).toBe(fiscalConfig2);
      expect(result.items[1]).toBe(fiscalConfig1);
    });

    it('should sort by priority', async () => {
      const lowPriorityConfig = FiscalConfigFakeBuilder.aFiscalConfig()
        .withPriority(1)
        .build();
      const highPriorityConfig = FiscalConfigFakeBuilder.aFiscalConfig()
        .withPriority(10)
        .build();

      await repository.insert(lowPriorityConfig);
      await repository.insert(highPriorityConfig);

      const searchParams = FiscalConfigSearchParams.create({
        sort: 'priority',
        sort_dir: 'desc'
      });
      const result = await repository.search(searchParams);

      expect(result.items[0]).toBe(highPriorityConfig);
      expect(result.items[1]).toBe(lowPriorityConfig);
    });
  });
});