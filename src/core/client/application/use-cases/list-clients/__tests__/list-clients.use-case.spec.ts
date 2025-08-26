import { CustomerType, LoyaltyLevel } from '../../../../domain/client.aggregate';
import { ClientInMemoryRepository } from '../../../../infra/db/in-memory/client-in-memory.repository';
import { ListClientsUseCase } from '../list-clients.use-case';
import { ListClientsInput } from '../list-clients.input';
import { Client } from '../../../../domain/client.aggregate';

describe('ListClientsUseCase Unit Tests', () => {
  let useCase: ListClientsUseCase;
  let repository: ClientInMemoryRepository;

  beforeEach(() => {
    repository = new ClientInMemoryRepository();
    useCase = new ListClientsUseCase(repository);
  });

  describe('execute method', () => {
    it('should list clients from specific store', async () => {
      const clients = [
        Client.fake().aClient().withStoresId('store-123').withUserId('user-1').build(),
        Client.fake().aClient().withStoresId('store-123').withUserId('user-2').build(),
        Client.fake().aClient().withStoresId('store-456').withUserId('user-3').build(), // Different store
      ];
      
      await Promise.all(clients.map(client => repository.insert(client)));

      const input = new ListClientsInput({
        filter: { store_id: 'store-123' },
      });

      const output = await useCase.execute(input);

      expect(output.items).toHaveLength(2);
      expect(output.items[0].store_id).toBe('store-123');
      expect(output.items[1].store_id).toBe('store-123');
      expect(output.total).toBe(2);
    });

    it('should filter by customer type', async () => {
      const clients = [
        Client.fake().aClient().withStoresId('store-123').withCustomerType(CustomerType.VIP).build(),
        Client.fake().aClient().withStoresId('store-123').withCustomerType(CustomerType.REGULAR).build(),
        Client.fake().aClient().withStoresId('store-123').withCustomerType(CustomerType.VIP).build(),
      ];
      
      await Promise.all(clients.map(client => repository.insert(client)));

      const input = new ListClientsInput({
        filter: { store_id: 'store-123', customer_type: CustomerType.VIP },
      });

      const output = await useCase.execute(input);

      expect(output.items).toHaveLength(2);
      expect(output.items.every(item => item.customer_type === CustomerType.VIP)).toBe(true);
    });

    it('should filter by loyalty level', async () => {
      const clients = [
        Client.fake().aClient().withStoresId('store-123').withLoyaltyLevel(LoyaltyLevel.GOLD).build(),
        Client.fake().aClient().withStoresId('store-123').withLoyaltyLevel(LoyaltyLevel.SILVER).build(),
        Client.fake().aClient().withStoresId('store-123').withLoyaltyLevel(LoyaltyLevel.GOLD).build(),
      ];
      
      await Promise.all(clients.map(client => repository.insert(client)));

      const input = new ListClientsInput({
        filter: { store_id: 'store-123', loyalty_level: LoyaltyLevel.GOLD },
      });

      const output = await useCase.execute(input);

      expect(output.items).toHaveLength(2);
      expect(output.items.every(item => item.loyalty_level === LoyaltyLevel.GOLD)).toBe(true);
    });

    it('should filter by active status', async () => {
      const clients = [
        Client.fake().aClient().withStoresId('store-123').activate().build(),
        Client.fake().aClient().withStoresId('store-123').deactivate().build(),
        Client.fake().aClient().withStoresId('store-123').activate().build(),
      ];
      
      await Promise.all(clients.map(client => repository.insert(client)));

      const input = new ListClientsInput({
        filter: { store_id: 'store-123', is_active: true },
      });

      const output = await useCase.execute(input);

      expect(output.items).toHaveLength(2);
      expect(output.items.every(item => item.is_active === true)).toBe(true);
    });

    it('should apply pagination', async () => {
      const clients = Array.from({ length: 20 }, (_, i) => 
        Client.fake().aClient().withStoresId('store-123').withUserId(`user-${i}`).build()
      );
      
      await Promise.all(clients.map(client => repository.insert(client)));

      const input = new ListClientsInput({
        filter: { store_id: 'store-123' },
        page: 2,
        per_page: 5,
      });

      const output = await useCase.execute(input);

      expect(output.items).toHaveLength(5);
      expect(output.current_page).toBe(2);
      expect(output.per_page).toBe(5);
      expect(output.total).toBe(20);
      expect(output.last_page).toBe(4);
    });

    it('should apply text filter', async () => {
      const clients = [
        Client.fake().aClient().withStoresId('store-123').withUserId('john-doe').build(),
        Client.fake().aClient().withStoresId('store-123').withUserId('jane-smith').build(),
        Client.fake().aClient().withStoresId('store-123').withUserId('bob-wilson').build(),
      ];
      
      await Promise.all(clients.map(client => repository.insert(client)));

      const input = new ListClientsInput({
        filter: { store_id: 'store-123', filter: 'john' },
      });

      const output = await useCase.execute(input);

      expect(output.items).toHaveLength(1);
      expect(output.items[0].user_id).toBe('john-doe');
    });

    it('should return empty list when no clients found', async () => {
      const input = new ListClientsInput({
        filter: { store_id: 'empty-store' },
      });

      const output = await useCase.execute(input);

      expect(output.items).toHaveLength(0);
      expect(output.total).toBe(0);
    });
  });
});