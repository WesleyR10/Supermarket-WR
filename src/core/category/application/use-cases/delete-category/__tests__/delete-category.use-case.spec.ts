import { CategoryInMemoryRepository } from '../../../../infra/db/in-memory/category-in-memory.repository';
import { DeleteCategoryUseCase } from '../delete-category.use-case';
import { Category, CategoryId } from '../../../../domain/category.aggregate';
import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';

describe('DeleteCategoryUseCase Unit Tests', () => {
  let useCase: DeleteCategoryUseCase;
  let repository: CategoryInMemoryRepository;

  beforeEach(() => {
    repository = new CategoryInMemoryRepository();
    useCase = new DeleteCategoryUseCase(repository);
  });

  it('should throw error when category not found', async () => {
    const categoryId = new CategoryId();
    await expect(() => useCase.execute({ id: categoryId.id })).rejects.toThrow(
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
    await useCase.execute({ id: category.category_id.id });

    expect(spyDelete).toHaveBeenCalledTimes(1);
    expect(repository.items).toHaveLength(0); // Verifica se foi removido fisicamente
    
    // Verifica se findById retorna null (não lança erro)
    const foundCategory = await repository.findById(category.category_id);
    expect(foundCategory).toBeNull();
  });
});