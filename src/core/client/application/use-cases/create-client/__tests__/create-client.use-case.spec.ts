import { EntityValidationError } from '../../../../../shared/domain/validators/validation.error';
import { Client, CustomerType, ContactMethod, PaymentPreference, DeliveryPreference } from '../../../../domain/client.aggregate';
import { ClientInMemoryRepository } from '../../../../infra/db/in-memory/client-in-memory.repository';
import { CreateClientUseCase } from '../create-client.use-case';
import { CreateClientInput } from '../create-client.input';

describe('CreateClientUseCase Unit Tests', () => {
  let useCase: CreateClientUseCase;
  let repository: ClientInMemoryRepository;

  beforeEach(() => {
    repository = new ClientInMemoryRepository();
    useCase = new CreateClientUseCase(repository);
  });

  describe('execute method', () => {
    it('should create a client', async () => {
      const spyInsert = jest.spyOn(repository, 'insert');
      const input = new CreateClientInput({
        user_id: 'user-123',
        stores_id: 'store-123',
        customer_type: CustomerType.REGULAR,
        credit_limit: 1000,
        preferred_contact_method: ContactMethod.EMAIL,
        payment_preference: PaymentPreference.CREDIT_CARD,
        delivery_preference: DeliveryPreference.PICKUP,
        allows_promotions: true,
        allows_email: false,
        registration_source: 'MOBILE_APP',
        notes: 'Cliente preferencial'
      });

      const output = await useCase.execute(input);

      expect(spyInsert).toHaveBeenCalledTimes(1);
      expect(output).toStrictEqual({
        id: repository.items[0].client_id.id,
        user_id: 'user-123',
        stores_id: 'store-123',
        customer_type: CustomerType.REGULAR,
        loyalty_points: 0,
        loyalty_level: expect.any(String),
        loyalty_card_number: null,
        total_purchases: 0,
        avg_monthly_spending: null,
        last_purchase_date: null,
        credit_limit: 1000,
        preferred_contact_method: ContactMethod.EMAIL,
        payment_preference: PaymentPreference.CREDIT_CARD,
        delivery_preference: DeliveryPreference.PICKUP,
        allows_promotions: true,
        allows_sms: false,
        allows_email: false,
        registration_source: 'MOBILE_APP',
        notes: 'Cliente preferencial',
        is_active: true,
        created_at: expect.any(Date),
        updated_at: expect.any(Date),
        deleted_at: null,
      });
    });

    it('should throw error when client already exists for user and store', async () => {
      const existingClient = Client.fake()
        .aClient()
        .withUserId('user-123')
        .withStoresId('store-123')
        .build();
      
      await repository.insert(existingClient);

      const input = new CreateClientInput({
        user_id: 'user-123',
        stores_id: 'store-123',
        customer_type: CustomerType.REGULAR,
      });

      await expect(() => useCase.execute(input)).rejects.toThrow(
        new EntityValidationError([
          {
            user_id: ['Client already exists for this user and store'],
          },
        ])
      );
    });

    it('should throw error when client is invalid', async () => {
      const input = new CreateClientInput({
        user_id: '',
        stores_id: 'store-123',
        customer_type: CustomerType.REGULAR,
      });

      await expect(() => useCase.execute(input)).rejects.toThrow(
        EntityValidationError
      );
    });

    it('should create client with minimal required fields', async () => {
      const input = new CreateClientInput({
        user_id: 'user-456',
        stores_id: 'store-456',
        customer_type: CustomerType.REGULAR,
      });

      const output = await useCase.execute(input);

      expect(output.user_id).toBe('user-456');
      expect(output.stores_id).toBe('store-456');
      expect(output.customer_type).toBe(CustomerType.REGULAR);
      expect(output.loyalty_points).toBe(0);
      expect(output.total_purchases).toBe(0);
      expect(output.is_active).toBe(true);
    });

    it('should create VIP client with higher credit limit', async () => {
      const input = new CreateClientInput({
        user_id: 'user-vip',
        stores_id: 'store-123',
        customer_type: CustomerType.VIP,
        credit_limit: 5000,
      });

      const output = await useCase.execute(input);

      expect(output.customer_type).toBe(CustomerType.VIP);
      expect(output.credit_limit).toBe(5000);
    });
  });
});