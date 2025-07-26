import { CategoryInMemoryRepository } from '../../../../infra/db/in-memory/category-in-memory.repository';
import { UpdateCategoryUseCase } from '../update-category.use-case';
import { Category, CategoryId } from '../../../../domain/category.aggregate';
import { UpdateCategoryInput } from '../update-category.input';
import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';

describe('UpdateCategoryUseCase Unit Tests', () => {
  let useCase: UpdateCategoryUseCase;
  let repository: CategoryInMemoryRepository;

  beforeEach(() => {
    repository = new CategoryInMemoryRepository();
    useCase = new UpdateCategoryUseCase(repository);
  });

  it('should throw error when category not found', async () => {
    const categoryId = new CategoryId();
    const input: UpdateCategoryInput = {
      id: categoryId.id,
      name: 'Updated Category',
    };

    await expect(() => useCase.execute(input)).rejects.toThrow(
      new NotFoundError(categoryId.id, Category)
    );
  });

  it('should update a category', async () => {
    const category = Category.create({
      store_id: 'store-123',
      name: 'Original Category',
      description: 'Original description',
    });
    await repository.insert(category);

    const input: UpdateCategoryInput = {
      id: category.category_id.id,
      name: 'Updated Category',
      description: 'Updated description',
      is_active: false,
      tax_rate: 15.0,
      default_margin_percentage: 25.0,
      requires_expiry_date: true,
      display_order: 5,
      icon_name: 'updated-icon',
    };

    const output = await useCase.execute(input);

    expect(output).toStrictEqual({
      id: category.category_id.id,
      store_id: 'store-123',
      name: 'Updated Category',
      description: 'Updated description',
      is_active: false,
      parent_category_id: null,
      tax_rate: 15.0,
      default_margin_percentage: 25.0,
      requires_expiry_date: true,
      display_order: 5,
      icon_name: 'updated-icon',
      created_at: category.created_at,
      updated_at: expect.any(Date),
    });
  });

  it('should update only provided fields', async () => {
    const category = Category.create({
      store_id: 'store-123',
      name: 'Original Category',
      description: 'Original description',
      tax_rate: 10.0,
    });
    await repository.insert(category);

    const input: UpdateCategoryInput = {
      id: category.category_id.id,
      name: 'Updated Name Only',
    };

    const output = await useCase.execute(input);

    expect(output.name).toBe('Updated Name Only');
    expect(output.description).toBe('Original description');
    expect(output.tax_rate).toBe(10.0);
  });
});