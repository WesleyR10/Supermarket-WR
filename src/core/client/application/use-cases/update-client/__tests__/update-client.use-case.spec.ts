import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';
import { EntityValidationError } from '../../../../../shared/domain/validators/validation.error';
import { Client, CustomerType, ContactMethod, PaymentPreference, DeliveryPreference } from '../../../../domain/client.aggregate';
import { ClientInMemoryRepository } from '../../../../infra/db/in-memory/client-in-memory.repository';
import { UpdateClientUseCase } from '../update-client.use-case';
import { UpdateClientInput } from '../update-client.input';

describe('UpdateClientUseCase Unit Tests', () => {
  let useCase: UpdateClientUseCase;
  let repository: ClientInMemoryRepository;

  beforeEach(() => {
    repository = new ClientInMemoryRepository();
    useCase = new UpdateClientUseCase(repository);
  });

  describe('execute method', () => {
    it('should update a client', async () => {
      const client = Client.fake()
        .aClient()
        .withUserId('user-123')
        .withStoresId('store-123')
        .withCustomerType(CustomerType.REGULAR)
        .withLoyaltyPoints(0)
        .withLoyaltyCardNumber(null)
        .withAvgMonthlySpending(null)
        .withLastPurchaseDate(null)
        .withAllowsPromotions(true) // Definir valor inicial explícito
        .build();
      
      await repository.insert(client);
      const spyUpdate = jest.spyOn(repository, 'update');

      const input = new UpdateClientInput({
        id: client.client_id.id,
        store_id: 'store-123',
        customer_type: CustomerType.VIP,
        credit_limit: 2000,
        preferred_contact_method: ContactMethod.WHATSAPP,
        payment_preference: PaymentPreference.PIX,
        delivery_preference: DeliveryPreference.HOME_DELIVERY,
        allows_promotions: false,
        allows_email: true,
        registration_source: 'WEBSITE',
        notes: 'Cliente atualizado',
        is_active: true
      });

      const output = await useCase.execute(input);

      expect(spyUpdate).toHaveBeenCalledTimes(1);
      expect(output).toStrictEqual({
        id: client.client_id.id,
        user_id: 'user-123',
        store_id: 'store-123',
        customer_type: CustomerType.VIP,
        loyalty_points: expect.any(Number),
        loyalty_level: expect.any(String),
        loyalty_card_number: null,
        total_purchases: expect.any(Number),
        avg_monthly_spending: null,
        last_purchase_date: null,
        credit_limit: 2000,
        preferred_contact_method: ContactMethod.WHATSAPP,
        payment_preference: PaymentPreference.PIX,
        delivery_preference: DeliveryPreference.HOME_DELIVERY,
        allows_promotions: false,
        allows_sms: expect.any(Boolean),
        allows_email: true,
        registration_source: 'WEBSITE',
        notes: 'Cliente atualizado',
        is_active: true,
        created_at: expect.any(Date),
        updated_at: expect.any(Date),
        deleted_at: null
      });
    });

    it('should throw error when client not found', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      const input = new UpdateClientInput({
        id: fakeId,
        store_id: 'store-123',
        customer_type: CustomerType.REGULAR,
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

      const input = new UpdateClientInput({
        id: client.client_id.id,
        store_id: 'different-store',
        customer_type: CustomerType.REGULAR,
      });

      await expect(() => useCase.execute(input)).rejects.toThrow(
        new EntityValidationError([
          {
            store_id: ['Client does not belong to this store'],
          },
        ])
      );
    });

    it('should update only provided fields', async () => {
      const client = Client.fake()
        .aClient()
        .withUserId('user-123')
        .withStoresId('store-123')
        .withCustomerType(CustomerType.REGULAR)
        .withCreditLimit(1000)
        .build();
      
      await repository.insert(client);
      const originalCustomerType = client.customer_type;
      const originalCreditLimit = client.credit_limit;

      const input = new UpdateClientInput({
        id: client.client_id.id,
        store_id: 'store-123',
        notes: 'Apenas nota atualizada'
      });

      const output = await useCase.execute(input);

      expect(output.customer_type).toBe(originalCustomerType);
      expect(output.credit_limit).toBe(originalCreditLimit);
      expect(output.notes).toBe('Apenas nota atualizada');
    });

    it('should deactivate client', async () => {
      const client = Client.fake()
        .aClient()
        .withStoresId('store-123')
        .activate()
        .build();
      
      await repository.insert(client);

      const input = new UpdateClientInput({
        id: client.client_id.id,
        store_id: 'store-123',
        is_active: false
      });

      const output = await useCase.execute(input);

      expect(output.is_active).toBe(false);
    });
  });
});