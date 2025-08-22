import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';
import { EntityValidationError } from '../../../../../shared/domain/validators/validation.error';
import { Client } from '../../../../domain/client.aggregate';
import { ClientInMemoryRepository } from '../../../../infra/db/in-memory/client-in-memory.repository';
import { GetClientUseCase } from '../get-client.use-case';
import { GetClientInput } from '../get-client.input';

describe('GetClientUseCase Unit Tests', () => {
  let useCase: GetClientUseCase;
  let repository: ClientInMemoryRepository;

  beforeEach(() => {
    repository = new ClientInMemoryRepository();
    useCase = new GetClientUseCase(repository);
  });

  describe('execute method', () => {
    it('should get a client', async () => {
      const client = Client.fake()
        .aClient()
        .withUserId('user-123')
        .withStoresId('store-123')
        .build();
      
      await repository.insert(client);

      const input = new GetClientInput({
        id: client.client_id.id,
        stores_id: 'store-123',
      });

      const output = await useCase.execute(input);

      expect(output).toStrictEqual({
        id: client.client_id.id,
        user_id: 'user-123',
        stores_id: 'store-123',
        customer_type: client.customer_type,
        loyalty_points: client.loyalty_points,
        loyalty_level: client.loyalty_level,
        loyalty_card_number: client.loyalty_card_number,
        total_purchases: client.total_purchases,
        avg_monthly_spending: client.avg_monthly_spending,
        last_purchase_date: client.last_purchase_date,
        credit_limit: client.credit_limit,
        preferred_contact_method: client.preferred_contact_method,
        allows_promotions: client.allows_promotions,
        allows_sms: client.allows_sms,
        allows_email: client.allows_email,
        payment_preference: client.payment_preference,
        delivery_preference: client.delivery_preference,
        registration_source: client.registration_source,
        notes: client.notes,
        is_active: client.is_active,
        created_at: client.created_at,
        updated_at: client.updated_at,
        deleted_at: client.deleted_at,
      });
    });

    it('should throw error when client not found', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      const input = new GetClientInput({
        id: fakeId,
        stores_id: 'store-123',
      });

      await expect(() => useCase.execute(input)).rejects.toThrow(
        new NotFoundError(fakeId, Client)
      );
    });

    it('should throw error when client does not belong to store (multi-tenancy)', async () => {
      const client = Client.fake()
        .aClient()
        .withStoresId('store-123')
        .build();
      
      await repository.insert(client);

      const input = new GetClientInput({
        id: client.client_id.id,
        stores_id: 'different-store',
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
});