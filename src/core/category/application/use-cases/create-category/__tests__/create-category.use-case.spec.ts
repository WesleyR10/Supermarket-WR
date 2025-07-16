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
    });

    describe('business rules validation', () => {
      it('should throw error when perishable category does not require expiry date', async () => {
        const input = {
          name: 'Carnes e Aves', // Categoria perecível
          requires_expiry_date: false,
          store_id: 'test-store-id'
        };

        await expect(() => useCase.execute(input)).rejects.toThrow(
          EntityValidationError
        );
      });

      it('should throw error when category that should have tax rate has null tax_rate', async () => {
        const input = {
          name: 'Bebidas', // Categoria que deve ter tax rate
          tax_rate: null,
          store_id: 'test-store-id'
        };

        await expect(() => useCase.execute(input)).rejects.toThrow(
          EntityValidationError
        );
      });

      // Teste corrigido: Medicamentos PODEM ser criados, mas não são elegíveis para promoção
      it('should create medication category successfully (not promotion eligible)', async () => {
        const input = {
          name: 'Medicamentos',
          is_active: true,
          store_id: 'test-store-id'
        };

        const output = await useCase.execute(input);

        expect(output.name).toBe('Medicamentos');
        expect(output.is_active).toBe(true);
        
        // Verifica que a categoria foi criada mas não é elegível para promoção
        const category = repository.items[0];
        expect(category.isPromotionEligible()).toBe(false);
      });

      it('should accept valid perishable category with expiry date control', async () => {
        const input = {
          name: 'Laticínios',
          requires_expiry_date: true,
          store_id: 'test-store-id'
        };

        const output = await useCase.execute(input);

        expect(output.requires_expiry_date).toBe(true);
        expect(output.name).toBe('Laticínios');
      });

      it('should accept valid category with tax rate', async () => {
        const input = {
          name: 'Eletrônicos',
          tax_rate: 18.5,
          store_id: 'test-store-id'
        };

        const output = await useCase.execute(input);

        expect(output.tax_rate).toBe(18.5);
        expect(output.name).toBe('Eletrônicos');
      });
    });

    describe('repository integration', () => {
      it('should persist category in repository', async () => {
        const input = {
          name: 'Test Category',
          description: 'Test Description',
          store_id: 'test-store-id'
        };

        await useCase.execute(input);

        expect(repository.items).toHaveLength(1);
        expect(repository.items[0].name).toBe('Test Category');
        expect(repository.items[0].description).toBe('Test Description');
      });

      it('should generate unique id for each category', async () => {
        const input1 = { name: 'Category 1', store_id: 'test-store-id' };
        const input2 = { name: 'Category 2', store_id: 'test-store-id' };

        const output1 = await useCase.execute(input1);
        const output2 = await useCase.execute(input2);

        expect(output1.id).not.toBe(output2.id);
        expect(repository.items).toHaveLength(2);
      });

      it('should set created_at timestamp', async () => {
        const input = { name: 'Test Category', store_id: 'test-store-id' };
        const beforeCreate = new Date();

        const output = await useCase.execute(input);

        const afterCreate = new Date();
        expect(output.created_at).toBeInstanceOf(Date);
        expect(output.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
        expect(output.created_at.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
      });
    });

    describe('supermarket specific scenarios', () => {
      it('should handle food categories correctly', async () => {
        const input = {
          name: 'Hortifruti',
          store_id: 'test-store-id',
          requires_expiry_date: true,
          tax_rate: 7.0,
          default_margin_percentage: 30.0,
        };

        const output = await useCase.execute(input);

        expect(output.requires_expiry_date).toBe(true);
        expect(output.tax_rate).toBe(7.0);
        expect(output.default_margin_percentage).toBe(30.0);
      });

      it('should handle non-perishable categories correctly', async () => {
        const input = {
          name: 'Utilidades Domésticas',
          store_id: 'test-store-id',
          requires_expiry_date: false,
          tax_rate: 18.5,
          default_margin_percentage: 40.0,
        };

        const output = await useCase.execute(input);

        expect(output.requires_expiry_date).toBe(false);
        expect(output.tax_rate).toBe(18.5);
        expect(output.default_margin_percentage).toBe(40.0);
      });

      it('should handle root categories correctly', async () => {
        const input = {
          name: 'Alimentos',
          store_id: 'test-store-id',
          parent_category_id: null,
          display_order: 1,
        };

        const output = await useCase.execute(input);

        expect(output.parent_category_id).toBeNull();
        expect(output.display_order).toBe(1);
      });

      // CORRIGIR: Usar categoria que não seja medicamento
      it('should handle subcategories correctly', async () => {
        const parentCategory = await useCase.execute({
          name: 'Alimentos', // Mudança: usar categoria válida
          store_id: 'test-store-id'
        });

        const input = {
          name: 'Refrigerantes',
          store_id: 'test-store-id',
          parent_category_id: parentCategory.id,
          display_order: 1,
        };

        const output = await useCase.execute(input);

        expect(output.parent_category_id).toBe(parentCategory.id);
        expect(output.display_order).toBe(1);
      });
    });
  });
});