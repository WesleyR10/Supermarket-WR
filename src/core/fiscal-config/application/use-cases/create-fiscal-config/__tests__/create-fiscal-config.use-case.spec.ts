
import { CreateFiscalConfigUseCase } from '../create-fiscal-config.use-case';
import { EntityValidationError } from '../../../../../shared/domain/validators/validation.error';
import { FiscalConfigType } from '@core/fiscal-config/domain/fiscal-config.aggregate';
import { FiscalConfigInMemoryRepository } from '@core/fiscal-config/infra/db/in-memory/fiscal-config-in-memory.repository';

describe('CreateFiscalConfigUseCase Unit Tests', () => {
  let useCase: CreateFiscalConfigUseCase;
  let repository: FiscalConfigInMemoryRepository;

  beforeEach(() => {
    repository = new FiscalConfigInMemoryRepository();
    useCase = new CreateFiscalConfigUseCase(repository);
  });

  describe('execute method', () => {
    it('should create a fiscal config with valid data', async () => {
      const input = {
        store_id: 'test-store-id',
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
        description: 'Configuração ICMS padrão'
      };

      const output = await useCase.execute(input);

      expect(output).toStrictEqual({
        id: repository.items[0].fiscal_config_id.id,
        store_id: 'test-store-id',
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
        created_at: repository.items[0].created_at,
        updated_at: repository.items[0].updated_at,
      });
      expect(repository.items).toHaveLength(1);
    });

    it('should create a fiscal config with minimal data', async () => {
      const input = {
        store_id: 'test-store-id',
        config_name: 'IPI_SIMPLES',
        config_type: FiscalConfigType.IPI
      };

      const output = await useCase.execute(input);

      expect(output).toStrictEqual({
        id: repository.items[0].fiscal_config_id.id,
        store_id: 'test-store-id',
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
        created_at: repository.items[0].created_at,
        updated_at: repository.items[0].updated_at,
      });
    });

    it('should throw error when config name already exists for store', async () => {
      const input = {
        store_id: 'test-store-id',
        config_name: 'ICMS_PADRAO',
        config_type: FiscalConfigType.ICMS
      };

      await useCase.execute(input);

      await expect(useCase.execute(input)).rejects.toThrow(EntityValidationError);
      
      // Captura o erro para validar a mensagem específica
      try {
        await useCase.execute(input);
      } catch (error) {
        expect(error.error).toEqual([{
          config_name: ['Já existe uma configuração fiscal com o nome "ICMS_PADRAO" para esta loja']
        }]);
      }
    });

    it('should throw EntityValidationError for invalid input', async () => {
      const input = {
        store_id: 'test-store-id',
        config_name: 'A', // Nome muito curto - inválido
        config_type: FiscalConfigType.ICMS
      };

      await expect(useCase.execute(input)).rejects.toThrow(EntityValidationError);
      
      try {
        await useCase.execute(input);
      } catch (error) {
        expect(error.error).toEqual([{
          config_name: ['config_name must be longer than or equal to 2 characters']
        }]);
      }
      
      expect(repository.items).toHaveLength(0);
    });

    it('should call repository insert method', async () => {
      const spyInsert = jest.spyOn(repository, 'insert');
      const input = {
        store_id: 'test-store-id',
        config_name: 'Test Config',
        config_type: FiscalConfigType.ICMS
      };

      await useCase.execute(input);

      expect(spyInsert).toHaveBeenCalledTimes(1);
      expect(spyInsert).toHaveBeenCalledWith(expect.any(Object));
    });

    it('should call repository findByStoreAndName method', async () => {
      const spyFindByStoreAndName = jest.spyOn(repository, 'findByStoreAndName');
      const input = {
        store_id: 'test-store-id',
        config_name: 'Test Config',
        config_type: FiscalConfigType.ICMS
      };

      await useCase.execute(input);

      expect(spyFindByStoreAndName).toHaveBeenCalledTimes(1);
      expect(spyFindByStoreAndName).toHaveBeenCalledWith('test-store-id', 'Test Config');
    });
  });
});