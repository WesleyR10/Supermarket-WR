import { FiscalConfig, FiscalConfigId, FiscalConfigType } from '../fiscal-config.aggregate';

describe('FiscalConfig Aggregate Unit Tests', () => {
  describe('constructor', () => {
    test('should create fiscal config with default values', () => {
      const fiscalConfig = FiscalConfig.fake()
        .aFiscalConfig()
        .withStoreId('store-123')
        .withConfigName('ICMS_PADRAO')
        .withConfigType(FiscalConfigType.ICMS)
        .withPriority(0) // Definir explicitamente o valor esperado
        .build();

      expect(fiscalConfig.fiscal_config_id).toBeInstanceOf(FiscalConfigId);
      expect(fiscalConfig.store_id).toBe('store-123');
      expect(fiscalConfig.config_name).toBe('ICMS_PADRAO');
      expect(fiscalConfig.config_type).toBe(FiscalConfigType.ICMS);
      expect(fiscalConfig.is_active).toBe(true);
      expect(fiscalConfig.priority).toBe(0);
      expect(fiscalConfig.created_at).toBeInstanceOf(Date);
      expect(fiscalConfig.updated_at).toBeInstanceOf(Date);
    });

    test('should create fiscal config with all properties', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');
      
      const fiscalConfig = FiscalConfig.fake()
        .aFiscalConfig()
        .withStoreId('store-123')
        .withConfigName('IPI_BEBIDAS')
        .withConfigType(FiscalConfigType.IPI)
        .withTaxRate(10.0)
        .withAppliesTo(['12345678'], ['cat-1', 'cat-2'])
        .withValueRange(100.0, 1000.0)
        .withValidityPeriod(startDate, endDate)
        .withPriority(5)
        .withDescription('Configuração IPI para bebidas')
        .build();

      expect(fiscalConfig.config_name).toBe('IPI_BEBIDAS');
      expect(fiscalConfig.config_type).toBe(FiscalConfigType.IPI);
      expect(fiscalConfig.tax_rate).toBe(10.0);
      expect(fiscalConfig.applies_to_ncm).toEqual(['12345678']);
      expect(fiscalConfig.applies_to_categories).toEqual(['cat-1', 'cat-2']);
      expect(fiscalConfig.min_value).toBe(100.0);
      expect(fiscalConfig.max_value).toBe(1000.0);
      expect(fiscalConfig.priority).toBe(5);
      expect(fiscalConfig.description).toBe('Configuração IPI para bebidas');
    });
  });

  describe('create command', () => {
    test('should create fiscal config with validation', () => {
      const fiscalConfig = FiscalConfig.create({
        store_id: 'store-123',
        config_name: 'ICMS_PADRAO',
        config_type: FiscalConfigType.ICMS,
        tax_rate: 18.0,
        is_active: true,
        priority: 1
      });

      expect(fiscalConfig.fiscal_config_id).toBeInstanceOf(FiscalConfigId);
      expect(fiscalConfig.store_id).toBe('store-123');
      expect(fiscalConfig.config_name).toBe('ICMS_PADRAO');
      expect(fiscalConfig.config_type).toBe(FiscalConfigType.ICMS);
      expect(fiscalConfig.tax_rate).toBe(18.0);
      expect(fiscalConfig.is_active).toBe(true);
      expect(fiscalConfig.priority).toBe(1);
    });

    test('should create fiscal config with complex rules', () => {
      const fiscalConfig = FiscalConfig.create({
        store_id: 'store-123',
        config_name: 'ICMS_REDUZIDO',
        config_type: FiscalConfigType.ICMS,
        tax_rate: 7.0,
        applies_to_ncm: ['12345678', '87654321'],
        applies_to_categories: ['cat-food', 'cat-basic'],
        min_value: 0,
        max_value: 500.0,
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        priority: 3,
        description: 'ICMS reduzido para alimentos básicos',
      });

      expect(fiscalConfig.config_name).toBe('ICMS_REDUZIDO');
      expect(fiscalConfig.tax_rate).toBe(7.0);
      expect(fiscalConfig.applies_to_ncm).toEqual(['12345678', '87654321']);
      expect(fiscalConfig.priority).toBe(3);
    });
  });

  describe('business methods', () => {
    let fiscalConfig: FiscalConfig;

    beforeEach(() => {
      // Definir datas válidas para o período atual
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 1); // ontem
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30); // 30 dias no futuro
      
      fiscalConfig = FiscalConfig.fake()
        .aFiscalConfig()
        .withStoreId('store-123')
        .withConfigName('ICMS_PADRAO')
        .withConfigType(FiscalConfigType.ICMS)
        .withTaxRate(18.0)
        .withValidityPeriod(startDate, endDate)
        .activate()
        .build();
    });

    test('should activate fiscal config', () => {
      fiscalConfig.deactivate();
      fiscalConfig.activate();
      expect(fiscalConfig.is_active).toBe(true);
    });

    test('should deactivate fiscal config', () => {
      fiscalConfig.deactivate();
      expect(fiscalConfig.is_active).toBe(false);
    });

    test('should change name', () => {
      fiscalConfig.changeName('ICMS_NOVO');
      expect(fiscalConfig.config_name).toBe('ICMS_NOVO');
      expect(fiscalConfig.updated_at).toBeInstanceOf(Date);
    });

    test('should update tax rate', () => {
      fiscalConfig.updateTaxRate(12.0);
      expect(fiscalConfig.tax_rate).toBe(12.0);
      expect(fiscalConfig.updated_at).toBeInstanceOf(Date);
    });

    test('should add NCM code', () => {
      fiscalConfig.addNCMCode('12345678');
      expect(fiscalConfig.applies_to_ncm).toContain('12345678');
      expect(fiscalConfig.updated_at).toBeInstanceOf(Date);
    });

    test('should remove NCM code', () => {
      fiscalConfig.addNCMCode('12345678');
      fiscalConfig.removeNCMCode('12345678');
      expect(fiscalConfig.applies_to_ncm).not.toContain('12345678');
      expect(fiscalConfig.updated_at).toBeInstanceOf(Date);
    });

    test('should add category', () => {
      fiscalConfig.addCategory('cat-123');
      expect(fiscalConfig.applies_to_categories).toContain('cat-123');
      expect(fiscalConfig.updated_at).toBeInstanceOf(Date);
    });

    test('should remove category', () => {
      fiscalConfig.addCategory('cat-123');
      fiscalConfig.removeCategory('cat-123');
      expect(fiscalConfig.applies_to_categories).not.toContain('cat-123');
      expect(fiscalConfig.updated_at).toBeInstanceOf(Date);
    });

    test('should update priority', () => {
      fiscalConfig.updatePriority(5);
      expect(fiscalConfig.priority).toBe(5);
      expect(fiscalConfig.updated_at).toBeInstanceOf(Date);
    });

    test('should set validity period', () => {
      const startDate = new Date('2024-06-01');
      const endDate = new Date('2024-12-31');
      fiscalConfig.setValidityPeriod(startDate, endDate);
      expect(fiscalConfig.start_date).toBe(startDate);
      expect(fiscalConfig.end_date).toBe(endDate);
      expect(fiscalConfig.updated_at).toBeInstanceOf(Date);
    });

    test('should check if valid for date', () => {
      const today = new Date();
      expect(fiscalConfig.isValidForDate(today)).toBe(true);
      
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      expect(fiscalConfig.isValidForDate(futureDate)).toBe(false);
    });

    test('should check if applies to product', () => {
      fiscalConfig.addNCMCode('12345678');
      fiscalConfig.addCategory('cat-123');
      
      expect(fiscalConfig.appliesTo({ ncm_code: '12345678' })).toBe(true);
      expect(fiscalConfig.appliesTo({ category_id: 'cat-123' })).toBe(true);
      expect(fiscalConfig.appliesTo({ ncm_code: '87654321' })).toBe(false);
    });

    test('should calculate tax', () => {
      fiscalConfig.updateTaxRate(10.0);
      const tax = fiscalConfig.calculateTax(100);
      expect(tax).toBe(10.0);
    });

    test('should compare priority', () => {
      const otherConfig = FiscalConfig.fake()
        .aFiscalConfig()
        .withPriority(1)
        .build();
      
      fiscalConfig.updatePriority(5);
      expect(fiscalConfig.isHigherPriorityThan(otherConfig)).toBe(true);
    });
  });

  describe('validation', () => {
    test('should validate fiscal config on create', () => {
      expect(() => {
        FiscalConfig.create({
          store_id: 'store-123',
          config_name: 'ICMS_PADRAO',
          config_type: FiscalConfigType.ICMS,
        });
      }).not.toThrow();
    });

    test('should validate fiscal config on business methods', () => {
      const fiscalConfig = FiscalConfig.fake()
        .aFiscalConfig()
        .withStoreId('store-123')
        .withConfigName('ICMS_PADRAO')
        .withConfigType(FiscalConfigType.ICMS)
        .build();

      expect(() => {
        fiscalConfig.changeName('ICMS_NOVO');
      }).not.toThrow();
    });
  });

  describe('FiscalConfigId value object', () => {
    test('should create FiscalConfigId', () => {
      const id = new FiscalConfigId();
      expect(id).toBeInstanceOf(FiscalConfigId);
      expect(typeof id.id).toBe('string');
    });

    test('should accept valid uuid', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      const id = new FiscalConfigId(uuid);
      expect(id.id).toBe(uuid);
    });
  });

  describe('fake builder', () => {
    test('should create fiscal config using fake builder', () => {
      const fiscalConfig = FiscalConfig.fake().aFiscalConfig().build();
      expect(fiscalConfig).toBeInstanceOf(FiscalConfig);
      expect(fiscalConfig.fiscal_config_id).toBeInstanceOf(FiscalConfigId);
    });

    test('should create ICMS config using fake builder', () => {
      const fiscalConfig = FiscalConfig.fake().aFiscalConfig().asICMSConfig().build();
      expect(fiscalConfig.config_type).toBe(FiscalConfigType.ICMS);
    });

    test('should create IPI config using fake builder', () => {
      const fiscalConfig = FiscalConfig.fake().aFiscalConfig().asIPIConfig().build();
      expect(fiscalConfig.config_type).toBe(FiscalConfigType.IPI);
    });
  });

  describe('business rules', () => {
    test('should handle multiple fiscal configs with different priorities', () => {
      const config1 = FiscalConfig.fake().aFiscalConfig().withPriority(1).build();
      const config2 = FiscalConfig.fake().aFiscalConfig().withPriority(5).build();
      
      expect(config2.isHigherPriorityThan(config1)).toBe(true);
      expect(config1.isHigherPriorityThan(config2)).toBe(false);
    });

    test('should handle fiscal config types', () => {
      const icmsConfig = FiscalConfig.fake().aFiscalConfig().asICMSConfig().build();
      const ipiConfig = FiscalConfig.fake().aFiscalConfig().asIPIConfig().build();
      
      expect(icmsConfig.config_type).toBe(FiscalConfigType.ICMS);
      expect(ipiConfig.config_type).toBe(FiscalConfigType.IPI);
    });
  });
});