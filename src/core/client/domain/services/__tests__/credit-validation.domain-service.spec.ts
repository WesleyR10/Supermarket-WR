import { CreditValidationDomainService, CreditValidationParams } from '../credit-validation.domain-service';
import { ClientFakeBuilder } from '../../client-fake.builder';
import { CustomerType, LoyaltyLevel } from '../../client.aggregate';

describe('CreditValidationDomainService Unit Tests', () => {
  let service: CreditValidationDomainService;
  let defaultParams: CreditValidationParams;

  beforeEach(() => {
    // Using same default params as service to ensure consistency
    defaultParams = {
      purchaseHistoryWeight: 0.35,
      paymentHistoryWeight: 0.40,
      loyaltyWeight: 0.15,
      tenureWeight: 0.10,
      
      individualMaxCredit: 5000,
      corporateMaxCredit: 50000,
      vipMaxCredit: 25000,
      
      lowRiskThreshold: 70,
      mediumRiskThreshold: 50,
      highRiskThreshold: 30,
      
      minCreditScore: 30,  // Changed to match service defaults
      maxDebtToIncomeRatio: 0.3,
      minMonthsAsClient: 1,  // Changed to match service defaults
      minSuccessfulPayments: 2  // Changed to match service defaults
    };
    
    service = new CreditValidationDomainService();

    // Silencia logs para evitar ruído no output do Jest
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  describe('Constructor', () => {
    it('should create service with default parameters', () => {
      const defaultService = new CreditValidationDomainService();
      expect(defaultService).toBeDefined();
      expect(defaultService).toBeInstanceOf(CreditValidationDomainService);
    });

    it('should create service with custom parameters', () => {
      const customParams: CreditValidationParams = {
        purchaseHistoryWeight: 0.40,
        paymentHistoryWeight: 0.30,
        loyaltyWeight: 0.20,
        tenureWeight: 0.10,
        
        individualMaxCredit: 5000,
        corporateMaxCredit: 50000,
        vipMaxCredit: 25000,
        
        lowRiskThreshold: 70,
        mediumRiskThreshold: 50,
        highRiskThreshold: 30,
        
        minCreditScore: 40,
        maxDebtToIncomeRatio: 0.3,
        minMonthsAsClient: 3,
        minSuccessfulPayments: 5
      };
      
      const customService = new CreditValidationDomainService(customParams);
      expect(customService).toBeDefined();
    });

    it('should throw error when weights do not sum to 1.0', () => {
      const invalidParams: CreditValidationParams = {
        ...defaultParams,
        purchaseHistoryWeight: 0.4,
        paymentHistoryWeight: 0.4,
        loyaltyWeight: 0.4,
        tenureWeight: 0.4, // total 1.6
      };
    
      expect(() => new CreditValidationDomainService(invalidParams))
        .toThrow('A soma dos pesos deve ser igual a 1.0');
    });
  });

  describe('validateCreditLimit', () => {
    it('should approve credit for high-score client', async () => {
      const client = ClientFakeBuilder.aClient()
        .withFrequentBuyer()
        .withTotalSpent(10000)
        .withCreatedAt(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000))
        .build();

      const result = await service.validateCreditLimit(client, 2000);

      expect(result.approved).toBe(true);
      expect(result.approvedAmount).toBeGreaterThan(0);
    });

    it('should reject credit for new client with insufficient history', async () => {
      const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);

      const client = ClientFakeBuilder.aClient()
        .withCustomerType(CustomerType.INDIVIDUAL)
        .withLoyaltyLevel(LoyaltyLevel.BRONZE)
        .withCreatedAt(fifteenDaysAgo)  // monthsAsClient = 0 < minMonthsAsClient(1)
        .withTotalPurchases(0)          // 0 < minSuccessfulPayments(2)
        .withLastPurchaseDate(null)     // evita bônus por compra recente
        .build();

      const result = await service.validateCreditLimit(client, 1000);

      expect(result.approved).toBe(false);
      expect(result.rejectionReasons.length).toBeGreaterThan(0);
    });

    it('should reject credit for client with low credit score', async () => {
      const client = ClientFakeBuilder.aClient()
        .withOccasionalBuyer()
        .withTotalSpent(200)
        .withCreatedAt(new Date(Date.now() - 60 * 24 * 60 * 60 * 1000))
        .build();

      const result = await service.validateCreditLimit(client, 5000);

      expect(result.approved).toBe(false);
    });

    it('should approve with conditions for medium-risk client', async () => {
      const client = ClientFakeBuilder.aClient()
        .withFrequentBuyer()
        .withTotalSpent(3000)
        .withCreatedAt(new Date(Date.now() - 180 * 24 * 60 * 60 * 1000))
        .build();

      const result = await service.validateCreditLimit(client, 1500);

      expect(result.approved).toBe(true);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should reject credit exceeding customer type limit', async () => {
      const client = ClientFakeBuilder.aClient()
        .withCustomerType(CustomerType.INDIVIDUAL)
        .withFrequentBuyer()
        .withTotalSpent(5000)
        .build();

      const result = await service.validateCreditLimit(client, 10000);

      expect(result.approved).toBe(false);
    });

    it('should approve higher limits for VIP clients', async () => {
      const client = ClientFakeBuilder.aClient()
        .withCustomerType(CustomerType.VIP)
        .withFrequentBuyer()
        .withTotalSpent(15000)
        .withCreatedAt(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000))
        .build();

      const result = await service.validateCreditLimit(client, 8000);

      expect(result.approved).toBe(true);
      expect(result.approvedAmount).toBeGreaterThan(0);
    });
    
    it('should reject non-positive requested amount early', async () => {
        const client = ClientFakeBuilder.aClient()
            .withFrequentBuyer()
            .build();
    
        const result = await service.validateCreditLimit(client, 0);
    
        expect(result.approved).toBe(false);
        expect(result.riskLevel).toBeDefined();
        expect(result.creditScore).toBe(0);
        expect(result.rejectionReasons).toContain('Valor solicitado deve ser maior que zero');
    });
    
    it('should include rejection reason when exceeding calculated max limit', async () => {
        const client = ClientFakeBuilder.aClient()
            .withCustomerType(CustomerType.VIP)
            .withFrequentBuyer()
            .withTotalSpent(15000)
            .withCreatedAt(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000))
            .build();
    
        // Pede muito acima para garantir a razão de exceder limite
        const result = await service.validateCreditLimit(client, 1_000_000);
    
        expect(result.approved).toBe(false);
        expect(result.rejectionReasons).toEqual(
            expect.arrayContaining([expect.stringContaining('excede o limite máximo')])
        );
    });

    // Adicionado para cobrir teto absoluto de BUSINESS no primeiro bloco
    it('should reject credit exceeding BUSINESS absolute limit', async () => {
      const client = ClientFakeBuilder.aClient()
        .withCustomerType(CustomerType.BUSINESS)
        .withFrequentBuyer()
        .withTotalSpent(25000)
        .withCreatedAt(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000))
        .build();

      const result = await service.validateCreditLimit(client, 1_000_000);

      expect(result.approved).toBe(false);
      expect(result.rejectionReasons).toEqual(
        expect.arrayContaining([expect.stringContaining('excede o limite máximo')])
      );
    });
  });

  describe('calculateMaxCreditLimit', () => {
    it('should calculate appropriate limit for champion client', async () => {
      const client = ClientFakeBuilder.aClient()
        .withFrequentBuyer()
        .withTotalSpent(20000)
        .withCreatedAt(new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000))
        .build();

      const limit = await service.calculateMaxCreditLimit(client);

      expect(limit).toBeGreaterThan(1000);
    });

    it('should calculate conservative limit for new client', async () => {
      const client = ClientFakeBuilder.aClient()
        .withCustomerType(CustomerType.INDIVIDUAL)
        .withLoyaltyLevel(LoyaltyLevel.BRONZE)
        .withLastPurchaseDate(new Date(Date.now() - 60 * 24 * 60 * 60 * 1000))
        .withCreatedAt(new Date(Date.now() - 60 * 24 * 60 * 60 * 1000))
        .withTotalSpent(500)
        .build();

      const limit = await service.calculateMaxCreditLimit(client);

      expect(limit).toBeLessThan(2000);
    });

    it('should respect customer type limits', async () => {
      const client = ClientFakeBuilder.aClient()
        .withCustomerType(CustomerType.INDIVIDUAL)
        .withFrequentBuyer()
        .withTotalSpent(10000)
        .build();

      const limit = await service.calculateMaxCreditLimit(client);

      expect(limit).toBeLessThanOrEqual(defaultParams.individualMaxCredit);
    });

    it('should return 0 for clients that do not meet minimum requirements', async () => {
      const client = ClientFakeBuilder.aClient()
        .withCreatedAt(new Date(Date.now() - 15 * 24 * 60 * 60 * 1000))
        .withTotalSpent(50)
        .build();

      const limit = await service.calculateMaxCreditLimit(client);

      expect(limit).toBe(0);
    });
  });

  describe('updateCreditScore', () => {
    it('should calculate higher score for loyal clients', async () => {
      const client = ClientFakeBuilder.aClient()
        .withFrequentBuyer()
        .withLoyaltyLevel(LoyaltyLevel.GOLD)
        .withTotalSpent(15000)
        .withCreatedAt(new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000))
        .build();

      const score = await service.updateCreditScore(client);

      expect(score).toBeGreaterThan(60);
    });

    it('should calculate lower score for new clients', async () => {
      const client = ClientFakeBuilder.aClient()
        .withCreatedAt(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
        .withTotalSpent(200)
        .build();

      const score = await service.updateCreditScore(client);

      expect(score).toBeLessThan(50);
    });

    it('should consider purchase history in score calculation', async () => {
      const highSpendingClient = ClientFakeBuilder.aClient()
        .withFrequentBuyer()
        .withTotalSpent(10000)
        .withCreatedAt(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000))
        .build();

      const lowSpendingClient = ClientFakeBuilder.aClient()
        .withOccasionalBuyer()
        .withTotalSpent(500)
        .withCreatedAt(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000))
        .build();

      const highScore = await service.updateCreditScore(highSpendingClient);
      const lowScore = await service.updateCreditScore(lowSpendingClient);

      expect(highScore).toBeGreaterThan(lowScore);
    });
  });

  describe('canIncreaseCreditLimit', () => {
    it('should allow increase for qualified clients', async () => {
      const client = ClientFakeBuilder.aClient()
        .withFrequentBuyer()
        .withTotalSpent(8000)
        .withCreatedAt(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000))
        .build();

      const canIncrease = await service.canIncreaseCreditLimit(client, 3000);

      expect(canIncrease).toBe(true);
    });

    it('should deny increase for unqualified clients', async () => {
      const client = ClientFakeBuilder.aClient()
        .withCustomerType(CustomerType.INDIVIDUAL)
        .withLoyaltyLevel(LoyaltyLevel.BRONZE)
        .withLastPurchaseDate(new Date(Date.now() - 60 * 24 * 60 * 60 * 1000))
        .withOccasionalBuyer()
        .withTotalSpent(300)
        .withCreatedAt(new Date(Date.now() - 60 * 24 * 60 * 60 * 1000))
        .build();

      const canIncrease = await service.canIncreaseCreditLimit(client, 5000);

      expect(canIncrease).toBe(false);
    });

    it('should respect customer type limits for increases', async () => {
      const client = ClientFakeBuilder.aClient()
        .withCustomerType(CustomerType.INDIVIDUAL)
        .withFrequentBuyer()
        .withTotalSpent(5000)
        .build();

      const canIncrease = await service.canIncreaseCreditLimit(client, 10000);

      expect(canIncrease).toBe(false);
    });

    it('should respect BUSINESS absolute limit for increases', async () => {
      const client = ClientFakeBuilder.aClient()
        .withCustomerType(CustomerType.BUSINESS)
        .withFrequentBuyer()
        .withTotalSpent(20000)
        .withCreatedAt(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000))
        .build();
    
      // solicita acima do teto BUSINESS
      const canIncrease = await service.canIncreaseCreditLimit(client, 100_000);
      expect(canIncrease).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle client with null last purchase date', async () => {
      const client = ClientFakeBuilder.aClient()
        .withLastPurchaseDate(null)
        .withTotalSpent(1000)
        .build();

      const result = await service.validateCreditLimit(client, 500);

      expect(result).toBeDefined();
      expect(typeof result.approved).toBe('boolean');
    });

    it('should handle client with zero total spent', async () => {
      const client = ClientFakeBuilder.aClient()
        .withTotalSpent(0)
        .withCreatedAt(new Date(Date.now() - 180 * 24 * 60 * 60 * 1000))
        .build();

      const result = await service.validateCreditLimit(client, 500);

      expect(result.approved).toBe(false);
    });

    it('should handle client with future creation date', async () => {
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const client = ClientFakeBuilder.aClient()
        .withCreatedAt(futureDate)
        .withTotalSpent(1000)
        .build();

      const result = await service.validateCreditLimit(client, 500);

      expect(result.approved).toBe(false);
    });
  });

  describe('Custom Parameters', () => {
    it('should work with custom weight distribution', async () => {
      const customParams: CreditValidationParams = {
        purchaseHistoryWeight: 0.40,
        paymentHistoryWeight: 0.30,
        loyaltyWeight: 0.20,
        tenureWeight: 0.10,
        
        individualMaxCredit: 5000,
        corporateMaxCredit: 50000,
        vipMaxCredit: 25000,
        
        lowRiskThreshold: 70,
        mediumRiskThreshold: 50,
        highRiskThreshold: 30,
        
        minCreditScore: 40,
        maxDebtToIncomeRatio: 0.3,
        minMonthsAsClient: 3,
        minSuccessfulPayments: 5
      };

      const customService = new CreditValidationDomainService(customParams);
      
      const client = ClientFakeBuilder.aClient()
        .withFrequentBuyer()
        .withTotalSpent(3000)
        .withCreatedAt(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000))
        .build();

      const result = await customService.validateCreditLimit(client, 1500);

      expect(result).toBeDefined();
      expect(typeof result.approved).toBe('boolean');
    });

    it('should work with stricter validation rules', async () => {
      const strictParams: CreditValidationParams = {
        ...defaultParams,
        minMonthsAsClient: 12,
        minSuccessfulPayments: 20,
        minCreditScore: 70
      };

      const strictService = new CreditValidationDomainService(strictParams);
      
      const client = ClientFakeBuilder.aClient()
        .withOccasionalBuyer()
        .withCreatedAt(new Date(Date.now() - 180 * 24 * 60 * 60 * 1000))
        .build();

      const result = await strictService.validateCreditLimit(client, 1000);

      expect(result.approved).toBe(false);
      expect(result.rejectionReasons.length).toBeGreaterThan(0);
    });
  });

}); 

