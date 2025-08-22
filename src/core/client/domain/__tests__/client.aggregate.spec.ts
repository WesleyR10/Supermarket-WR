import { Client, ClientId, CustomerType, LoyaltyLevel, ContactMethod, PaymentPreference, DeliveryPreference } from '../client.aggregate';

describe('Client Aggregate Unit Tests', () => {
  describe('constructor', () => {
    test('should create client with default values', () => {
      const client = Client.fake()
        .aClient()
        .withUserId('user-123')
        .withStoresId('store-123')
        .withLoyaltyPoints(0)
        .withLoyaltyLevel(LoyaltyLevel.BRONZE)
        .withLoyaltyCardNumber(null)
        .withCustomerType(CustomerType.INDIVIDUAL)
        .withAvgMonthlySpending(null)
        .withTotalPurchases(0)
        .withCreditLimit(null)
        .withPreferredContactMethod(ContactMethod.NONE)
        .withAllowsPromotions(true)
        .withAllowsSms(false)
        .withAllowsEmail(false)
        .withPaymentPreference(PaymentPreference.NONE)
        .withDeliveryPreference(DeliveryPreference.NONE)
        .withLastPurchaseDate(null)
        .withRegistrationSource(null)
        .withNotes(null)
        .activate()
        .withDeletedAt(null)
        .build();

      expect(client.client_id).toBeInstanceOf(ClientId);
      expect(client.user_id).toBe('user-123');
      expect(client.stores_id).toBe('store-123');
      expect(client.loyalty_points).toBe(0);
      expect(client.loyalty_level).toBe(LoyaltyLevel.BRONZE);
      expect(client.loyalty_card_number).toBeNull();
      expect(client.customer_type).toBe(CustomerType.INDIVIDUAL);
      expect(client.avg_monthly_spending).toBeNull();
      expect(client.total_purchases).toBe(0);
      expect(client.credit_limit).toBeNull();
      expect(client.preferred_contact_method).toBe(ContactMethod.NONE);
      expect(client.allows_promotions).toBe(true);
      expect(client.allows_sms).toBe(false);
      expect(client.allows_email).toBe(false);
      expect(client.payment_preference).toBe(PaymentPreference.NONE);
      expect(client.delivery_preference).toBe(DeliveryPreference.NONE);
      expect(client.last_purchase_date).toBeNull();
      expect(client.registration_source).toBeNull();
      expect(client.notes).toBeNull();
      expect(client.is_active).toBe(true);
      expect(client.created_at).toBeInstanceOf(Date);
      expect(client.updated_at).toBeInstanceOf(Date);
      expect(client.deleted_at).toBeNull();
    });

    test('should create client with all properties', () => {
      const client = Client.fake()
        .aClient()
        .withUserId('user-456')
        .withStoresId('store-456')
        .withLoyaltyPoints(2500)
        .withLoyaltyLevel(LoyaltyLevel.SILVER)
        .withLoyaltyCardNumber('CARD123456')
        .withCustomerType(CustomerType.VIP)
        .withAvgMonthlySpending(1500.50)
        .withTotalPurchases(25)
        .withCreditLimit(5000.00)
        .withPreferredContactMethod(ContactMethod.EMAIL)
        .withAllowsPromotions(true)
        .withAllowsSms(true)
        .withAllowsEmail(true)
        .withPaymentPreference(PaymentPreference.CREDIT_CARD)
        .withDeliveryPreference(DeliveryPreference.HOME_DELIVERY)
        .withRegistrationSource('website')
        .withNotes('Cliente VIP com histórico de compras')
        .deactivate()
        .build();

      expect(client.user_id).toBe('user-456');
      expect(client.stores_id).toBe('store-456');
      expect(client.loyalty_points).toBe(2500);
      expect(client.loyalty_level).toBe(LoyaltyLevel.SILVER);
      expect(client.loyalty_card_number).toBe('CARD123456');
      expect(client.customer_type).toBe(CustomerType.VIP);
      expect(client.avg_monthly_spending).toBe(1500.50);
      expect(client.total_purchases).toBe(25);
      expect(client.credit_limit).toBe(5000.00);
      expect(client.preferred_contact_method).toBe(ContactMethod.EMAIL);
      expect(client.allows_promotions).toBe(true);
      expect(client.allows_sms).toBe(true);
      expect(client.allows_email).toBe(true);
      expect(client.payment_preference).toBe(PaymentPreference.CREDIT_CARD);
      expect(client.delivery_preference).toBe(DeliveryPreference.HOME_DELIVERY);
      expect(client.registration_source).toBe('website');
      expect(client.notes).toBe('Cliente VIP com histórico de compras');
      expect(client.is_active).toBe(false);
    });

    test('should create client using static create method', () => {
      const client = Client.create({
        user_id: 'user-789',
        stores_id: 'store-789',
        customer_type: CustomerType.BUSINESS,
        credit_limit: 10000.00,
        preferred_contact_method: ContactMethod.WHATSAPP,
        allows_promotions: false,
        allows_sms: true,
        allows_email: true,
        payment_preference: PaymentPreference.PIX,
        delivery_preference: DeliveryPreference.WORKPLACE_DELIVERY,
        registration_source: 'app',
        notes: 'Cliente empresarial'
      });

      expect(client.user_id).toBe('user-789');
      expect(client.stores_id).toBe('store-789');
      expect(client.customer_type).toBe(CustomerType.BUSINESS);
      expect(client.credit_limit).toBe(10000.00);
      expect(client.preferred_contact_method).toBe(ContactMethod.WHATSAPP);
      expect(client.allows_promotions).toBe(false);
      expect(client.allows_sms).toBe(true);
      expect(client.allows_email).toBe(true);
      expect(client.payment_preference).toBe(PaymentPreference.PIX);
      expect(client.delivery_preference).toBe(DeliveryPreference.WORKPLACE_DELIVERY);
      expect(client.registration_source).toBe('app');
      expect(client.notes).toBe('Cliente empresarial');
      expect(client.is_active).toBe(true);
    });
  });

  describe('business methods', () => {
    let client: Client;

    beforeEach(() => {
      client = Client.fake()
        .aClient()
        .withUserId('user-test')
        .withStoresId('store-test')
        .withLoyaltyPoints(500)
        .withTotalPurchases(10)
        .build();
    });

    describe('loyalty program methods', () => {
      test('should add loyalty points', () => {
        const initialPoints = client.loyalty_points;
        const pointsToAdd = 250;
        
        client.addLoyaltyPoints(pointsToAdd);
        
        expect(client.loyalty_points).toBe(initialPoints + pointsToAdd);
        expect(client.updated_at).toBeInstanceOf(Date);
      });

      test('should redeem loyalty points', () => {
        client.addLoyaltyPoints(1000); // Garantir pontos suficientes
        const initialPoints = client.loyalty_points;
        const pointsToRedeem = 300;
        
        client.redeemLoyaltyPoints(pointsToRedeem);
        
        expect(client.loyalty_points).toBe(initialPoints - pointsToRedeem);
        expect(client.updated_at).toBeInstanceOf(Date);
      });

      test('should not allow redeeming more points than available', () => {
        const pointsToRedeem = client.loyalty_points + 100;
        
        expect(() => {
          client.redeemLoyaltyPoints(pointsToRedeem);
        }).toThrow('Pontos insuficientes para resgate');
      });

      test('should calculate loyalty level correctly', () => {
        // Bronze: 0-999 pontos
        client.addLoyaltyPoints(400); // Total: 900
        expect(client.loyalty_level).toBe(LoyaltyLevel.BRONZE);
        
        // Silver: 1000-2999 pontos
        client.addLoyaltyPoints(600); // Total: 1500
        expect(client.loyalty_level).toBe(LoyaltyLevel.SILVER);
        
        // Gold: 3000-4999 pontos
        client.addLoyaltyPoints(2000); // Total: 3500
        expect(client.loyalty_level).toBe(LoyaltyLevel.GOLD);
        
        // Platinum: 5000-9999 pontos
        client.addLoyaltyPoints(2000); // Total: 5500
        expect(client.loyalty_level).toBe(LoyaltyLevel.PLATINUM);
        
        // Diamond: 10000+ pontos
        client.addLoyaltyPoints(5000); // Total: 10500
        expect(client.loyalty_level).toBe(LoyaltyLevel.DIAMOND);
      });

      test('should generate loyalty card number', () => {
        // Criar cliente sem cartão fidelidade
        const clientWithoutCard = Client.fake()
          .aClient()
          .withUserId('user-test')
          .withStoresId('store-test')
          .withLoyaltyCardNumber(null)
          .build();
        
        expect(clientWithoutCard.loyalty_card_number).toBeNull();
        
        clientWithoutCard.generateLoyaltyCard();
        
        expect(clientWithoutCard.loyalty_card_number).toBeDefined();
        expect(clientWithoutCard.loyalty_card_number).toMatch(/^\d{10}$/);
        expect(clientWithoutCard.updated_at).toBeInstanceOf(Date);
      });
    });

    describe('customer segmentation methods', () => {
      test('should update customer type', () => {
        client.updateCustomerType(CustomerType.VIP);
        
        expect(client.customer_type).toBe(CustomerType.VIP);
        expect(client.updated_at).toBeInstanceOf(Date);
      });

      test('should update purchase statistics', () => {
        const newAvgSpending = 2500.75;
        
        client.updatePurchaseStats(newAvgSpending);
        
        expect(client.avg_monthly_spending).toBe(newAvgSpending);
        expect(client.updated_at).toBeInstanceOf(Date);
      });

      test('should set credit limit', () => {
        const creditLimit = 3000.00;
        
        client.setCreditLimit(creditLimit);
        
        expect(client.credit_limit).toBe(creditLimit);
        expect(client.updated_at).toBeInstanceOf(Date);
      });

      test('should not allow negative credit limit', () => {
        expect(() => {
          client.setCreditLimit(-100);
        }).toThrow('Limite de crédito não pode ser negativo');
      });
    });

    describe('preference methods', () => {
      test('should update contact preferences', () => {
        client.updateContactPreferences(ContactMethod.SMS);
        
        expect(client.preferred_contact_method).toBe(ContactMethod.SMS);
        expect(client.updated_at).toBeInstanceOf(Date);
      });

      test('should update payment preference', () => {
        client.updatePaymentPreference(PaymentPreference.PIX);
        
        expect(client.payment_preference).toBe(PaymentPreference.PIX);
        expect(client.updated_at).toBeInstanceOf(Date);
      });

      test('should update delivery preference', () => {
        client.updateDeliveryPreference(DeliveryPreference.HOME_DELIVERY);
        
        expect(client.delivery_preference).toBe(DeliveryPreference.HOME_DELIVERY);
        expect(client.updated_at).toBeInstanceOf(Date);
      });
    });

    describe('activity methods', () => {
      test('should activate client', () => {
        client.deactivate();
        client.activate();
        
        expect(client.is_active).toBe(true);
        expect(client.updated_at).toBeInstanceOf(Date);
      });

      test('should deactivate client', () => {
        client.deactivate();
        
        expect(client.is_active).toBe(false);
        expect(client.updated_at).toBeInstanceOf(Date);
      });

      test('should add note', () => {
        const freshClient = Client.fake()
          .aClient()
          .withUserId('user-123')
          .withStoresId('store-123')
          .build();
        const note = 'Cliente preferencial com desconto especial';
        
        freshClient.addNote(note);
        
        expect(freshClient.notes).toBe(note);
        expect(freshClient.updated_at).toBeInstanceOf(Date);
      });
    });

    describe('purchase tracking methods', () => {
      test('should record purchase', () => {
        const purchaseAmount = 150.75;
        const initialPurchases = client.total_purchases;
        
        client.recordPurchase(purchaseAmount);
        
        expect(client.total_purchases).toBe(initialPurchases + 1);
        expect(client.last_purchase_date).toBeInstanceOf(Date);
        expect(client.updated_at).toBeInstanceOf(Date);
      });

      test('should not allow negative purchase amount', () => {
        expect(() => {
          client.recordPurchase(-50);
        }).toThrow('Valor da compra deve ser positivo');
      });
    });
  });

  describe('validation', () => {
    test('should have validation error without user_id', () => {
      // @ts-ignore user_id omitido intencionalmente
      const client = Client.create({
        stores_id: 'store-123'
      });

      expect(client.notification.hasErrors()).toBe(true);
      expect(client.notification.errors.size).toBe(1);
      expect(client.notification.errors.has('user_id')).toBe(true);
    });

    test('should have validation error without stores_id', () => {
      // @ts-ignore stores_id omitido intencionalmente
      const client = Client.create({
        user_id: 'user-123'
      });

      expect(client.notification.hasErrors()).toBe(true);
      expect(client.notification.errors.size).toBe(1);
      expect(client.notification.errors.has('stores_id')).toBe(true);
    });

    test('should have validation error with invalid loyalty points', () => {
      const client = Client.fake()
        .aClient()
        .withUserId('user-123')
        .withStoresId('store-123')
        .withLoyaltyPoints(-100)
        .build();

      client.validate(['loyalty_points']);
      
      expect(client.notification.hasErrors()).toBe(true);
      expect(client.notification.errors.has('loyalty_points')).toBe(true);
    });

    test('should have validation error with invalid total purchases', () => {
      const client = Client.fake()
        .aClient()
        .withUserId('user-123')
        .withStoresId('store-123')
        .withTotalPurchases(-5)
        .build();

      client.validate(['total_purchases']);
      
      expect(client.notification.hasErrors()).toBe(true);
      expect(client.notification.errors.has('total_purchases')).toBe(true);
    });
  });

  describe('multi-tenancy and store isolation', () => {
    test('should belong to specific store', () => {
      const storeId = 'store-specific-123';
      const client = Client.fake()
        .aClient()
        .withUserId('user-123')
        .withStoresId(storeId)
        .build();

      expect(client.stores_id).toBe(storeId);
    });

    test('should validate store_id is required', () => {
      // @ts-ignore stores_id omitido intencionalmente
      const client = Client.create({
        user_id: 'user-123'
      });

      expect(client.notification.hasErrors()).toBe(true);
      expect(client.notification.errors.has('stores_id')).toBe(true);
    });
  });

  describe('supermarket specific features', () => {
    test('should handle loyalty program correctly', () => {
      const client = Client.fake()
        .aClient()
        .withUserId('user-loyalty')
        .withStoresId('store-loyalty')
        .withLoyaltyPoints(0)
        .build();

      // Simular compras e acúmulo de pontos
      client.addLoyaltyPoints(500); // Bronze
      expect(client.loyalty_level).toBe(LoyaltyLevel.BRONZE);
      
      client.addLoyaltyPoints(1000); // Silver (total: 1500)
      expect(client.loyalty_level).toBe(LoyaltyLevel.SILVER);
      
      // Gerar cartão fidelidade
      client.generateLoyaltyCard();
      expect(client.loyalty_card_number).toBeDefined();
      
      // Resgatar pontos
      client.redeemLoyaltyPoints(500);
      expect(client.loyalty_points).toBe(1000);
    });

    test('should handle customer segmentation', () => {
      const client = Client.fake()
        .aClient()
        .withUserId('user-segment')
        .withStoresId('store-segment')
        .withCustomerType(CustomerType.INDIVIDUAL)
        .build();

      // Atualizar para cliente VIP
      client.updateCustomerType(CustomerType.VIP);
      expect(client.customer_type).toBe(CustomerType.VIP);
      
      // Definir limite de crédito
      client.setCreditLimit(5000);
      expect(client.credit_limit).toBe(5000);
      
      // Atualizar estatísticas de compra
      client.updatePurchaseStats(2500.50);
      expect(client.avg_monthly_spending).toBe(2500.50);
    });

    test('should handle communication preferences', () => {
      const client = Client.fake()
        .aClient()
        .withUserId('user-comm')
        .withStoresId('store-comm')
        .withAllowsPromotions(true)
        .withAllowsEmail(false)
        .withAllowsSms(false)
        .build();

      // Configurar preferências de comunicação
      client.updateContactPreferences(ContactMethod.EMAIL);
      expect(client.preferred_contact_method).toBe(ContactMethod.EMAIL);
      
      // Verificar preferências definidas
      expect(client.allows_promotions).toBe(true);
      expect(client.allows_email).toBe(false);
      expect(client.allows_sms).toBe(false);
    });

    test('should track purchase history', () => {
      const client = Client.fake()
        .aClient()
        .withUserId('user-purchase')
        .withStoresId('store-purchase')
        .withTotalPurchases(0)
        .withLastPurchaseDate(null)
        .build();

      expect(client.last_purchase_date).toBeNull();
      
      // Registrar compra
      client.recordPurchase(150.75);
      
      expect(client.total_purchases).toBe(1);
      expect(client.last_purchase_date).toBeInstanceOf(Date);
    });
  });
});