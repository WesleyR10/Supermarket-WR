import { CategoryInMemoryRepository } from '../../../../infra/db/in-memory/category-in-memory.repository';
import { GetCategoryUseCase } from '../get-category.use-case';
import { Category, CategoryId } from '../../../../domain/category.aggregate';
import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';
import { EntityValidationError } from '@core/shared/domain/validators/validation.error';

describe('GetCategoryUseCase Unit Tests', () => {
  let useCase: GetCategoryUseCase;
  let repository: CategoryInMemoryRepository;

  beforeEach(() => {
    repository = new CategoryInMemoryRepository();
    useCase = new GetCategoryUseCase(repository);
  });

  it('should throw error when category not found', async () => {
    const categoryId = new CategoryId();
    await expect(() => useCase.execute({ id: categoryId.id, store_id: 'store-123' })).rejects.toThrow(
      new NotFoundError(categoryId.id, Category)
    );
  });

  it('should return a category', async () => {
    const category = Category.create({
      store_id: 'store-123',
      name: 'Test Category',
      description: 'Test description',
      tax_rate: 12.0,
      default_margin_percentage: 30.0,
      requires_expiry_date: true,
      display_order: 3,
      icon_name: 'test-icon',
    });
    await repository.insert(category);

    const output = await useCase.execute({ id: category.category_id.id, store_id: 'store-123' });

    expect(output).toStrictEqual({
      id: category.category_id.id,
      store_id: 'store-123',
      name: 'Test Category',
      description: 'Test description',
      is_active: true,
      parent_category_id: null,
      tax_rate: 12.0,
      default_margin_percentage: 30.0,
      requires_expiry_date: true,
      display_order: 3,
      icon_name: 'test-icon',
      created_at: category.created_at,
      updated_at: category.updated_at,
    });
  });

  // Testa erro ao buscar categoria de outro store (multi-tenancy)
  it('should throw error when getting category from another store', async () => {
    const category = Category.create({ store_id: 'store1', name: 'Test' });
    await repository.insert(category);

    try {
      await useCase.execute({ id: category.category_id.id, store_id: 'store2' });
      fail('should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(EntityValidationError);
      expect(e.error).toEqual([
        {
          store_id: ['Category does not belong to this store'],
        },
      ]);
    }
  });
});