import { StoreInMemoryRepository } from '../../../../infra/db/in-memory/store-in-memory.repository';
import { CreateStoreUseCase } from '../create-store.use-case';
import { CreateStoreInput } from '../create-store.input';
import { EntityValidationError } from '../../../../../shared/domain/validators/validation.error';

describe('CreateStoreUseCase Unit Tests', () => {
  let useCase: CreateStoreUseCase;
  let repository: StoreInMemoryRepository;

  beforeEach(() => {
    repository = new StoreInMemoryRepository();
    useCase = new CreateStoreUseCase(repository);
  });

  it('should throw an error when aggregate is not valid', async () => {
    const input = new CreateStoreInput({
      name: '', // nome vazio deve falhar
      cnpj: '12.345.678/0001-90',
    });
    
    await expect(() => useCase.execute(input)).rejects.toThrowError(
      'Entity Validation Error',
    );
  });

  it('should throw an error when CNPJ format is invalid', async () => {
    const input = new CreateStoreInput({
      name: 'Supermercado Teste',
      cnpj: '123456789', // formato inválido
    });
    
    await expect(() => useCase.execute(input)).rejects.toThrowError(
      'Entity Validation Error',
    );
  });

  it('should create a store with default settings', async () => {
    const spyInsert = jest.spyOn(repository, 'insert');
    const input = new CreateStoreInput({
      name: 'Supermercado Central',
      cnpj: '11.222.333/0001-81', // CNPJ válido
    });

    const output = await useCase.execute(input);
    
    expect(spyInsert).toHaveBeenCalledTimes(1);
    expect(output).toStrictEqual({
      id: repository.items[0].store_id.id,
      name: 'Supermercado Central',
      cnpj: '11.222.333/0001-81',
      status: 'PENDING_ACTIVATION',
      settings: expect.objectContaining({
        business_hours: expect.any(Object),
        sales_config: expect.any(Object),
        inventory_config: expect.any(Object),
        fiscal_config: expect.any(Object),
        notification_config: expect.any(Object),
      }),
      subscription: expect.objectContaining({
        plan_type: 'BASIC',
        is_trial: true,
        payment_status: 'PENDING',
      }),
      created_at: repository.items[0].created_at,
      updated_at: repository.items[0].updated_at,
    });
  });

  it('should create a store with custom settings', async () => {
    const spyInsert = jest.spyOn(repository, 'insert');
    const input = new CreateStoreInput({
      name: 'Supermercado Premium',
      cnpj: '11.444.777/0001-61', // CNPJ válido
      plan_type: 'PREMIUM',
      is_trial: false,
      sales_config: {
        allow_negative_stock: true,
        max_discount_percentage: 20,
      },
    });

    const output = await useCase.execute(input);
    
    expect(spyInsert).toHaveBeenCalledTimes(1);
    expect(output.subscription.plan_type).toBe('PREMIUM');
    expect(output.subscription.is_trial).toBe(false);
    expect(output.settings.sales_config.allow_negative_stock).toBe(true);
    expect(output.settings.sales_config.max_discount_percentage).toBe(20);
  });

  it('should create a store with custom business hours', async () => {
    const input = new CreateStoreInput({
      name: 'Supermercado 24h',
      cnpj: '11.222.333/0001-81', // CNPJ válido
      business_hours: {
        monday: { open: '00:00', close: '23:59', closed: false },
        sunday: { open: '08:00', close: '18:00', closed: false },
      },
    });
  
    const output = await useCase.execute(input);
    
    expect(output.settings.business_hours.monday.open).toBe('00:00');
    expect(output.settings.business_hours.monday.close).toBe('23:59');
    expect(output.settings.business_hours.sunday.open).toBe('08:00');
  });

  it('should throw EntityValidationError with multiple validation errors', async () => {
    try {
      await useCase.execute({
        name: '', // Invalid name
        cnpj: '123', // Invalid CNPJ
        business_hours: {
          monday: { open: 'invalid', close: 'invalid', closed: false },
        },
        sales_config: {
          max_discount_percentage: 101,
        },
        inventory_config: {
          low_stock_threshold: -5, // Invalid inventory config
        },
      });
      fail('Should have thrown EntityValidationError');
    } catch (error) {
      expect(error).toBeInstanceOf(EntityValidationError);
      expect(error.error).toMatchObject([
        {
          name: [
            'name must be longer than or equal to 2 characters',
            'name should not be empty',
          ],
        },
        {
          cnpj: [
            'CNPJ deve estar no formato XX.XXX.XXX/XXXX-XX',
            'CNPJ deve ter 14 dígitos',
          ],
        },
        {
          'settings.business_hours': [
            'Horário de funcionamento inválido para monday',
          ],
        },
        {
          'settings.sales_config': [
            'Percentual máximo de desconto deve estar entre 0 e 100',
          ],
        },
        {
          'settings.inventory_config': [
            'Limite mínimo de estoque deve ser maior que zero',
          ],
        },
      ]);
    }
  });
});