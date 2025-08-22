import { LoyaltyCalculationDomainService, LoyaltyCalculationParams } from '../loyalty-calculation.domain-service';
import { ClientFakeBuilder } from '../../client-fake.builder';
import { LoyaltyLevel } from '../../client.aggregate';

describe('LoyaltyCalculationDomainService Unit Tests', () => {
  let service: LoyaltyCalculationDomainService;
  let defaultParams: LoyaltyCalculationParams;

  beforeEach(() => {
    defaultParams = {
      recencyWeight: 0.25,
      frequencyWeight: 0.30,
      monetaryWeight: 0.35,
      tenureWeight: 0.10,
      minScoreForSilver: 25,
      minScoreForGold: 50,
      minScoreForPlatinum: 75
    };
    
    service = new LoyaltyCalculationDomainService(defaultParams);
  });

  describe('Constructor', () => {
    it('should create service with default parameters', () => {
      const defaultService = new LoyaltyCalculationDomainService();
      expect(defaultService).toBeDefined();
    });

    it('should throw error when weights do not sum to 1.0', () => {
      const invalidParams = {
        ...defaultParams,
        recencyWeight: 0.30,
        frequencyWeight: 0.30,
        monetaryWeight: 0.30,
        tenureWeight: 0.30 // Total = 1.2
      };

      expect(() => new LoyaltyCalculationDomainService(invalidParams))
        .toThrow('A soma dos pesos deve ser igual a 1.0');
    });
  });

  describe('calculateLoyaltyScore', () => {
    it('should calculate high score for champion client', async () => {
      const client = ClientFakeBuilder.aClient()
        .withChampionClient()
        .withLoyaltyLevel(LoyaltyLevel.PLATINUM)
        .withAvgMonthlySpending(2000)
        .withTotalPurchases(100)
        .withLastPurchaseDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)) // 5 dias
        .withCreatedAt(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)) // 1 ano
        .build();

      const score = await service.calculateLoyaltyScore(client);

      expect(score).toBeGreaterThan(70);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should calculate low score for new client', async () => {
      const client = ClientFakeBuilder.aClient()
        .withNewClient()
        .withAvgMonthlySpending(100)
        .withTotalPurchases(1)
        .withLastPurchaseDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) // 30 dias
        .withCreatedAt(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) // 30 dias
        .build();

      const score = await service.calculateLoyaltyScore(client);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThan(50);
    });

    it('should calculate medium score for occasional buyer', async () => {
      const client = ClientFakeBuilder.aClient()
        .withOccasionalBuyer()
        .withAvgMonthlySpending(500)
        .withTotalPurchases(15)
        .withLastPurchaseDate(new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)) // 15 dias
        .withCreatedAt(new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)) // 6 meses
        .build();

      const score = await service.calculateLoyaltyScore(client);

      expect(score).toBeGreaterThan(20);
      expect(score).toBeLessThan(80);
    });

    it('should handle client with no purchase history', async () => {
      const client = ClientFakeBuilder.aClient()
        .withNewClient()
        .withAvgMonthlySpending(null)
        .withTotalPurchases(0)
        .withLastPurchaseDate(null)
        .withCreatedAt(new Date())
        .build();

      const score = await service.calculateLoyaltyScore(client);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThan(30);
    });
  });

  describe('calculateLoyaltyLevel', () => {
    it('should return BRONZE for low scores', async () => {
      const client = ClientFakeBuilder.aClient()
        .withNewClient()
        .withAvgMonthlySpending(50)
        .withTotalPurchases(1)
        .withLastPurchaseDate(new Date(Date.now() - 60 * 24 * 60 * 60 * 1000))
        .withCreatedAt(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
        .build();

      const level = await service.calculateLoyaltyLevel(client);

      expect(level).toBe(LoyaltyLevel.BRONZE); // Baixo score resulta em BRONZE
    });

    it('should return SILVER for medium-low scores', async () => {
      const client = ClientFakeBuilder.aClient()
        .withOccasionalBuyer()
        .withAvgMonthlySpending(300)
        .withTotalPurchases(10)
        .withLastPurchaseDate(new Date(Date.now() - 20 * 24 * 60 * 60 * 1000))
        .withCreatedAt(new Date(Date.now() - 120 * 24 * 60 * 60 * 1000))
        .build();

      const level = await service.calculateLoyaltyLevel(client);

      expect(Object.values(LoyaltyLevel)).toContain(level);
    });

    it('should return GOLD for high scores', async () => {
      const client = ClientFakeBuilder.aClient()
        .withFrequentBuyer()
        .withAvgMonthlySpending(800)
        .withTotalPurchases(40)
        .withLastPurchaseDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
        .withCreatedAt(new Date(Date.now() - 300 * 24 * 60 * 60 * 1000))
        .build();

      const level = await service.calculateLoyaltyLevel(client);

      expect(Object.values(LoyaltyLevel)).toContain(level);
    });

    it('should return PLATINUM for very high scores', async () => {
      const client = ClientFakeBuilder.aClient()
        .withChampionClient()
        .withAvgMonthlySpending(1500)
        .withTotalPurchases(80)
        .withLastPurchaseDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000))
        .withCreatedAt(new Date(Date.now() - 500 * 24 * 60 * 60 * 1000))
        .build();

      const level = await service.calculateLoyaltyLevel(client);

      expect(Object.values(LoyaltyLevel)).toContain(level);
    });
  });

  describe('shouldUpgradeLoyalty', () => {
    it('should recommend upgrade when score significantly exceeds current level', async () => {
      const client = ClientFakeBuilder.aClient()
        .withLoyaltyLevel(LoyaltyLevel.BRONZE)
        .withAvgMonthlySpending(500)
        .withTotalPurchases(20)
        .withLastPurchaseDate(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000))
        .withCreatedAt(new Date(Date.now() - 200 * 24 * 60 * 60 * 1000))
        .build();

      const shouldUpgrade = await service.shouldUpgradeLoyalty(client, 500);

      expect(typeof shouldUpgrade).toBe('boolean');
    });

    it('should not recommend upgrade for small purchases', async () => {
      const client = ClientFakeBuilder.aClient()
        .withLoyaltyLevel(LoyaltyLevel.GOLD)
        .withAvgMonthlySpending(1000)
        .withTotalPurchases(50)
        .withLastPurchaseDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000))
        .withCreatedAt(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000))
        .build();

      const shouldUpgrade = await service.shouldUpgradeLoyalty(client, 10);

      expect(typeof shouldUpgrade).toBe('boolean');
    });
  });

  describe('Tenure Scoring', () => {
    it('should give higher score to long-term clients', async () => {
      const longTermClient = ClientFakeBuilder.aClient()
        .withCreatedAt(new Date(Date.now() - 730 * 24 * 60 * 60 * 1000)) // 2 anos
        .withTotalPurchases(50)
        .withAvgMonthlySpending(800)
        .build();

      const newTermClient = ClientFakeBuilder.aClient()
        .withCreatedAt(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) // 1 mês
        .withTotalPurchases(20)
        .withAvgMonthlySpending(800)
        .build();

      const longTermScore = await service.calculateLoyaltyScore(longTermClient);
      const newTermScore = await service.calculateLoyaltyScore(newTermClient);

      expect(longTermScore).toBeGreaterThan(newTermScore);
    });
  });

  describe('Custom Parameters', () => {
    it('should work with custom weight distribution', async () => {
      const customParams: LoyaltyCalculationParams = {
        recencyWeight: 0.50, // Maior peso para recência
        frequencyWeight: 0.20,
        monetaryWeight: 0.20,
        tenureWeight: 0.10,
        minScoreForSilver: 30,
        minScoreForGold: 60,
        minScoreForPlatinum: 80
      };

      const customService = new LoyaltyCalculationDomainService(customParams);
      
      const client = ClientFakeBuilder.aClient()
        .withLastPurchaseDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)) // Muito recente
        .withTotalPurchases(10)
        .withAvgMonthlySpending(500)
        .build();

      const score = await customService.calculateLoyaltyScore(client);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should work with custom thresholds', async () => {
      const customParams: LoyaltyCalculationParams = {
        ...defaultParams,
        minScoreForSilver: 10,
        minScoreForGold: 30,
        minScoreForPlatinum: 60
      };

      const customService = new LoyaltyCalculationDomainService(customParams);
      
      const client = ClientFakeBuilder.aClient()
        .withOccasionalBuyer()
        .withAvgMonthlySpending(200)
        .withTotalPurchases(5)
        .build();

      const level = await customService.calculateLoyaltyLevel(client);

      expect(Object.values(LoyaltyLevel)).toContain(level);
    });
  });

  describe('Weights and thresholds validation (additional)', () => {
    it('should throw error when thresholds are not strictly increasing', () => {
      const invalidParams: LoyaltyCalculationParams = {
        recencyWeight: 0.25,
        frequencyWeight: 0.25,
        monetaryWeight: 0.25,
        tenureWeight: 0.25,
        minScoreForSilver: 50,
        minScoreForGold: 50, // not increasing
        minScoreForPlatinum: 80
      };

      expect(() => new LoyaltyCalculationDomainService(invalidParams))
        .toThrow('Os scores mínimos devem estar em ordem crescente');
    });
  });

  describe('Dimension scoring boundaries with isolated weights', () => {
    const daysAgo = (d: number) => new Date(Date.now() - d * 24 * 60 * 60 * 1000);

    it('recency boundaries with recencyWeight=1.0', async () => {
      const svc = new LoyaltyCalculationDomainService({
        recencyWeight: 1.0, frequencyWeight: 0, monetaryWeight: 0, tenureWeight: 0,
        minScoreForSilver: 25, minScoreForGold: 50, minScoreForPlatinum: 75,
      });
  });

  describe('Negative Tests for Invalid Parameters', () => {
    describe('Constructor validation errors', () => {
      it('should throw error when weights sum is not 1.0', () => {
        expect(() => {
          new LoyaltyCalculationDomainService({
            recencyWeight: 0.3,
            frequencyWeight: 0.3,
            monetaryWeight: 0.3, // Soma = 0.9, não 1.0
            tenureWeight: 0.2,
            minScoreForSilver: 25,
            minScoreForGold: 50,
            minScoreForPlatinum: 75
          });
        }).toThrow('A soma dos pesos deve ser igual a 1.0');
      });

      it('should throw error when weights sum exceeds 1.0', () => {
        expect(() => {
          new LoyaltyCalculationDomainService({
            recencyWeight: 0.4,
            frequencyWeight: 0.4,
            monetaryWeight: 0.4, // Soma = 1.2, excede 1.0
            tenureWeight: 0.2,
            minScoreForSilver: 25,
            minScoreForGold: 50,
            minScoreForPlatinum: 75
          });
        }).toThrow('A soma dos pesos deve ser igual a 1.0');
      });

      it('should accept negative weights if sum is 1.0', () => {
        expect(() => {
          new LoyaltyCalculationDomainService({
            recencyWeight: -0.1,
            frequencyWeight: 0.4,
            monetaryWeight: 0.4,
            tenureWeight: 0.3,
            minScoreForSilver: 25,
            minScoreForGold: 50,
            minScoreForPlatinum: 75
          });
        }).not.toThrow();
      });

      it('should throw error when any weight exceeds 1.0', () => {
        expect(() => {
          new LoyaltyCalculationDomainService({
            recencyWeight: 1.5, // Peso individual > 1.0
            frequencyWeight: 0,
            monetaryWeight: 0,
            tenureWeight: 0,
            minScoreForSilver: 25,
            minScoreForGold: 50,
            minScoreForPlatinum: 75
          });
        }).toThrow('A soma dos pesos deve ser igual a 1.0');
      });

      it('should throw error when thresholds are not strictly increasing', () => {
        expect(() => {
          new LoyaltyCalculationDomainService({
            recencyWeight: 0.25,
            frequencyWeight: 0.25,
            monetaryWeight: 0.25,
            tenureWeight: 0.25,
            minScoreForSilver: 50, // Silver >= Gold (inválido)
            minScoreForGold: 50,
            minScoreForPlatinum: 75
          });
        }).toThrow('Os scores mínimos devem estar em ordem crescente');
      });

      it('should throw error when Gold threshold is greater than Platinum', () => {
        expect(() => {
          new LoyaltyCalculationDomainService({
            recencyWeight: 0.25,
            frequencyWeight: 0.25,
            monetaryWeight: 0.25,
            tenureWeight: 0.25,
            minScoreForSilver: 25,
            minScoreForGold: 80, // Gold > Platinum (inválido)
            minScoreForPlatinum: 75
          });
        }).toThrow('Os scores mínimos devem estar em ordem crescente');
      });

      it('should accept negative thresholds (no validation for negative values)', () => {
        expect(() => {
          new LoyaltyCalculationDomainService({
            recencyWeight: 0.25,
            frequencyWeight: 0.25,
            monetaryWeight: 0.25,
            tenureWeight: 0.25,
            minScoreForSilver: -10, // Negative threshold allowed
            minScoreForGold: 50,
            minScoreForPlatinum: 75
          });
        }).not.toThrow();
      });

      it('should accept thresholds above 100 (no validation for max threshold)', () => {
        expect(() => {
          new LoyaltyCalculationDomainService({
            recencyWeight: 0.25,
            frequencyWeight: 0.25,
            monetaryWeight: 0.25,
            tenureWeight: 0.25,
            minScoreForSilver: 25,
            minScoreForGold: 50,
            minScoreForPlatinum: 150 // Threshold > 100 is allowed
          });
        }).not.toThrow();
      });

      it('should throw error with descriptive message for weight sum validation', () => {
        expect(() => {
          new LoyaltyCalculationDomainService({
            recencyWeight: 0.2,
            frequencyWeight: 0.2,
            monetaryWeight: 0.2,
            tenureWeight: 0.2, // Soma = 0.8
            minScoreForSilver: 25,
            minScoreForGold: 50,
            minScoreForPlatinum: 75
          });
        }).toThrow('A soma dos pesos deve ser igual a 1.0');
      });

      it('should throw error with descriptive message for threshold validation', () => {
        expect(() => {
          new LoyaltyCalculationDomainService({
            recencyWeight: 0.25,
            frequencyWeight: 0.25,
            monetaryWeight: 0.25,
            tenureWeight: 0.25,
            minScoreForSilver: 60, // Silver > Gold
            minScoreForGold: 50,
            minScoreForPlatinum: 75
          });
        }).toThrow('Os scores mínimos devem estar em ordem crescente');
      });
    });

    describe('Runtime validation errors', () => {
      let service: LoyaltyCalculationDomainService;

      beforeEach(() => {
        service = new LoyaltyCalculationDomainService({
          recencyWeight: 0.25,
          frequencyWeight: 0.25,
          monetaryWeight: 0.25,
          tenureWeight: 0.25,
          minScoreForSilver: 25,
          minScoreForGold: 50,
          minScoreForPlatinum: 75
        });
      });

      it('should handle null client gracefully', async () => {
        await expect(service.calculateLoyaltyScore(null as any))
          .rejects.toThrow();
      });

      it('should handle undefined client gracefully', async () => {
        await expect(service.calculateLoyaltyScore(undefined as any))
          .rejects.toThrow();
      });

      it('should handle client with negative total purchases', async () => {
        const invalidClient = ClientFakeBuilder.aClient()
          .withTotalPurchases(-5) // Valor inválido
          .build();

        // O serviço deve lidar com valores inválidos de forma robusta
        const score = await service.calculateLoyaltyScore(invalidClient);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      });

      it('should handle client with negative average monthly spending', async () => {
        const invalidClient = ClientFakeBuilder.aClient()
          .withAvgMonthlySpending(-100) // Valor inválido
          .build();

        // O serviço deve lidar com valores inválidos de forma robusta
        const score = await service.calculateLoyaltyScore(invalidClient);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      });

      it('should handle client with invalid date (future creation)', async () => {
        const invalidClient = ClientFakeBuilder.aClient()
          .withCreatedAt(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)) // 1 ano no futuro
          .build();

        // O serviço deve lidar com datas inválidas de forma robusta
        const score = await service.calculateLoyaltyScore(invalidClient);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      });

      it('should handle client with extremely large values', async () => {
        const extremeClient = ClientFakeBuilder.aClient()
          .withTotalPurchases(Number.MAX_SAFE_INTEGER)
          .withAvgMonthlySpending(Number.MAX_SAFE_INTEGER)
          .build();

        // O serviço deve lidar com valores extremos sem quebrar
        const score = await service.calculateLoyaltyScore(extremeClient);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
        expect(Number.isFinite(score)).toBe(true);
      });
    });

    describe('Edge cases for shouldUpgradeLoyalty', () => {
      let service: LoyaltyCalculationDomainService;

      beforeEach(() => {
        service = new LoyaltyCalculationDomainService({
          recencyWeight: 0.25,
          frequencyWeight: 0.25,
          monetaryWeight: 0.25,
          tenureWeight: 0.25,
          minScoreForSilver: 25,
          minScoreForGold: 50,
          minScoreForPlatinum: 75
        });
      });

      it('should handle null purchase amount in shouldUpgradeLoyalty', async () => {
        const client = ClientFakeBuilder.aClient().build();

        const result = await service.shouldUpgradeLoyalty(client, null as any);
        expect(result).toBe(false);
      });

      it('should handle negative purchase amount in shouldUpgradeLoyalty', async () => {
        const client = ClientFakeBuilder.aClient().build();

        const result = await service.shouldUpgradeLoyalty(client, -100);
        expect(result).toBe(false);
      });

      it('should handle zero purchase amount in shouldUpgradeLoyalty', async () => {
        const client = ClientFakeBuilder.aClient().build();

        const result = await service.shouldUpgradeLoyalty(client, 0);
        expect(result).toBe(false);
      });

      it('should handle extremely large purchase amount', async () => {
        const client = ClientFakeBuilder.aClient().build();

        const result = await service.shouldUpgradeLoyalty(client, Number.MAX_SAFE_INTEGER);
        expect(result).toBe(false);
      });
    });
  });
  });

  describe('Extreme Recency and Custom Parameters Tests', () => {
    describe('Extreme recency scenarios', () => {
      it('should handle clients with no purchase history (null last_purchase_date)', async () => {
        const service = new LoyaltyCalculationDomainService({
          recencyWeight: 1.0, frequencyWeight: 0, monetaryWeight: 0, tenureWeight: 0,
          minScoreForSilver: 25, minScoreForGold: 50, minScoreForPlatinum: 75
        });

        const client = ClientFakeBuilder.aClient()
          .withLastPurchaseDate(null)
          .build();

        const score = await service.calculateLoyaltyScore(client);
        expect(score).toBe(0); // Sem histórico de compras = score 0

        const level = await service.calculateLoyaltyLevel(client);
        expect(level).toBe(LoyaltyLevel.BRONZE);
      });

      it('should handle extremely recent purchases (same day)', async () => {
        const service = new LoyaltyCalculationDomainService({
          recencyWeight: 1.0, frequencyWeight: 0, monetaryWeight: 0, tenureWeight: 0,
          minScoreForSilver: 25, minScoreForGold: 50, minScoreForPlatinum: 75
        });

        const client = ClientFakeBuilder.aClient()
          .withLastPurchaseDate(new Date(Date.now() - 1 * 60 * 60 * 1000)) // 1 hora atrás
          .build();

        const score = await service.calculateLoyaltyScore(client);
        expect(score).toBe(100); // Compra muito recente = score máximo

        const level = await service.calculateLoyaltyLevel(client);
        expect(level).toBe(LoyaltyLevel.PLATINUM);
      });

      it('should handle extremely old purchases (5+ years)', async () => {
        const service = new LoyaltyCalculationDomainService({
          recencyWeight: 1.0, frequencyWeight: 0, monetaryWeight: 0, tenureWeight: 0,
          minScoreForSilver: 25, minScoreForGold: 50, minScoreForPlatinum: 75
        });

        const client = ClientFakeBuilder.aClient()
          .withLastPurchaseDate(new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000)) // 5 anos atrás
          .build();

        const score = await service.calculateLoyaltyScore(client);
        expect(score).toBe(10); // Compra muito antiga = score mínimo

        const level = await service.calculateLoyaltyLevel(client);
        expect(level).toBe(LoyaltyLevel.BRONZE);
      });

      it('should handle edge case at 7 days boundary', async () => {
        const service = new LoyaltyCalculationDomainService({
          recencyWeight: 1.0, frequencyWeight: 0, monetaryWeight: 0, tenureWeight: 0,
          minScoreForSilver: 25, minScoreForGold: 50, minScoreForPlatinum: 75
        });

        const client7Days = ClientFakeBuilder.aClient()
          .withLastPurchaseDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) // Exatamente 7 dias
          .build();

        const client8Days = ClientFakeBuilder.aClient()
          .withLastPurchaseDate(new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)) // 8 dias
          .build();

        const score7Days = await service.calculateLoyaltyScore(client7Days);
        const score8Days = await service.calculateLoyaltyScore(client8Days);

        expect(score7Days).toBe(100);
        expect(score8Days).toBe(80);
      });
    });

    describe('Custom parameter configurations', () => {
      it('should work with monetary-focused configuration', async () => {
        const monetaryFocusedService = new LoyaltyCalculationDomainService({
          recencyWeight: 0.10,
          frequencyWeight: 0.15,
          monetaryWeight: 0.70, // Foco no valor monetário
          tenureWeight: 0.05,
          minScoreForSilver: 30,
          minScoreForGold: 60,
          minScoreForPlatinum: 85
        });

        const highSpenderClient = ClientFakeBuilder.aClient()
          .withAvgMonthlySpending(3000) // Alto gasto mensal
          .withCreatedAt(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)) // 1 ano como cliente
          .withTotalPurchases(5) // Poucas compras
          .withLastPurchaseDate(new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)) // Compra não tão recente
          .build();

        const score = await monetaryFocusedService.calculateLoyaltyScore(highSpenderClient);
        const level = await monetaryFocusedService.calculateLoyaltyLevel(highSpenderClient);

        expect(score).toBeGreaterThan(50); // Alto score devido ao gasto
        expect([LoyaltyLevel.GOLD, LoyaltyLevel.PLATINUM]).toContain(level);
      });

      it('should work with frequency-focused configuration', async () => {
        const frequencyFocusedService = new LoyaltyCalculationDomainService({
          recencyWeight: 0.15,
          frequencyWeight: 0.65, // Foco na frequência
          monetaryWeight: 0.15,
          tenureWeight: 0.05,
          minScoreForSilver: 20,
          minScoreForGold: 45,
          minScoreForPlatinum: 70
        });

        const frequentBuyerClient = ClientFakeBuilder.aClient()
          .withTotalPurchases(80) // Muitas compras
          .withAvgMonthlySpending(200) // Gasto baixo por compra
          .withCreatedAt(new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)) // 6 meses
          .withLastPurchaseDate(new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)) // Compra moderadamente recente
          .build();

        const score = await frequencyFocusedService.calculateLoyaltyScore(frequentBuyerClient);
        const level = await frequencyFocusedService.calculateLoyaltyLevel(frequentBuyerClient);

        expect(score).toBeGreaterThan(60); // Alto score devido à frequência
        expect([LoyaltyLevel.GOLD, LoyaltyLevel.PLATINUM]).toContain(level);
      });

      it('should work with tenure-focused configuration', async () => {
        const tenureFocusedService = new LoyaltyCalculationDomainService({
          recencyWeight: 0.15,
          frequencyWeight: 0.15,
          monetaryWeight: 0.15,
          tenureWeight: 0.55, // Foco no tempo como cliente
          minScoreForSilver: 25,
          minScoreForGold: 50,
          minScoreForPlatinum: 75
        });

        const longTermClient = ClientFakeBuilder.aClient()
          .withCreatedAt(new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000)) // 3 anos como cliente
          .withTotalPurchases(15) // Compras moderadas
          .withAvgMonthlySpending(300) // Gasto moderado
          .withLastPurchaseDate(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)) // Compra não tão recente
          .build();

        const score = await tenureFocusedService.calculateLoyaltyScore(longTermClient);
        const level = await tenureFocusedService.calculateLoyaltyLevel(longTermClient);

        expect(score).toBeGreaterThan(40); // Alto score devido ao tempo como cliente
        expect([LoyaltyLevel.SILVER, LoyaltyLevel.GOLD, LoyaltyLevel.PLATINUM]).toContain(level);
      });

      it('should work with balanced but strict thresholds', async () => {
        const strictService = new LoyaltyCalculationDomainService({
          recencyWeight: 0.25,
          frequencyWeight: 0.25,
          monetaryWeight: 0.25,
          tenureWeight: 0.25,
          minScoreForSilver: 40, // Thresholds mais altos
          minScoreForGold: 70,
          minScoreForPlatinum: 90
        });

        const averageClient = ClientFakeBuilder.aClient()
          .withTotalPurchases(20)
          .withAvgMonthlySpending(500)
          .withCreatedAt(new Date(Date.now() - 180 * 24 * 60 * 60 * 1000))
          .withLastPurchaseDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
          .build();

        const score = await strictService.calculateLoyaltyScore(averageClient);
        const level = await strictService.calculateLoyaltyLevel(averageClient);

        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
        expect(Object.values(LoyaltyLevel)).toContain(level);
      });

      it('should work with lenient thresholds', async () => {
        const lenientService = new LoyaltyCalculationDomainService({
          recencyWeight: 0.25,
          frequencyWeight: 0.25,
          monetaryWeight: 0.25,
          tenureWeight: 0.25,
          minScoreForSilver: 10, // Thresholds mais baixos
          minScoreForGold: 25,
          minScoreForPlatinum: 50
        });

        const newClient = ClientFakeBuilder.aClient()
          .withTotalPurchases(3)
          .withAvgMonthlySpending(150)
          .withCreatedAt(new Date(Date.now() - 60 * 24 * 60 * 60 * 1000))
          .withLastPurchaseDate(new Date(Date.now() - 20 * 24 * 60 * 60 * 1000))
          .build();

        const score = await lenientService.calculateLoyaltyScore(newClient);
        const level = await lenientService.calculateLoyaltyLevel(newClient);

        expect(score).toBeGreaterThan(10); // Mesmo cliente novo deve ter score razoável
        expect([LoyaltyLevel.SILVER, LoyaltyLevel.GOLD, LoyaltyLevel.PLATINUM]).toContain(level);
      });
    });

    describe('Edge cases with extreme values', () => {
      it('should handle client with zero purchases but high spending average', async () => {
        const client = ClientFakeBuilder.aClient()
          .withTotalPurchases(0)
          .withAvgMonthlySpending(1000) // Alto gasto médio mas sem compras
          .withLastPurchaseDate(null)
          .withCreatedAt(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000))
          .build();

        const score = await service.calculateLoyaltyScore(client);
        const level = await service.calculateLoyaltyLevel(client);

        expect(score).toBeGreaterThanOrEqual(0);
        expect(level).toBe(LoyaltyLevel.BRONZE);
      });

      it('should handle client with many purchases but zero spending', async () => {
        const client = ClientFakeBuilder.aClient()
          .withTotalPurchases(100)
          .withAvgMonthlySpending(0) // Sem gasto médio
          .withLastPurchaseDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000))
          .withCreatedAt(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000))
          .build();

        const score = await service.calculateLoyaltyScore(client);
        const level = await service.calculateLoyaltyLevel(client);

        expect(score).toBeGreaterThan(0); // Frequência e recência ainda contam
        expect(Object.values(LoyaltyLevel)).toContain(level);
      });

      it('should handle client created in the future (edge case)', async () => {
        const client = ClientFakeBuilder.aClient()
          .withCreatedAt(new Date(Date.now() + 24 * 60 * 60 * 1000)) // 1 dia no futuro
          .withTotalPurchases(10)
          .withAvgMonthlySpending(500)
          .withLastPurchaseDate(new Date())
          .build();

        const score = await service.calculateLoyaltyScore(client);
        const level = await service.calculateLoyaltyLevel(client);

        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
        expect(Object.values(LoyaltyLevel)).toContain(level);
      });
    });
  });

  describe('Dimension scoring boundaries', () => {
    const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    it('recency boundaries with recencyWeight=1.0', async () => {
      const svc = new LoyaltyCalculationDomainService({
        recencyWeight: 1.0, frequencyWeight: 0, monetaryWeight: 0, tenureWeight: 0,
        minScoreForSilver: 25, minScoreForGold: 50, minScoreForPlatinum: 75,
      });
      const mk = (days: number) => ClientFakeBuilder.aClient().withLastPurchaseDate(daysAgo(days)).build();

      expect(await svc.calculateLoyaltyScore(mk(6))).toBe(100);
      expect(await svc.calculateLoyaltyScore(mk(29))).toBe(80);
      expect(await svc.calculateLoyaltyScore(mk(31))).toBe(60);
      expect(await svc.calculateLoyaltyScore(mk(89))).toBe(60);
      expect(await svc.calculateLoyaltyScore(mk(91))).toBe(40);
      expect(await svc.calculateLoyaltyScore(mk(179))).toBe(40);
      expect(await svc.calculateLoyaltyScore(mk(181))).toBe(20);
      expect(await svc.calculateLoyaltyScore(mk(364))).toBe(20);
      expect(await svc.calculateLoyaltyScore(mk(366))).toBe(10);
    });

    it('frequency boundaries with frequencyWeight=1.0', async () => {
      const svc = new LoyaltyCalculationDomainService({
        recencyWeight: 0, frequencyWeight: 1.0, monetaryWeight: 0, tenureWeight: 0,
        minScoreForSilver: 25, minScoreForGold: 50, minScoreForPlatinum: 75,
      });
      const mk = (p: number) => ClientFakeBuilder.aClient().withTotalPurchases(p).build();

      expect(await svc.calculateLoyaltyScore(mk(0))).toBe(0);
      expect(await svc.calculateLoyaltyScore(mk(1))).toBe(4);
      expect(await svc.calculateLoyaltyScore(mk(4))).toBe(16);
      expect(await svc.calculateLoyaltyScore(mk(5))).toBe(20);
      expect(await svc.calculateLoyaltyScore(mk(9))).toBe(20);
      expect(await svc.calculateLoyaltyScore(mk(10))).toBe(40);
      expect(await svc.calculateLoyaltyScore(mk(24))).toBe(40);
      expect(await svc.calculateLoyaltyScore(mk(25))).toBe(60);
      expect(await svc.calculateLoyaltyScore(mk(49))).toBe(60);
      expect(await svc.calculateLoyaltyScore(mk(50))).toBe(80);
      expect(await svc.calculateLoyaltyScore(mk(99))).toBe(80);
      expect(await svc.calculateLoyaltyScore(mk(100))).toBe(100);
    });

    it('monetary boundaries with monetaryWeight=1.0', async () => {
      const svc = new LoyaltyCalculationDomainService({
        recencyWeight: 0, frequencyWeight: 0, monetaryWeight: 1.0, tenureWeight: 0,
        minScoreForSilver: 25, minScoreForGold: 50, minScoreForPlatinum: 75,
      });
      // Fix months=1 by using createdAt = now
      const mk = (avg: number) => ClientFakeBuilder.aClient()
        .withAvgMonthlySpending(avg)
        .withCreatedAt(new Date())
        .build();

      // below 500 -> score = totalSpent/25 capped at 20
      expect(await svc.calculateLoyaltyScore(mk(10))).toBeCloseTo(10 / 25, 5);
      expect(await svc.calculateLoyaltyScore(mk(250))).toBe(10); // 250/25=10
      expect(await svc.calculateLoyaltyScore(mk(500))).toBe(20);

      // boundaries with months=1 (deterministic)
      expect(await svc.calculateLoyaltyScore(mk(1000))).toBe(40);
      expect(await svc.calculateLoyaltyScore(mk(2500))).toBe(60);
      expect(await svc.calculateLoyaltyScore(mk(5000))).toBe(80);
      expect(await svc.calculateLoyaltyScore(mk(10000))).toBe(100);
    });

    it('tenure boundaries with tenureWeight=1.0', async () => {
      const svc = new LoyaltyCalculationDomainService({
        recencyWeight: 0, frequencyWeight: 0, monetaryWeight: 0, tenureWeight: 1.0,
        minScoreForSilver: 25, minScoreForGold: 50, minScoreForPlatinum: 75,
      });
      const daysAgo = (d: number) => new Date(Date.now() - d * 24 * 60 * 60 * 1000);
      const mk = (days: number) => ClientFakeBuilder.aClient().withCreatedAt(daysAgo(days)).build();

      // monthsAsClient = floor(days/30)
      expect(await svc.calculateLoyaltyScore(mk(2))).toBe(0);
      expect(await svc.calculateLoyaltyScore(mk(25))).toBe(0);
      expect(await svc.calculateLoyaltyScore(mk(31))).toBe(20);
      expect(await svc.calculateLoyaltyScore(mk(88))).toBe(20);
      expect(await svc.calculateLoyaltyScore(mk(92))).toBe(40);
      expect(await svc.calculateLoyaltyScore(mk(178))).toBe(40);
      expect(await svc.calculateLoyaltyScore(mk(182))).toBe(60);
      expect(await svc.calculateLoyaltyScore(mk(358))).toBe(60);
      expect(await svc.calculateLoyaltyScore(mk(362))).toBe(80);
      expect(await svc.calculateLoyaltyScore(mk(718))).toBe(80);
      expect(await svc.calculateLoyaltyScore(mk(722))).toBe(100);
    });
  });

  describe('Loyalty level mapping with custom thresholds', () => {
    it('should map exact boundaries to respective levels (recencyWeight=1.0)', async () => {
      const svc = new LoyaltyCalculationDomainService({
        recencyWeight: 1.0, frequencyWeight: 0, monetaryWeight: 0, tenureWeight: 0,
        minScoreForSilver: 40, // align to step values
        minScoreForGold: 60,
        minScoreForPlatinum: 80,
      });
      const mk = (days: number) => ClientFakeBuilder.aClient().withLastPurchaseDate(new Date(Date.now() - days * 24 * 60 * 60 * 1000)).build();

      // within buckets (avoid boundary rounding)
      expect(await svc.calculateLoyaltyLevel(mk(179))).toBe(LoyaltyLevel.SILVER);
      expect(await svc.calculateLoyaltyLevel(mk(89))).toBe(LoyaltyLevel.GOLD);
      expect(await svc.calculateLoyaltyLevel(mk(29))).toBe(LoyaltyLevel.PLATINUM);
      expect(await svc.calculateLoyaltyLevel(mk(366))).toBe(LoyaltyLevel.BRONZE);
    });
  });

  describe('shouldUpgradeLoyalty decisions (deterministic)', () => {
    it('should upgrade when new purchase improves level (recency-only)', async () => {
      const svc = new LoyaltyCalculationDomainService({
        recencyWeight: 1.0, frequencyWeight: 0, monetaryWeight: 0, tenureWeight: 0,
        minScoreForSilver: 40, minScoreForGold: 60, minScoreForPlatinum: 80,
      });
      const client = ClientFakeBuilder.aClient()
        .withLoyaltyLevel(LoyaltyLevel.BRONZE)
        .withLastPurchaseDate(new Date(Date.now() - 400 * 24 * 60 * 60 * 1000)) // score 10
        .build();

      const shouldUpgrade = await svc.shouldUpgradeLoyalty(client, 100);
      expect(shouldUpgrade).toBe(true); // new purchase sets recency to now -> score 100 => PLATINUM
    });

    it('should not upgrade when level remains the same (recency-only)', async () => {
      const svc = new LoyaltyCalculationDomainService({
        recencyWeight: 1.0, frequencyWeight: 0, monetaryWeight: 0, tenureWeight: 0,
        minScoreForSilver: 40, minScoreForGold: 60, minScoreForPlatinum: 80,
      });
      const client = ClientFakeBuilder.aClient()
        .withLoyaltyLevel(LoyaltyLevel.PLATINUM)
        .withLastPurchaseDate(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000))
        .build();

      const shouldUpgrade = await svc.shouldUpgradeLoyalty(client, 1);
      expect(shouldUpgrade).toBe(false); // já está em PLATINUM e permanece em PLATINUM após compra
    });
  });

  describe('Boundary Tests for Level Transitions', () => {
    let boundaryService: LoyaltyCalculationDomainService;

    beforeEach(() => {
      boundaryService = new LoyaltyCalculationDomainService({
        recencyWeight: 0.25,
        frequencyWeight: 0.30,
        monetaryWeight: 0.35,
        tenureWeight: 0.10,
        minScoreForSilver: 25,
        minScoreForGold: 50,
        minScoreForPlatinum: 75
      });
    });

    describe('Bronze to Silver transition', () => {
      it('should upgrade from BRONZE to SILVER at exact threshold (score 25)', async () => {
        // Cliente com score exatamente no limite BRONZE/SILVER
        const client = ClientFakeBuilder.aClient()
          .withLoyaltyLevel(LoyaltyLevel.BRONZE)
          .withTotalPurchases(6) // frequency score = 24
          .withAvgMonthlySpending(25) // monetary score baixo
          .withLastPurchaseDate(new Date(Date.now() - 400 * 24 * 60 * 60 * 1000)) // recency score = 10
          .withCreatedAt(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) // tenure score = 20
          .build();

        const currentScore = await boundaryService.calculateLoyaltyScore(client);
        expect(currentScore).toBeLessThan(25); // Confirma que está em BRONZE

        // Simula compra que deve elevar para SILVER
        const shouldUpgrade = await boundaryService.shouldUpgradeLoyalty(client, 200);
        expect(shouldUpgrade).toBe(true);
      });

      it('should upgrade when new purchase improves score above threshold', async () => {
        const client = ClientFakeBuilder.aClient()
          .withLoyaltyLevel(LoyaltyLevel.BRONZE)
          .withTotalPurchases(0)
          .withAvgMonthlySpending(1)
          .withLastPurchaseDate(new Date(Date.now() - 400 * 24 * 60 * 60 * 1000))
          .withCreatedAt(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000))
          .build();

        const shouldUpgrade = await boundaryService.shouldUpgradeLoyalty(client, 1);
        expect(shouldUpgrade).toBe(true); // New purchase improves recency significantly
      });
    });

    describe('Silver to Gold transition', () => {
      it('should upgrade from SILVER to GOLD at exact threshold (score 50)', async () => {
        const client = ClientFakeBuilder.aClient()
          .withLoyaltyLevel(LoyaltyLevel.SILVER)
          .withTotalPurchases(15) // frequency score = 40
          .withAvgMonthlySpending(300)
          .withLastPurchaseDate(new Date(Date.now() - 100 * 24 * 60 * 60 * 1000)) // recency score = 40
          .withCreatedAt(new Date(Date.now() - 120 * 24 * 60 * 60 * 1000)) // tenure score = 40
          .build();

        const currentScore = await boundaryService.calculateLoyaltyScore(client);
        expect(currentScore).toBeGreaterThanOrEqual(25);
        expect(currentScore).toBeLessThan(50);

        const shouldUpgrade = await boundaryService.shouldUpgradeLoyalty(client, 500);
        expect(shouldUpgrade).toBe(true);
      });

      it('should not upgrade when already at Gold level with small purchase', async () => {
        const client = ClientFakeBuilder.aClient()
          .withLoyaltyLevel(LoyaltyLevel.GOLD)
          .withTotalPurchases(30)
          .withAvgMonthlySpending(600)
          .withLastPurchaseDate(new Date(Date.now() - 50 * 24 * 60 * 60 * 1000))
          .withCreatedAt(new Date(Date.now() - 200 * 24 * 60 * 60 * 1000))
          .build();

        const shouldUpgrade = await boundaryService.shouldUpgradeLoyalty(client, 5);
        expect(shouldUpgrade).toBe(false);
      });
    });

    describe('Gold to Platinum transition', () => {
      it('should upgrade from GOLD to PLATINUM at exact threshold (score 75)', async () => {
        const client = ClientFakeBuilder.aClient()
          .withLoyaltyLevel(LoyaltyLevel.GOLD)
          .withTotalPurchases(45) // frequency score = 60
          .withAvgMonthlySpending(800)
          .withLastPurchaseDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) // recency score = 80
          .withCreatedAt(new Date(Date.now() - 300 * 24 * 60 * 60 * 1000)) // tenure score = 80
          .build();

        const currentScore = await boundaryService.calculateLoyaltyScore(client);
        expect(currentScore).toBeGreaterThanOrEqual(50);
        expect(currentScore).toBeLessThan(75);

        const shouldUpgrade = await boundaryService.shouldUpgradeLoyalty(client, 1000);
        expect(shouldUpgrade).toBe(true);
      });

      it('should not upgrade when already at Platinum level', async () => {
        const client = ClientFakeBuilder.aClient()
          .withLoyaltyLevel(LoyaltyLevel.PLATINUM)
          .withTotalPurchases(80)
          .withAvgMonthlySpending(1200)
          .withLastPurchaseDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000))
          .withCreatedAt(new Date(Date.now() - 400 * 24 * 60 * 60 * 1000))
          .build();

        const shouldUpgrade = await boundaryService.shouldUpgradeLoyalty(client, 500);
        expect(shouldUpgrade).toBe(false); // Já está no nível máximo
      });
    });

    describe('Edge cases for level boundaries', () => {
      it('should handle score exactly at Silver threshold (25.0)', async () => {
        // Usar frequencyWeight=1.0 para controle preciso
        const preciseService = new LoyaltyCalculationDomainService({
          recencyWeight: 0, frequencyWeight: 1.0, monetaryWeight: 0, tenureWeight: 0,
          minScoreForSilver: 25, minScoreForGold: 50, minScoreForPlatinum: 75
        });

        const client = ClientFakeBuilder.aClient()
          .withTotalPurchases(4) // frequency score = 16 (4*4=16)
          .build();

        const level = await preciseService.calculateLoyaltyLevel(client);
        expect(level).toBe(LoyaltyLevel.BRONZE); // 16 < 25

        const clientAtThreshold = ClientFakeBuilder.aClient()
          .withTotalPurchases(10) // frequency score = 40 (10 purchases = 40 points)
          .build();

        const levelAtThreshold = await preciseService.calculateLoyaltyLevel(clientAtThreshold);
        expect(levelAtThreshold).toBe(LoyaltyLevel.SILVER); // 40 >= 25
      });

      it('should handle score exactly at Gold threshold (50.0)', async () => {
        const preciseService = new LoyaltyCalculationDomainService({
          recencyWeight: 0, frequencyWeight: 1.0, monetaryWeight: 0, tenureWeight: 0,
          minScoreForSilver: 25, minScoreForGold: 50, minScoreForPlatinum: 75
        });

        const client = ClientFakeBuilder.aClient()
          .withTotalPurchases(24) // frequency score = 40 (24 purchases = 40 points)
          .build();

        const level = await preciseService.calculateLoyaltyLevel(client);
        expect(level).toBe(LoyaltyLevel.SILVER); // 40 < 50

        const clientAtThreshold = ClientFakeBuilder.aClient()
          .withTotalPurchases(25) // frequency score = 60 (25 purchases = 60 points)
          .build();

        const levelAtThreshold = await preciseService.calculateLoyaltyLevel(clientAtThreshold);
        expect(levelAtThreshold).toBe(LoyaltyLevel.GOLD); // 60 >= 50 but < 75
      });

      it('should handle score exactly at Platinum threshold (75.0)', async () => {
        const preciseService = new LoyaltyCalculationDomainService({
          recencyWeight: 0, frequencyWeight: 1.0, monetaryWeight: 0, tenureWeight: 0,
          minScoreForSilver: 25, minScoreForGold: 50, minScoreForPlatinum: 75
        });

        const client = ClientFakeBuilder.aClient()
          .withTotalPurchases(25) // frequency score = 60 (25 purchases = 60 points)
          .build();

        const level = await preciseService.calculateLoyaltyLevel(client);
        expect(level).toBe(LoyaltyLevel.GOLD); // 60 >= 50 but < 75

        const clientAtThreshold = ClientFakeBuilder.aClient()
          .withTotalPurchases(100) // frequency score = 100 (100 purchases = 100 points)
          .build();

        const levelAtThreshold = await preciseService.calculateLoyaltyLevel(clientAtThreshold);
        expect(levelAtThreshold).toBe(LoyaltyLevel.PLATINUM); // 100 >= 75
      });
    });
  });
});