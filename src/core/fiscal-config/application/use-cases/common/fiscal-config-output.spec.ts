import { FiscalConfig, FiscalConfigType } from '../../../domain/fiscal-config.aggregate';
import { FiscalConfigOutputMapper } from './fiscal-config-output';

describe('FiscalConfigOutputMapper Unit Tests', () => {
  it('should convert a fiscal config in output', () => {
    const entity = FiscalConfig.create({
      store_id: '123',
      config_name: 'ICMS_PADRAO',
      config_type: FiscalConfigType.ICMS,
      tax_rate: 18.0,
      applies_to_ncm: ['12345678'],
      applies_to_categories: ['cat-1'],
      min_value: 0,
      max_value: 1000.0,
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-12-31'),
      is_active: true,
      priority: 1,
      description: 'Configuração ICMS padrão',
    });
    
    const spyToJSON = jest.spyOn(entity, 'toJSON');
    const output = FiscalConfigOutputMapper.toOutput(entity);
    
    expect(spyToJSON).toHaveBeenCalled();
    expect(output).toStrictEqual({
      id: entity.fiscal_config_id.id,
      store_id: '123',
      config_name: 'ICMS_PADRAO',
      config_type: FiscalConfigType.ICMS,
      tax_rate: 18.0,
      applies_to_ncm: ['12345678'],
      applies_to_categories: ['cat-1'],
      min_value: 0,
      max_value: 1000.0,
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-12-31'),
      is_active: true,
      priority: 1,
      description: 'Configuração ICMS padrão',
      metadata: null,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
    });
  });

  it('should convert a minimal fiscal config in output', () => {
    const entity = FiscalConfig.create({
      store_id: '123',
      config_name: 'IPI_SIMPLES',
      config_type: FiscalConfigType.IPI,
    });
    
    const spyToJSON = jest.spyOn(entity, 'toJSON');
    const output = FiscalConfigOutputMapper.toOutput(entity);
    
    expect(spyToJSON).toHaveBeenCalled();
    expect(output).toStrictEqual({
      id: entity.fiscal_config_id.id,
      store_id: '123',
      config_name: 'IPI_SIMPLES',
      config_type: FiscalConfigType.IPI,
      tax_rate: null,
      applies_to_ncm: [],
      applies_to_categories: [],
      min_value: null,
      max_value: null,
      start_date: null,
      end_date: null,
      is_active: true,
      priority: 0,
      description: null,
      metadata: null,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
    });
  });

  it('should convert a complex fiscal config with all fields', () => {
    const entity = FiscalConfig.create({
      store_id: '456',
      config_name: 'COFINS_ESPECIAL',
      config_type: FiscalConfigType.COFINS,
      tax_rate: 7.6,
      applies_to_ncm: ['12345678', '87654321'],
      applies_to_categories: ['cat-1', 'cat-2', 'cat-3'],
      min_value: 100.0,
      max_value: 5000.0,
      start_date: new Date('2024-03-01'),
      end_date: new Date('2024-11-30'),
      is_active: false,
      priority: 5,
      description: 'Configuração especial COFINS para produtos específicos',
      metadata: { special_rule: true, created_by: 'admin' },
    });
    
    const spyToJSON = jest.spyOn(entity, 'toJSON');
    const output = FiscalConfigOutputMapper.toOutput(entity);
    
    expect(spyToJSON).toHaveBeenCalled();
    expect(output).toStrictEqual({
      id: entity.fiscal_config_id.id,
      store_id: '456',
      config_name: 'COFINS_ESPECIAL',
      config_type: FiscalConfigType.COFINS,
      tax_rate: 7.6,
      applies_to_ncm: ['12345678', '87654321'],
      applies_to_categories: ['cat-1', 'cat-2', 'cat-3'],
      min_value: 100.0,
      max_value: 5000.0,
      start_date: new Date('2024-03-01'),
      end_date: new Date('2024-11-30'),
      is_active: false,
      priority: 5,
      description: 'Configuração especial COFINS para produtos específicos',
      metadata: { special_rule: true, created_by: 'admin' },
      created_at: entity.created_at,
      updated_at: entity.updated_at,
    });
  });
});