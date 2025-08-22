import { FiscalConfig, FiscalConfigType, FiscalConfigId } from '../../../domain/fiscal-config.aggregate';
import { FiscalConfigInMemoryRepository } from '../../../infra/db/in-memory/fiscal-config-in-memory.repository';
import { CreateFiscalConfigUseCase } from './create-fiscal-config.use-case';
import { EntityValidationError } from '@core/shared/domain/validators/validation.error';

describe('CreateFiscalConfigUseCase Unit Tests', () => {
  let useCase: CreateFiscalConfigUseCase;
  let repository: FiscalConfigInMemoryRepository;

  beforeEach(() => {
    repository = new FiscalConfigInMemoryRepository();
    useCase = new CreateFiscalConfigUseCase(repository);
  });

  it('should create a fiscal config with required fields only', async () => {
    const input = {
      store_id: 'store-1',
      config_name: 'ICMS Padrão',
      config_type: FiscalConfigType.ICMS,
      tax_rate: 18,
      priority: 1
    };

    const result = await useCase.execute(input);

    expect(result.id).toBeDefined();
    expect(result.store_id).toBe('store-1');
    expect(result.config_name).toBe('ICMS Padrão');
    expect(result.config_type).toBe(FiscalConfigType.ICMS);
    expect(result.tax_rate).toBe(18);
    expect(result.priority).toBe(1);
    expect(result.is_active).toBe(true);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify it was saved in repository
    const savedConfig = await repository.findById(new FiscalConfigId(result.id));
    expect(savedConfig).toBeDefined();
    expect(savedConfig!.config_name).toBe('ICMS Padrão');
  });

  it('should create a fiscal config with all optional fields', async () => {
    const input = {
      store_id: 'store-1',
      config_name: 'ICMS Específico',
      config_type: FiscalConfigType.ICMS,
      tax_rate: 12,
      priority: 2,
      applies_to_ncm: ['12345678', '87654321'],
      applies_to_categories: ['cat-1', 'cat-2'],
      min_value: 100,
      max_value: 1000,
      start_date: new Date('2024-01-01'),
      end_date: new Date('2024-12-31'),
      description: 'Configuração específica para produtos importados',
      metadata: { origem: 'importado', regime: 'normal' }
    };

    const result = await useCase.execute(input);

    expect(result.id).toBeDefined();
    expect(result.store_id).toBe('store-1');
    expect(result.config_name).toBe('ICMS Específico');
    expect(result.config_type).toBe(FiscalConfigType.ICMS);
    expect(result.tax_rate).toBe(12);
    expect(result.priority).toBe(2);
    expect(result.applies_to_ncm).toEqual(['12345678', '87654321']);
    expect(result.applies_to_categories).toEqual(['cat-1', 'cat-2']);
    expect(result.min_value).toBe(100);
    expect(result.max_value).toBe(1000);
    expect(result.start_date).toEqual(new Date('2024-01-01'));
    expect(result.end_date).toEqual(new Date('2024-12-31'));
    expect(result.description).toBe('Configuração específica para produtos importados');
    expect(result.metadata).toEqual({ origem: 'importado', regime: 'normal' });
  });

  it('should throw error when config_name is empty', async () => {
    const input = {
      store_id: 'store-1',
      config_name: '',
      config_type: FiscalConfigType.ICMS,
      tax_rate: 18,
      priority: 1
    };

    await expect(() => useCase.execute(input)).rejects.toThrow(EntityValidationError);
  });

  it('should create fiscal config even with negative tax_rate (validation not enforced in create)', async () => {
    const input = {
      store_id: 'store-1',
      config_name: 'ICMS com Taxa Negativa',
      config_type: FiscalConfigType.ICMS,
      tax_rate: -5,
      priority: 1
    };

    const result = await useCase.execute(input);
    expect(result.tax_rate).toBe(-5);
  });

  it('should create fiscal config even with negative priority (validation not enforced in create)', async () => {
    const input = {
      store_id: 'store-1',
      config_name: 'ICMS com Prioridade Negativa',
      config_type: FiscalConfigType.ICMS,
      tax_rate: 18,
      priority: -1
    };

    const result = await useCase.execute(input);
    expect(result.priority).toBe(-1);
  });

  it('should create fiscal config even when min_value is greater than max_value (validation not enforced in create)', async () => {
    const input = {
      store_id: 'store-1',
      config_name: 'ICMS com Valores Invertidos',
      config_type: FiscalConfigType.ICMS,
      tax_rate: 18,
      priority: 1,
      min_value: 1000,
      max_value: 100
    };

    const result = await useCase.execute(input);
    expect(result.min_value).toBe(1000);
    expect(result.max_value).toBe(100);
  });

  it('should create fiscal config even when start_date is after end_date (validation not enforced in create)', async () => {
    const input = {
      store_id: 'store-1',
      config_name: 'ICMS com Datas Invertidas',
      config_type: FiscalConfigType.ICMS,
      tax_rate: 18,
      priority: 1,
      start_date: new Date('2024-12-31'),
      end_date: new Date('2024-01-01')
    };

    const result = await useCase.execute(input);
    expect(result.start_date).toEqual(new Date('2024-12-31'));
    expect(result.end_date).toEqual(new Date('2024-01-01'));
  });

  it('should create inactive fiscal config when is_active is false', async () => {
    const input = {
      store_id: 'store-1',
      config_name: 'ICMS Inativo',
      config_type: FiscalConfigType.ICMS,
      tax_rate: 18,
      priority: 1,
      is_active: false
    };

    const result = await useCase.execute(input);

    expect(result.is_active).toBe(false);
  });
});