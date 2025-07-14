import { CategoryInMemoryRepository } from '../../infra/db/in-memory/category-in-memory.repository';
import { CreateCategoryUseCase } from '../create-category.use-case';
import { EntityValidationError } from '../../../shared/domain/validators/validation.error';

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
        icon_name: 'food'
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
        created_at: repository.items[0].created_at,
      });
    });

    it('should create a category with minimal data', async () => {
      const input = {
        name: 'Higiene',
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
        created_at: repository.items[0].created_at,
      });
    });

    it('should create a category with parent category', async () => {
      const parentCategory = await useCase.execute({
        name: 'Alimentos',
      });

      const input = {
        name: 'Frutas',
        parent_category_id: parentCategory.id,
        display_order: 1,
      };

      const output = await useCase.execute(input);

      expect(output.parent_category_id).toBe(parentCategory.id);
    });

    // VALIDAÇÕES DE SINTAXE (Use Case responsibility)
    describe('input validation', () => {
      it('should throw error when name is missing', async () => {
        const input = {
          name: '',
        };

        await expect(() => useCase.execute(input)).rejects.toThrow(
          'Validation failed: Name cannot be empty'
        );
      });

      it('should throw error when name is not provided', async () => {
        const input = {} as any;

        await expect(() => useCase.execute(input)).rejects.toThrow(
          'Validation failed: Name is required and must be a string'
        );
      });

      it('should throw error when name is too long', async () => {
        const input = {
          name: 'a'.repeat(101),
        };

        await expect(() => useCase.execute(input)).rejects.toThrow(
          'Validation failed: Name cannot exceed 100 characters'
        );
      });

      it('should throw error when description is too long', async () => {
        const input = {
          name: 'Test Category',
          description: 'a'.repeat(501),
        };

        await expect(() => useCase.execute(input)).rejects.toThrow(
          'Validation failed: Description cannot exceed 500 characters'
        );
      });

      it('should throw error when tax rate is invalid', async () => {
        const input = {
          name: 'Test Category',
          tax_rate: 150, // Invalid: > 100
        };

        await expect(() => useCase.execute(input)).rejects.toThrow(
          'Validation failed: Tax rate must be between 0 and 100'
        );
      });

      it('should throw error when tax rate is negative', async () => {
        const input = {
          name: 'Test Category',
          tax_rate: -10,
        };

        await expect(() => useCase.execute(input)).rejects.toThrow(
          'Validation failed: Tax rate must be between 0 and 100'
        );
      });

      it('should throw error when margin percentage is negative', async () => {
        const input = {
          name: 'Test Category',
          default_margin_percentage: -10,
        };

        await expect(() => useCase.execute(input)).rejects.toThrow(
          'Validation failed: Default margin percentage cannot be negative'
        );
      });

      it('should throw error when margin percentage is too high', async () => {
        const input = {
          name: 'Test Category',
          default_margin_percentage: 600, // > 500
        };

        await expect(() => useCase.execute(input)).rejects.toThrow(
          'Validation failed: Default margin percentage cannot exceed 500%'
        );
      });

      it('should throw error when display order is negative', async () => {
        const input = {
          name: 'Test Category',
          display_order: -1,
        };

        await expect(() => useCase.execute(input)).rejects.toThrow(
          'Validation failed: Display order cannot be negative'
        );
      });

      it('should throw error when icon name has invalid characters', async () => {
        const input = {
          name: 'Test Category',
          icon_name: 'invalid@icon!',
        };

        await expect(() => useCase.execute(input)).rejects.toThrow(
          'Validation failed: Icon name can only contain letters, numbers, hyphens and underscores'
        );
      });

      it('should throw error when icon name is too long', async () => {
        const input = {
          name: 'Test Category',
          icon_name: 'a'.repeat(51),
        };

        await expect(() => useCase.execute(input)).rejects.toThrow(
          'Validation failed: Icon name cannot exceed 50 characters'
        );
      });
    });

    // VALIDAÇÕES DE DOMÍNIO (Business Rules)
    describe('business rules validation', () => {
      it('should throw error when perishable category does not require expiry date', async () => {
        const input = {
          name: 'Carnes e Aves', // Categoria perecível
          requires_expiry_date: false,
        };

        await expect(() => useCase.execute(input)).rejects.toThrow(
          EntityValidationError
        );
      });

      it('should throw error when category that should have tax rate has null tax_rate', async () => {
        const input = {
          name: 'Bebidas', // Categoria que deve ter tax rate
          tax_rate: null,
        };

        await expect(() => useCase.execute(input)).rejects.toThrow(
          EntityValidationError
        );
      });

      it('should throw error when medication category is promotion eligible', async () => {
        const input = {
          name: 'Medicamentos', // Categoria de medicamentos
          is_active: true,
        };

        await expect(() => useCase.execute(input)).rejects.toThrow(
          EntityValidationError
        );
      });

      it('should accept valid perishable category with expiry date control', async () => {
        const input = {
          name: 'Laticínios',
          requires_expiry_date: true,
        };

        const output = await useCase.execute(input);

        expect(output.requires_expiry_date).toBe(true);
        expect(output.name).toBe('Laticínios');
      });

      it('should accept valid category with tax rate', async () => {
        const input = {
          name: 'Eletrônicos',
          tax_rate: 18.5,
        };

        const output = await useCase.execute(input);

        expect(output.tax_rate).toBe(18.5);
        expect(output.name).toBe('Eletrônicos');
      });

      it('should accept valid promotion eligible category', async () => {
        const input = {
          name: 'Limpeza',
          is_active: true,
        };

        const output = await useCase.execute(input);

        expect(output.is_active).toBe(true);
        expect(output.name).toBe('Limpeza');
      });
    });

    // TESTES DE INTEGRAÇÃO COM REPOSITÓRIO
    describe('repository integration', () => {
      it('should persist category in repository', async () => {
        const input = {
          name: 'Test Category',
          description: 'Test Description',
        };

        await useCase.execute(input);

        expect(repository.items).toHaveLength(1);
        expect(repository.items[0].name).toBe('Test Category');
        expect(repository.items[0].description).toBe('Test Description');
      });

      it('should generate unique id for each category', async () => {
        const input1 = { name: 'Category 1' };
        const input2 = { name: 'Category 2' };

        const output1 = await useCase.execute(input1);
        const output2 = await useCase.execute(input2);

        expect(output1.id).not.toBe(output2.id);
        expect(repository.items).toHaveLength(2);
      });

      it('should set created_at timestamp', async () => {
        const input = { name: 'Test Category' };
        const beforeCreate = new Date();

        const output = await useCase.execute(input);

        const afterCreate = new Date();
        expect(output.created_at).toBeInstanceOf(Date);
        expect(output.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
        expect(output.created_at.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
      });
    });

    // TESTES DE CENÁRIOS ESPECÍFICOS DO SUPERMERCADO
    describe('supermarket specific scenarios', () => {
      it('should handle food categories correctly', async () => {
        const input = {
          name: 'Hortifruti',
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
          parent_category_id: null,
          display_order: 1,
        };

        const output = await useCase.execute(input);

        expect(output.parent_category_id).toBeNull();
        expect(output.display_order).toBe(1);
      });

      it('should handle subcategories correctly', async () => {
        const parentCategory = await useCase.execute({
          name: 'Bebidas',
        });

        const input = {
          name: 'Refrigerantes',
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