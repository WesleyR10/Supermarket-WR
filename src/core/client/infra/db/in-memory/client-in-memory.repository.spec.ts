import { Client, CustomerType, LoyaltyLevel } from '../../../domain/client.aggregate';
import { ClientInMemoryRepository } from './client-in-memory.repository';

describe('ClientInMemoryRepository', () => {
  let repository: ClientInMemoryRepository;

  beforeEach(() => (repository = new ClientInMemoryRepository()));

  describe('applyFilter method', () => {
    it('should not filter items when filter object is null', async () => {
      const items = [
        Client.fake().aClient().withUserId('user-123').build()
      ];
      const filterSpy = jest.spyOn(items, 'filter' as any);

      const itemsFiltered = await repository['applyFilter'](items, null);
      expect(filterSpy).not.toHaveBeenCalled();
      expect(itemsFiltered).toStrictEqual(items);
    });

    it('should filter by user_id', async () => {
      const items = [
        Client.fake().aClient().withUserId('user-123').build(),
        Client.fake().aClient().withUserId('user-456').build(),
        Client.fake().aClient().withUserId('other-789').build(),
      ];

      const itemsFiltered = await repository['applyFilter'](items, 'user-123' as any);
      expect(itemsFiltered).toStrictEqual([items[0]]);
    });

    it('should filter by store_id', async () => {
      const items = [
        Client.fake().aClient().withStoresId('store-123').build(),
        Client.fake().aClient().withStoresId('store-456').build(),
        Client.fake().aClient().withStoresId('other-789').build(),
      ];

      const itemsFiltered = await repository['applyFilter'](items, 'store-123' as any);
      expect(itemsFiltered).toStrictEqual([items[0]]);
    });

    it('should filter by loyalty_card_number', async () => {
      const items = [
        Client.fake().aClient().withLoyaltyCardNumber('CARD123').build(),
        Client.fake().aClient().withLoyaltyCardNumber('CARD456').build(),
        Client.fake().aClient().withLoyaltyCardNumber(null).build(),
      ];

      const itemsFiltered = await repository['applyFilter'](items, 'card123' as any);
      expect(itemsFiltered).toStrictEqual([items[0]]);
    });

    it('should filter by notes', async () => {
      const items = [
        Client.fake().aClient().withNotes('Cliente especial').build(),
        Client.fake().aClient().withNotes('Cliente regular').build(),
        Client.fake().aClient().withNotes(null).build(),
      ];

      const itemsFiltered = await repository['applyFilter'](items, 'especial' as any);
      expect(itemsFiltered).toStrictEqual([items[0]]);
    });

    it('should return empty array when no items match filter', async () => {
      const items = [
        Client.fake().aClient().withUserId('user-123').build(),
        Client.fake().aClient().withStoresId('store-456').build(),
      ];

      const itemsFiltered = await repository['applyFilter'](items, 'nonexistent' as any);
      expect(itemsFiltered).toHaveLength(0);
    });
  });

  describe('applySort method', () => {
    it('should sort by created_at desc when no sort is provided', async () => {
      const created_at = new Date();
      const items = [
        Client.fake().aClient().withCreatedAt(new Date(created_at.getTime() + 1000)).build(),
        Client.fake().aClient().withCreatedAt(new Date(created_at.getTime() + 2000)).build(),
        Client.fake().aClient().withCreatedAt(created_at).build(),
      ];

      const itemsSorted = await repository['applySort'](items, null, null);
      expect(itemsSorted).toStrictEqual([items[1], items[0], items[2]]);
    });

    it('should sort by loyalty_points asc', async () => {
      const items = [
        Client.fake().aClient().withLoyaltyPoints(500).build(),
        Client.fake().aClient().withLoyaltyPoints(100).build(),
        Client.fake().aClient().withLoyaltyPoints(1000).build(),
      ];

      const itemsSorted = await repository['applySort'](items, 'loyalty_points', 'asc');
      expect(itemsSorted).toStrictEqual([items[1], items[0], items[2]]);
    });

    it('should sort by avg_monthly_spending desc', async () => {
      const items = [
        Client.fake().aClient().withAvgMonthlySpending(500.50).build(),
        Client.fake().aClient().withAvgMonthlySpending(1000.75).build(),
        Client.fake().aClient().withAvgMonthlySpending(250.25).build(),
      ];

      const itemsSorted = await repository['applySort'](items, 'avg_monthly_spending', 'desc');
      expect(itemsSorted).toStrictEqual([items[1], items[0], items[2]]);
    });

    it('should sort by is_active desc', async () => {
      const items = [
        Client.fake().aClient().deactivate().build(),
        Client.fake().aClient().activate().build(),
        Client.fake().aClient().deactivate().build(),
      ];

      const itemsSorted = await repository['applySort'](items, 'is_active', 'desc');
      expect(itemsSorted).toStrictEqual([items[1], items[0], items[2]]);
    });
  });

  describe('Domain-specific methods', () => {
    beforeEach(async () => {
      const clients: Client[] = [];

      // Criar 3 clientes ativos para store-1
      for (let i = 1; i <= 3; i++) {
        clients.push(
          Client.fake()
            .aClient()
            .withUserId(`user-${i}`)
            .withStoresId('store-1')
            .withLastPurchaseDate(new Date()) // Data recente
            .activate()
            .build()
        );
      }

      // Cliente 4
      // ✅ ADICIONAR: Cliente com loyalty_card_number para teste 
      clients.push(
        Client.fake()
          .aClient()
          .withUserId('user-card-test')
          .withStoresId('store-1')
          .withLoyaltyCardNumber('CARD123')
          .activate()
          .build()
      );

      // Clientes determinísticos adicionais para cobrir VIP/DIAMOND/crédito/promotions
      clients.push(
        Client.fake()
          .aClient()
          .withUserId('user-vip-diamond')
          .withStoresId('store-1')
          .withCustomerType(CustomerType.VIP)
          .withLoyaltyLevel(LoyaltyLevel.DIAMOND)
          .withCreditLimit(1500)
          .withAllowsPromotions(true)
          .activate()
          .build()
      );

      // Criar 5 clientes ativos para store-2
      for (let i = 5; i <= 9; i++) {
        clients.push(
          Client.fake()
            .aClient()
            .withUserId(`user-${i}`)
            .withStoresId('store-2')
            .withLastPurchaseDate(new Date()) // Data recente
            .activate()
            .build()
        );
      }

      // Cliente de alto valor determinístico
      clients.push(
        Client.fake()
          .aClient()
          .withUserId('user-high-value')
          .withStoresId('store-2')
          .withHighValueClient()
          .activate()
          .build()
      );

      // Clientes para teste de spending range (500-1000)
      clients.push(
        Client.fake()
          .aClient()
          .withUserId('user-spending-600')
          .withStoresId('store-1')
          .withAvgMonthlySpending(600)
          .activate()
          .build()
      );
      
      clients.push(
        Client.fake()
          .aClient()
          .withUserId('user-spending-800')
          .withStoresId('store-2')
          .withAvgMonthlySpending(800)
          .activate()
          .build()
      );

      // Criar 2 clientes inativos para store-1
      for (let i = 10; i <= 11; i++) {
        clients.push(
          Client.fake()
            .aClient()
            .withUserId(`user-${i}`)
            .withStoresId('store-1')
            .withLastPurchaseDate(new Date()) // Data recente
            .deactivate()
            .build()
        );
      }

      // Criar 2 clientes em risco (última compra há mais de 90 dias)
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 100); // 100 dias atrás
      
      for (let i = 12; i <= 13; i++) {
        clients.push(
          Client.fake()
            .aClient()
            .withUserId(`user-${i}`)
            .withStoresId('store-2')
            .withLastPurchaseDate(oldDate)
            .activate()
            .build()
        );
      }

      await repository.bulkInsert(clients);
    });

    describe('findActiveClients', () => {
      it('should find only active clients', async () => {
        const result = await repository.findActiveClients();
        expect(result).toHaveLength(15); // 6 (store-1) + 7 (store-2) + 2 (em risco)
        expect(result.every(client => client.is_active)).toBe(true);
      });
    });

    describe('findByStoreId', () => {
      it('should find clients by store id', async () => {
        const result = await repository.findByStoreId('store-1');
        expect(result).toHaveLength(8); // 6 ativos + 2 inativos (adicionamos 1 cliente para spending range)
        expect(result.every(client => client.store_id === 'store-1')).toBe(true);
      });
    });

    describe('findAtRiskClients', () => {
      it('should find at risk clients', async () => {
        const result = await repository.findAtRiskClients();
        expect(result.length).toBeGreaterThan(0); // Deve encontrar os 2 clientes em risco
        expect(result.every(client => client.isAtRiskClient())).toBe(true);
      });
    });

    describe('findByUserId', () => {
      it('should find clients by user id', async () => {
        const result = await repository.findByUserId('user-1');
        expect(result).toHaveLength(1);
        expect(result[0].user_id).toBe('user-1');
      });
    });

    describe('findByUserIdAndStoreId', () => {
      it('should find client by user id and store id', async () => {
        const result = await repository.findByUserIdAndStoreId('user-1', 'store-1');
        expect(result).not.toBeNull();
        expect(result!.user_id).toBe('user-1');
        expect(result!.store_id).toBe('store-1');
      });

      it('should return null when client not found', async () => {
        const result = await repository.findByUserIdAndStoreId('user-1', 'store-999');
        expect(result).toBeNull();
      });
    });

    describe('findByLoyaltyLevel', () => {
      it('should find clients by loyalty level', async () => {
        const result = await repository.findByLoyaltyLevel(LoyaltyLevel.DIAMOND);
        expect(result.length).toBeGreaterThan(0);
        expect(result.every(client => client.loyalty_level === LoyaltyLevel.DIAMOND)).toBe(true);
      });
    });

    describe('findByCustomerType', () => {
      it('should find clients by customer type', async () => {
        const result = await repository.findByCustomerType(CustomerType.VIP);
        expect(result.length).toBeGreaterThan(0);
        expect(result.every(client => client.customer_type === CustomerType.VIP)).toBe(true);
      });
    });

    describe('findVipClients', () => {
      it('should find VIP clients', async () => {
        const result = await repository.findVipClients();
        expect(result.length).toBeGreaterThan(0);
        expect(result.every(client => client.isVipClient())).toBe(true);
      });
    });

    describe('findHighValueClients', () => {
      it('should find high value clients', async () => {
        const result = await repository.findHighValueClients();
        expect(result.length).toBeGreaterThan(0);
        expect(result.every(client => client.isHighValueClient())).toBe(true);
      });
    });

    describe('findAtRiskClients', () => {
      it('should find at risk clients', async () => {
        const result = await repository.findAtRiskClients();
        expect(result.length).toBeGreaterThan(0);
        expect(result.every(client => client.isAtRiskClient())).toBe(true);
      });
    });

    describe('findClientsWithCreditLimit', () => {
      it('should find clients with credit limit', async () => {
        const result = await repository.findClientsWithCreditLimit();
        expect(result.length).toBeGreaterThan(0);
        expect(result.every(client => client.credit_limit !== null && client.credit_limit > 0)).toBe(true);
      });
    });

    describe('findByLoyaltyCardNumber', () => {
      it('should find client by loyalty card number', async () => {
        const result = await repository.findByLoyaltyCardNumber('CARD123');
        expect(result).not.toBeNull();
        expect(result!.loyalty_card_number).toBe('CARD123');
      });

      it('should return null when card not found', async () => {
        const result = await repository.findByLoyaltyCardNumber('NONEXISTENT');
        expect(result).toBeNull();
      });
    });

    describe('findClientsForPromotions', () => {
      it('should find active clients that allow promotions', async () => {
        const result = await repository.findClientsForPromotions();
        expect(result.length).toBeGreaterThan(0);
        expect(result.every(client => client.is_active && client.allows_promotions)).toBe(true);
      });
    });

    describe('findClientsBySpendingRange', () => {
      it('should find clients by spending range', async () => {
        const result = await repository.findClientsBySpendingRange(500, 1000);
        expect(result.length).toBeGreaterThan(0);
        expect(result.every(client => 
          client.avg_monthly_spending !== null &&
          client.avg_monthly_spending >= 500 &&
          client.avg_monthly_spending <= 1000
        )).toBe(true);
      });
    });
  });
});