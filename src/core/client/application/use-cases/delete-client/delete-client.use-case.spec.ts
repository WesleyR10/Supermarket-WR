import { ClientInMemoryRepository } from '../../../infra/db/in-memory/client-in-memory.repository';
import { DeleteClientUseCase } from './delete-client.use-case';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';
import { Client } from '../../../domain/client.aggregate';
import { DeleteClientInput } from './delete-client.input';

describe('DeleteClientUseCase Unit Tests', () => {
  let useCase: DeleteClientUseCase;
  let repository: ClientInMemoryRepository;

  beforeEach(() => {
    repository = new ClientInMemoryRepository();
    useCase = new DeleteClientUseCase(repository);
  });

  it('should delete a client', async () => {
    const client = Client.fake()
      .aClient()
      .withStoresId('store-123')
      .withUserId('user-1')
      .build();
    
    await repository.insert(client);

    const input = new DeleteClientInput({
      id: client.client_id.id,
      stores_id: 'store-123',
    });

    await useCase.execute(input);

    const deletedClient = await repository.findById(client.client_id);
    expect(deletedClient).not.toBeNull();
    expect(deletedClient!.deleted_at).not.toBeNull();
    expect(deletedClient!.is_active).toBe(false);
  });

  it('should throw error when client not found', async () => {
    const input = new DeleteClientInput({
      id: '550e8400-e29b-41d4-a716-446655440000',
      stores_id: 'store-123',
    });

    await expect(() => useCase.execute(input)).rejects.toThrow(
      new NotFoundError(input.id, Client)
    );
  });

  it('should throw error when client belongs to different store (multi-tenancy)', async () => {
    const client = Client.fake()
      .aClient()
      .withStoresId('store-123')
      .withUserId('user-1')
      .build();
    
    await repository.insert(client);

    const input = new DeleteClientInput({
      id: client.client_id.id,
      stores_id: 'store-456', // Different store
    });

    await expect(() => useCase.execute(input)).rejects.toThrow(
      new EntityValidationError([
        {
          stores_id: ['Client does not belong to this store'],
        },
      ])
    );
  });
});