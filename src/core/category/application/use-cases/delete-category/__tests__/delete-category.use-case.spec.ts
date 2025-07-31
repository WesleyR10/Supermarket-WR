import { CategoryInMemoryRepository } from '../../../../infra/db/in-memory/category-in-memory.repository';
import { DeleteCategoryUseCase } from '../delete-category.use-case';
import { Category, CategoryId } from '../../../../domain/category.aggregate';
import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';
import { EntityValidationError } from '../../../../../shared/domain/validators/validation.error';

describe('DeleteCategoryUseCase Unit Tests', () => {
  let useCase: DeleteCategoryUseCase;
  let repository: CategoryInMemoryRepository;

  beforeEach(() => {
    repository = new CategoryInMemoryRepository();
    useCase = new DeleteCategoryUseCase(repository);
  });

  it('should throw error when category not found', async () => {
    const categoryId = new CategoryId();
    await expect(() => useCase.execute({ id: categoryId.id, store_id: 'store-123' })).rejects.toThrow(
      new NotFoundError(categoryId.id, Category)
    );
  });

  it('should delete a category', async () => {
    const category = Category.create({
      store_id: 'store-123',
      name: 'Category to Delete',
    });
    await repository.insert(category);
    expect(repository.items).toHaveLength(1);

    const spyDelete = jest.spyOn(repository, 'delete');
    await useCase.execute({ id: category.category_id.id, store_id: 'store-123' });

    expect(spyDelete).toHaveBeenCalledTimes(1);
    expect(repository.items).toHaveLength(0); // Verifica se foi removido fisicamente
    
    // Verifica se findById retorna null (não lança erro)
    const foundCategory = await repository.findById(category.category_id);
    expect(foundCategory).toBeNull();
  });

  it('should throw error when deleting category from another store', async () => {
    const category = Category.create({ store_id: 'store1', name: 'Test' });
    await repository.insert(category);

    await expect(() => useCase.execute({ id: category.category_id.id, store_id: 'store2' })).rejects.toThrow(EntityValidationError);

    try {
      await useCase.execute({ id: category.category_id.id, store_id: 'store2' });
    } catch (error) {
      expect(error).toBeInstanceOf(EntityValidationError);
      expect(error.error).toEqual(['Category does not belong to this store']);
    }
  });

  it('should throw error when category has subcategories', async () => {
    const parent = Category.create({ store_id: 'store1', name: 'Parent' });
    const child = Category.create({ store_id: 'store1', name: 'Child', parent_category_id: parent.category_id.id });
    await repository.insert(parent);
    await repository.insert(child);

    await expect(() => useCase.execute({ id: parent.category_id.id, store_id: 'store1' })).rejects.toThrow(EntityValidationError);

    try {
      await useCase.execute({ id: parent.category_id.id, store_id: 'store1' });
    } catch (error) {
      expect(error).toBeInstanceOf(EntityValidationError);
      expect(error.error).toEqual(['Cannot delete category with subcategories']);
    }
  });
});