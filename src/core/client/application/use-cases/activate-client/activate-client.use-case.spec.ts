import { ClientInMemoryRepository } from '../../../infra/db/in-memory/client-in-memory.repository';
import { ActivateClientUseCase } from './activate-client.use-case';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';
import { Client } from '../../../domain/client.aggregate';
import { ActivateClientInput } from './activate-client.input';

describe('ActivateClientUseCase Unit Tests', () => {
  let useCase: ActivateClientUseCase;
  let repository: ClientInMemoryRepository;

  beforeEach(() => {
    repository = new ClientInMemoryRepository();
    useCase = new ActivateClientUseCase(repository);
  });

  it('should activate a client', async () => {
    const client = Client.fake()
      .aClient()
      .withStoresId('store-123')
      .withUserId('user-1')
      .deactivate()
      .build();
    
    await repository.insert(client);

    const input = new ActivateClientInput({
      id: client.client_id.id,
      store_id: 'store-123',
    });

    await useCase.execute(input);

    const activatedClient = await repository.findById(client.client_id);
    expect(activatedClient).not.toBeNull();
    expect(activatedClient!.is_active).toBe(true);
  });

  it('should throw error when client not found', async () => {
    const input = new ActivateClientInput({
      id: '550e8400-e29b-41d4-a716-446655440000',
      store_id: 'store-123',
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
      .deactivate()
      .build();
    
    await repository.insert(client);

    const input = new ActivateClientInput({
      id: client.client_id.id,
      store_id: 'store-456', // Different store
    });

    await expect(() => useCase.execute(input)).rejects.toThrow(
      new EntityValidationError([
        {
          store_id: ['Client does not belong to this store'],
        },
      ])
    );
  });

  it('should activate an already active client without error', async () => {
    const client = Client.fake()
      .aClient()
      .withStoresId('store-123')
      .withUserId('user-1')
      .activate()
      .build();
    
    await repository.insert(client);

    const input = new ActivateClientInput({
      id: client.client_id.id,
      store_id: 'store-123',
    });

    await expect(useCase.execute(input)).resolves.not.toThrow();

    const activatedClient = await repository.findById(client.client_id);
    expect(activatedClient).not.toBeNull();
    expect(activatedClient!.is_active).toBe(true);
  });
});