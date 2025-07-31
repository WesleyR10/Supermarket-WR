import { CategoryInMemoryRepository } from '../../../../infra/db/in-memory/category-in-memory.repository';
import { CreateCategoryUseCase } from '../create-category.use-case';
import { EntityValidationError } from '../../../../../shared/domain/validators/validation.error';

describe('CreateCategoryUseCase Unit Tests', () => {
  let useCase: CreateCategoryUseCase;
  let repository: CategoryInMemoryRepository;

  beforeEach(() => {
    repository = new CategoryInMemoryRepository();
    useCase = new CreateCategoryUseCase(repository);
  });

  describe('execute method', () => {
    it('should create a category with valid data', async () => {
      const input = {
        name: 'Alimentício',
        description: 'Produtos alimentícios em geral',
        is_active: true,
        tax_rate: 7.0,
        default_margin_percentage: 25.0,
        requires_expiry_date: true,
        display_order: 1,
        icon_name: 'food',
        store_id: 'test-store-id'
      };

      const output = await useCase.execute(input);

      expect(output).toStrictEqual({
        id: repository.items[0].category_id.id,
        name: 'Alimentício',
        description: 'Produtos alimentícios em geral',
        is_active: true,
        parent_category_id: null,
        tax_rate: 7.0,
        default_margin_percentage: 25.0,
        requires_expiry_date: true,
        display_order: 1,
        icon_name: 'food',
        store_id: 'test-store-id',
        created_at: repository.items[0].created_at,
        updated_at: repository.items[0].updated_at,
      });
      expect(repository.items).toHaveLength(1);
    });

    it('should create a category with minimal data', async () => {
      const input = {
        name: 'Higiene',
        store_id: 'test-store-id'
      };

      const output = await useCase.execute(input);

      expect(output).toStrictEqual({
        id: repository.items[0].category_id.id,
        name: 'Higiene',
        description: null,
        is_active: true,
        parent_category_id: null,
        tax_rate: null,
        default_margin_percentage: null,
        requires_expiry_date: false,
        display_order: 0,
        icon_name: null,
        store_id: 'test-store-id',
        created_at: repository.items[0].created_at,
        updated_at: repository.items[0].updated_at,
      });
    });

    it('should create a category with parent category', async () => {
      const parentCategory = await useCase.execute({
        name: 'Alimentos',
        store_id: 'test-store-id'
      });

      const input = {
        name: 'Frutas',
        parent_category_id: parentCategory.id,
        display_order: 1,
        store_id: 'test-store-id'
      };

      const output = await useCase.execute(input);

      expect(output.parent_category_id).toBe(parentCategory.id);
      expect(repository.items).toHaveLength(2);
    });

    it('should throw EntityValidationError for invalid input', async () => {
      const input = {
        name: '', // Nome vazio - inválido
        store_id: 'test-store-id'
      };

      await expect(useCase.execute(input)).rejects.toThrow(EntityValidationError);
      
      // Captura o erro para validar a mensagem específica
      try {
        await useCase.execute(input);
      } catch (error) {
        expect(error.error).toEqual([{
          name: ['name must be longer than or equal to 2 characters']
        }]);
      }
      
      expect(repository.items).toHaveLength(0);
    });

    it('should call repository insert method', async () => {
      const spyInsert = jest.spyOn(repository, 'insert');
      const input = {
        name: 'Test Category',
        store_id: 'test-store-id'
      };

      await useCase.execute(input);

      expect(spyInsert).toHaveBeenCalledTimes(1);
      expect(spyInsert).toHaveBeenCalledWith(expect.any(Object));
    });

    // Testa erro de validação sem store_id (multi-tenancy)
    it('should throw validation error without store_id', async () => {
      const input = { name: 'Test' }; // Sem store_id
      // @ts-ignore
      await expect(useCase.execute(input)).rejects.toThrow(EntityValidationError);
    });

    // Testa criação em stores diferentes (isolamento multi-tenant)
    it('should create categories in different stores independently', async () => {
      const input1 = { name: 'Cat1', store_id: 'store1' };
      const input2 = { name: 'Cat2', store_id: 'store2' };
      await useCase.execute(input1);
      await useCase.execute(input2);
      expect(repository.items).toHaveLength(2);
      expect(repository.items[0].store_id).toBe('store1');
      expect(repository.items[1].store_id).toBe('store2');
    });
  });
});