import { Store } from '../../../../domain/store.aggregate';
import { StoreInMemoryRepository } from '../../../../infra/db/in-memory/store-in-memory.repository';
import { ListStoresUseCase } from '../list-stores.use-case';

describe('ListStoresUseCase Unit Tests', () => {
  let useCase: ListStoresUseCase;
  let repository: StoreInMemoryRepository;

  beforeEach(() => {
    repository = new StoreInMemoryRepository();
    useCase = new ListStoresUseCase(repository);
  });

  it('should return empty list when no stores exist', async () => {
    const output = await useCase.execute({});

    expect(output).toStrictEqual({
      items: [],
      total: 0,
      current_page: 1,
      per_page: 15,
      last_page: 0,
    });
  });

  it('should return paginated stores', async () => {
    const stores = [
      Store.create({ name: 'Supermercado A', cnpj: '11.111.111/0001-11' }),
      Store.create({ name: 'Supermercado B', cnpj: '22.222.222/0001-22' }),
      Store.create({ name: 'Supermercado C', cnpj: '33.333.333/0001-33' }),
    ];

    for (const store of stores) {
      await repository.insert(store);
    }

    const output = await useCase.execute({
      page: 1,
      per_page: 2,
    });

    expect(output.items).toHaveLength(2);
    expect(output.total).toBe(3);
    expect(output.current_page).toBe(1);
    expect(output.per_page).toBe(2);
    expect(output.last_page).toBe(2);
  });

  it('should return stores with default pagination', async () => {
    const stores = Array.from({ length: 20 }, (_, i) => 
      Store.create({ 
        name: `Supermercado ${i + 1}`, 
        cnpj: `${String(i + 1).padStart(2, '0')}.111.111/0001-11` 
      })
    );

    for (const store of stores) {
      await repository.insert(store);
    }

    const output = await useCase.execute({});

    expect(output.items).toHaveLength(15); // Default per_page
    expect(output.total).toBe(20);
    expect(output.current_page).toBe(1);
    expect(output.per_page).toBe(15);
    expect(output.last_page).toBe(2);
  });

  it('should return stores sorted by name', async () => {
    const stores = [
      Store.create({ name: 'Supermercado Z', cnpj: '11.111.111/0001-11' }),
      Store.create({ name: 'Supermercado A', cnpj: '22.222.222/0001-22' }),
      Store.create({ name: 'Supermercado M', cnpj: '33.333.333/0001-33' }),
    ];

    for (const store of stores) {
      await repository.insert(store);
    }

    const output = await useCase.execute({
      sort: 'name',
      sort_dir: 'asc',
    });

    expect(output.items[0].name).toBe('Supermercado A');
    expect(output.items[1].name).toBe('Supermercado M');
    expect(output.items[2].name).toBe('Supermercado Z');
  });

  it('should return stores sorted by name descending', async () => {
    const stores = [
      Store.create({ name: 'Supermercado A', cnpj: '11.111.111/0001-11' }),
      Store.create({ name: 'Supermercado Z', cnpj: '22.222.222/0001-22' }),
      Store.create({ name: 'Supermercado M', cnpj: '33.333.333/0001-33' }),
    ];

    for (const store of stores) {
      await repository.insert(store);
    }

    const output = await useCase.execute({
      sort: 'name',
      sort_dir: 'desc',
    });

    expect(output.items[0].name).toBe('Supermercado Z');
    expect(output.items[1].name).toBe('Supermercado M');
    expect(output.items[2].name).toBe('Supermercado A');
  });

  it('should filter stores by name', async () => {
    const stores = [
      Store.create({ name: 'Supermercado Central', cnpj: '11.111.111/0001-11' }),
      Store.create({ name: 'Mercado do Bairro', cnpj: '22.222.222/0001-22' }),
      Store.create({ name: 'Supermercado Norte', cnpj: '33.333.333/0001-33' }),
    ];

    for (const store of stores) {
      await repository.insert(store);
    }

    const output = await useCase.execute({
      filter: { name: 'Supermercado' },
    });

    expect(output.items).toHaveLength(2);
    expect(output.items[0].name).toContain('Supermercado');
    expect(output.items[1].name).toContain('Supermercado');
  });

  it('should call repository search method', async () => {
    const searchSpy = jest.spyOn(repository, 'search');

    await useCase.execute({
      page: 1,
      per_page: 10,
      sort: 'name',
      sort_dir: 'asc',
    });

    expect(searchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        per_page: 10,
        sort: 'name',
        sort_dir: 'asc',
      })
    );
  });
});