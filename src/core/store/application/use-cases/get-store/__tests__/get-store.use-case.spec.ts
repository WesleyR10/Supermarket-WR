import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';
import { Store } from '../../../../domain/store.aggregate';
import { StoreInMemoryRepository } from '../../../../infra/db/in-memory/store-in-memory.repository';
import { GetStoreUseCase } from '../get-store.use-case';

describe('GetStoreUseCase Unit Tests', () => {
  let useCase: GetStoreUseCase;
  let repository: StoreInMemoryRepository;

  beforeEach(() => {
    repository = new StoreInMemoryRepository();
    useCase = new GetStoreUseCase(repository);
  });

  it('should throw an error when store not found', async () => {
    // Usando um UUID válido que não existe no repositório
    const storeId = '550e8400-e29b-41d4-a716-446655440000';
    await expect(() => useCase.execute({ id: storeId })).rejects.toThrow(
      new NotFoundError(storeId, Store),
    );
  });

  it('should return a store', async () => {
    const store = Store.create({
      name: 'Supermercado Teste',
      cnpj: '12.345.678/0001-90',
    });
    await repository.insert(store);

    const output = await useCase.execute({ id: store.store_id.id });
    
    expect(output).toStrictEqual({
      id: store.store_id.id,
      name: 'Supermercado Teste',
      cnpj: '12.345.678/0001-90',
      status: store.status,
      settings: store.settings,
      subscription: store.subscription,
      created_at: store.created_at,
      updated_at: store.updated_at,
    });
  });
});