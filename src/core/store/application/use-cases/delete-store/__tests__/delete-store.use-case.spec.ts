import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';
import { Store } from '../../../../domain/store.aggregate';
import { StoreInMemoryRepository } from '../../../../infra/db/in-memory/store-in-memory.repository';
import { DeleteStoreUseCase } from '../delete-store.use-case';

describe('DeleteStoreUseCase Unit Tests', () => {
  let useCase: DeleteStoreUseCase;
  let repository: StoreInMemoryRepository;

  beforeEach(() => {
    repository = new StoreInMemoryRepository();
    useCase = new DeleteStoreUseCase(repository);
  });

  it('should throw an error when store not found', async () => {
    const storeId = '550e8400-e29b-41d4-a716-446655440000';
    await expect(() => useCase.execute({ id: storeId })).rejects.toThrow(
      new NotFoundError(storeId, Store),
    );
  });

  it('should delete a store', async () => {
    const store = Store.create({
      name: 'Supermercado Teste',
      cnpj: '12.345.678/0001-90',
    });
    await repository.insert(store);

    // Verificar que a loja existe antes da exclusão
    const foundStore = await repository.findById(store.store_id);
    expect(foundStore).toBeDefined();

    // Executar a exclusão
    await useCase.execute({ id: store.store_id.id });

    // Verificar que a loja foi removida
    const deletedStore = await repository.findById(store.store_id);
    expect(deletedStore).toBeNull();
  });

  it('should call repository delete method', async () => {
    const store = Store.create({
      name: 'Supermercado Teste',
      cnpj: '12.345.678/0001-90',
    });
    await repository.insert(store);

    const deleteSpy = jest.spyOn(repository, 'delete');

    await useCase.execute({ id: store.store_id.id });

    expect(deleteSpy).toHaveBeenCalledWith(store.store_id);
  });
});