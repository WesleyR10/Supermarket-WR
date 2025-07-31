import { CategoryInMemoryRepository } from '../../../../infra/db/in-memory/category-in-memory.repository';
import { ListCategoriesUseCase } from '../list-categories.use-case';
import { Category } from '../../../../domain/category.aggregate';

describe('ListCategoriesUseCase Unit Tests', () => {
  let useCase: ListCategoriesUseCase;
  let repository: CategoryInMemoryRepository;

  beforeEach(() => {
    repository = new CategoryInMemoryRepository();
    useCase = new ListCategoriesUseCase(repository);
  });

  it('should return categories with default search params', async () => {
    const categories = [
      Category.create({ store_id: 'store-123', name: 'Category 1' }),
      Category.create({ store_id: 'store-123', name: 'Category 2' }),
    ];
    
    await repository.bulkInsert(categories);

    const output = await useCase.execute({ filter: { store_id: 'store-123' } });

    expect(output.items).toHaveLength(2);
    expect(output.total).toBe(2);
    expect(output.current_page).toBe(1);
    expect(output.per_page).toBe(15);
    expect(output.last_page).toBe(1);
  });

  it('should return categories with search filter', async () => {
    const categories = [
      Category.create({ store_id: 'store-123', name: 'Bebidas' }),
      Category.create({ store_id: 'store-123', name: 'Alimentos' }),
      Category.create({ store_id: 'store-123', name: 'Bebidas Alcoólicas' }),
    ];
    
    await repository.bulkInsert(categories);

    const output = await useCase.execute({ filter: { name: 'Bebidas', store_id: 'store-123' } });

    expect(output.items).toHaveLength(2);
    expect(output.items[0].name).toContain('Bebidas');
    expect(output.items[1].name).toContain('Bebidas');
  });

  it('should return categories with pagination', async () => {
    const categories = Array.from({ length: 20 }, (_, i) => 
      Category.create({ store_id: 'store-123', name: `Category ${i + 1}` })
    );
    
    await repository.bulkInsert(categories);

    const output = await useCase.execute({ page: 2, per_page: 10, filter: { store_id: 'store-123' } });

    expect(output.items).toHaveLength(10);
    expect(output.current_page).toBe(2);
    expect(output.per_page).toBe(10);
    expect(output.total).toBe(20);
    expect(output.last_page).toBe(2);
  });

  it('should return categories sorted by name', async () => {
    const categories = [
      Category.create({ store_id: 'store-123', name: 'Zebra' }),
      Category.create({ store_id: 'store-123', name: 'Alpha' }),
      Category.create({ store_id: 'store-123', name: 'Beta' }),
    ];
    
    await repository.bulkInsert(categories);

    const output = await useCase.execute({ sort: 'name', sort_dir: 'asc', filter: { store_id: 'store-123' } });

    expect(output.items[0].name).toBe('Alpha');
    expect(output.items[1].name).toBe('Beta');
    expect(output.items[2].name).toBe('Zebra');
  });

  // Testa listagem isolada por store_id (multi-tenancy)
  it('should list only categories from specified store', async () => {
    const categories = [
      Category.create({ store_id: 'store1', name: 'Cat1' }),
      Category.create({ store_id: 'store2', name: 'Cat2' }),
    ];
    await repository.bulkInsert(categories);
    const output = await useCase.execute({ filter: { store_id: 'store1' } });
    expect(output.items).toHaveLength(1);
    expect(output.items[0].store_id).toBe('store1');
  });
});