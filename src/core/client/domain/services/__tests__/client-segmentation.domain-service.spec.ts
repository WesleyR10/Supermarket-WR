import { 
  ClientSegmentationDomainService, 
  SegmentType, 
  ChurnRiskLevel, 
  SegmentationParams,
  ClientSegment
} from '../client-segmentation.domain-service';
import { ClientFakeBuilder } from '../../client-fake.builder';
import { LoyaltyLevel, CustomerType } from '../../client.aggregate';
import { subMonths } from 'date-fns';

// Remover o describe aninhado e integrar testes ao principal
describe('ClientSegmentationDomainService Unit Tests', () => {
  let service: ClientSegmentationDomainService;
  let defaultParams: SegmentationParams;

  beforeEach(() => {
    defaultParams = {
      recencyThresholds: [30, 90, 180, 365],
      frequencyThresholds: [1, 5, 15, 30],
      monetaryThresholds: [100, 500, 2000, 5000],
      ltvRecencyWeight: 0.20,
      ltvFrequencyWeight: 0.30,
      ltvMonetaryWeight: 0.40,
      ltvTenureWeight: 0.10,
      churnDaysThreshold: 180,
      churnFrequencyThreshold: 2,
      highValueThreshold: 2000,
      mediumValueThreshold: 500
    };
    service = new ClientSegmentationDomainService(defaultParams);
  });

  describe('Constructor', () => {
    it('should create service with default parameters', () => {
      const defaultService = new ClientSegmentationDomainService();
      expect(defaultService).toBeDefined();
    });

    it('should throw error when LTV weights do not sum to 1.0', () => {
      const invalidParams = {
        ...defaultParams,
        ltvRecencyWeight: 0.30,
        ltvFrequencyWeight: 0.30,
        ltvMonetaryWeight: 0.30,
        ltvTenureWeight: 0.30 // Total = 1.2
      };

      expect(() => new ClientSegmentationDomainService(invalidParams))
        .toThrow('A soma dos pesos de LTV deve ser igual a 1.0');
    });
  });

  describe('segmentClient', () => {
    it('should classify champion client correctly', async () => {
      const client = ClientFakeBuilder.aClient()
        .withChampionClient()
        .withTotalSpent(8000)
        .withCreatedAt(new Date(Date.now() - 730 * 24 * 60 * 60 * 1000)) // 2 anos
        .build();

      const segment = await service.segmentClient(client);

      expect(segment.segmentType).toBe(SegmentType.CHAMPIONS);
      expect(segment.confidence).toBeGreaterThan(70);
      expect(segment.churnRisk).toBe(ChurnRiskLevel.VERY_LOW);
      expect(segment.lifetimeValue).toBeGreaterThan(5000);
      expect(segment.characteristics).toContain('Comprador recente');
      expect(segment.characteristics).toContain('Comprador frequente');
      expect(segment.characteristics).toContain('Alto valor');
    });

    it('should classify new client correctly', async () => {
      const client = ClientFakeBuilder.aClient()
        .withNewClient()
        .withCreatedAt(new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)) // 15 dias
        .build();

      const segment = await service.segmentClient(client);

      expect(segment.segmentType).toBe(SegmentType.NEW_CUSTOMERS);
      expect(segment.churnRisk).toBe(ChurnRiskLevel.MEDIUM);
      expect(segment.characteristics).toContain('Cliente novo');
      expect(segment.recommendedActions).toContain('Programa de boas-vindas');
    });

    it('should classify at-risk client correctly', async () => {
      const client = ClientFakeBuilder.aClient()
        .withAtRiskClient()
        .withCreatedAt(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)) // 1 ano
        .build();

      const segment = await service.segmentClient(client);

      expect(segment.segmentType).toBeOneOf([SegmentType.AT_RISK, SegmentType.ABOUT_TO_SLEEP]);
      expect(segment.churnRisk).toBeOneOf([ChurnRiskLevel.HIGH, ChurnRiskLevel.VERY_HIGH]);
      expect(segment.recommendedActions).toContain('Campanha de reativação urgente');
    });

    it('should classify lost client correctly', async () => {
      const client = ClientFakeBuilder.aClient()
        .withLostClient()
        .withCreatedAt(new Date(Date.now() - 730 * 24 * 60 * 60 * 1000)) // 2 anos
        .build();

      const segment = await service.segmentClient(client);

      expect([SegmentType.LOST, SegmentType.HIBERNATING]).toContain(segment.segmentType);
      expect(segment.churnRisk).toBe(ChurnRiskLevel.VERY_HIGH);
      expect(segment.recommendedActions).toContain('Última tentativa de reativação');
    });

    it('should classify loyal customer correctly', async () => {
      const client = ClientFakeBuilder.aClient()
        .withFrequentBuyer()
        .withLoyaltyLevel(LoyaltyLevel.GOLD)
        .withTotalSpent(3000)
        .withCreatedAt(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)) // 1 ano
        .build();

      const segment = await service.segmentClient(client);

      expect([SegmentType.LOYAL_CUSTOMERS, SegmentType.CHAMPIONS]).toContain(segment.segmentType);
      expect(segment.churnRisk).toBeOneOf([ChurnRiskLevel.LOW, ChurnRiskLevel.VERY_LOW]);
      expect(segment.characteristics).toContain('Cliente fiel');
    });
  });

  describe('calculateSegmentScore', () => {
    it('should return high score for client in their correct segment', async () => {
      const client = ClientFakeBuilder.aClient()
        .withChampionClient()
        .withTotalSpent(10000)
        .build();

      const score = await service.calculateSegmentScore(client, SegmentType.CHAMPIONS);

      expect(score).toBeGreaterThan(70);
    });

    it('should return lower score for client in wrong segment', async () => {
      const client = ClientFakeBuilder.aClient()
        .withNewClient()
        .build();

      const score = await service.calculateSegmentScore(client, SegmentType.CHAMPIONS);

      expect(score).toBeLessThan(30);
    });

    it('should return medium score for borderline cases', async () => {
      // Criar um cliente que seja classificado como PROMISING (próximo a POTENTIAL_LOYALISTS)
      const client = ClientFakeBuilder.aClient()
        .withTotalPurchases(8) // Frequência média-baixa
        .withAvgMonthlySpending(400) // Valor monetário médio
        .withLastPurchaseDate(new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)) // 15 dias atrás (recência boa)
        .withCreatedAt(new Date(Date.now() - 120 * 24 * 60 * 60 * 1000)) // 4 meses como cliente
        .build();

      const score = await service.calculateSegmentScore(client, SegmentType.POTENTIAL_LOYALISTS);

      expect(score).toBeGreaterThan(30);
      expect(score).toBeLessThan(80);
    });
  });

  describe('predictChurnRisk', () => {
    it('should predict very low risk for active champion', async () => {
      const client = ClientFakeBuilder.aClient()
        .withChampionClient()
        .withLastPurchaseDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)) // 5 dias
        .withTotalSpent(8000)
        .build();

      const churnRisk = await service.predictChurnRisk(client);

      expect(churnRisk).toBe(ChurnRiskLevel.VERY_LOW);
    });

    it('should predict high risk for inactive client', async () => {
      const client = ClientFakeBuilder.aClient()
        .withLastPurchaseDate(new Date(Date.now() - 200 * 24 * 60 * 60 * 1000)) // 200 dias
        .withTotalPurchases(2)
        .withTotalSpent(100)
        .build();

      const churnRisk = await service.predictChurnRisk(client);

      expect(churnRisk).toBeOneOf([ChurnRiskLevel.HIGH, ChurnRiskLevel.VERY_HIGH]);
    });

    it('should predict medium risk for occasional buyer', async () => {
      const client = ClientFakeBuilder.aClient()
        .withOccasionalBuyer()
        .withLastPurchaseDate(new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)) // 60 dias
        .withTotalSpent(800)
        .build();

      const churnRisk = await service.predictChurnRisk(client);

      expect(churnRisk).toBeOneOf([ChurnRiskLevel.LOW, ChurnRiskLevel.MEDIUM]);
    });

    it('should handle client with no purchase history', async () => {
      const client = ClientFakeBuilder.aClient()
        .withTotalPurchases(0)
        .withLastPurchaseDate(null)
        .withTotalSpent(0)
        .build();

      const churnRisk = await service.predictChurnRisk(client);

      expect(churnRisk).toBe(ChurnRiskLevel.VERY_HIGH);
    });
  });

  describe('recommendActions', () => {
    it('should recommend VIP actions for champions', async () => {
      const segment: ClientSegment = {
        segmentType: SegmentType.CHAMPIONS,
        confidence: 90,
        characteristics: ['Alto valor', 'Comprador frequente'],
        behaviorPattern: {
          purchaseFrequency: 'HIGH',
          averageOrderValue: 'HIGH',
          seasonality: 'CONSISTENT',
          pricesensitivity: 'LOW',
          channelPreference: 'OMNICHANNEL'
        },
        churnRisk: ChurnRiskLevel.VERY_LOW,
        lifetimeValue: 15000,
        recommendedActions: []
      };

      const client = ClientFakeBuilder.aClient().withChampionClient().build();
      const actions = await service.recommendActions(client, segment);

      expect(actions).toContain('Oferecer programa VIP exclusivo');
      expect(actions).toContain('Solicitar indicações e reviews');
      expect(actions).toContain('Produtos premium e lançamentos');
    });

    it('should recommend retention actions for at-risk clients', async () => {
      const segment: ClientSegment = {
        segmentType: SegmentType.AT_RISK,
        confidence: 80,
        characteristics: ['Baixa frequência'],
        behaviorPattern: {
          purchaseFrequency: 'LOW',
          averageOrderValue: 'MEDIUM',
          seasonality: 'IRREGULAR',
          pricesensitivity: 'HIGH',
          channelPreference: 'OFFLINE'
        },
        churnRisk: ChurnRiskLevel.HIGH,
        lifetimeValue: 500,
        recommendedActions: []
      };

      const client = ClientFakeBuilder.aClient().withAtRiskClient().build();
      const actions = await service.recommendActions(client, segment);

      expect(actions).toContain('Campanha de reativação urgente');
      expect(actions).toContain('Desconto especial limitado');
      expect(actions).toContain('Intervenção imediata para retenção');
    });

    it('should recommend onboarding actions for new customers', async () => {
      const segment: ClientSegment = {
        segmentType: SegmentType.NEW_CUSTOMERS,
        confidence: 85,
        characteristics: ['Cliente novo'],
        behaviorPattern: {
          purchaseFrequency: 'LOW',
          averageOrderValue: 'LOW',
          seasonality: 'CONSISTENT',
          pricesensitivity: 'MEDIUM',
          channelPreference: 'ONLINE'
        },
        churnRisk: ChurnRiskLevel.MEDIUM,
        lifetimeValue: 200,
        recommendedActions: []
      };

      const client = ClientFakeBuilder.aClient().withNewClient().build();
      const actions = await service.recommendActions(client, segment);

      expect(actions).toContain('Programa de boas-vindas');
      expect(actions).toContain('Tutorial de produtos e serviços');
      expect(actions).toContain('Desconto na segunda compra');
    });
  });

  describe('bulkSegmentation', () => {
    it('should segment multiple clients correctly', async () => {
      const clients = [
        ClientFakeBuilder.aClient().withChampionClient().build(),
        ClientFakeBuilder.aClient().withNewClient().build(),
        ClientFakeBuilder.aClient().withAtRiskClient().build()
      ];

      const segmentationMap = await service.bulkSegmentation(clients);

      expect(segmentationMap.size).toBe(3);
      
      const segments = Array.from(segmentationMap.values());
      expect(segments.some(s => s.segmentType === SegmentType.CHAMPIONS)).toBe(true);
      expect(segments.some(s => s.segmentType === SegmentType.NEW_CUSTOMERS)).toBe(true);
      // Verificar se pelo menos um dos segmentos válidos está presente
      expect(segments.length).toBe(3);
    });

    it('should handle empty client list', async () => {
      const segmentationMap = await service.bulkSegmentation([]);

      expect(segmentationMap.size).toBe(0);
    });

    it('should handle large client list efficiently', async () => {
      const clients = Array.from({ length: 100 }, () => 
        ClientFakeBuilder.aClient().withOccasionalBuyer().build()
      );

      const startTime = Date.now();
      const segmentationMap = await service.bulkSegmentation(clients);
      const endTime = Date.now();

      expect(segmentationMap.size).toBe(100);
      expect(endTime - startTime).toBeLessThan(5000); // Deve processar em menos de 5 segundos
    });
  });

  describe('RFM Score Calculation', () => {
    it('should calculate high RFM scores for champion client', () => {
      const client = ClientFakeBuilder.aClient()
        .withChampionClient()
        .withLastPurchaseDate(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)) // 10 dias
        .withTotalPurchases(50)
        .withTotalSpent(8000)
        .build();

      const rfmScores = service.calculateRFMScores(client);

      expect(rfmScores.R).toBeGreaterThanOrEqual(4);
      expect(rfmScores.F).toBeGreaterThanOrEqual(4);
      expect(rfmScores.M).toBeGreaterThanOrEqual(4);
    });

    it('should calculate low RFM scores for inactive client', () => {
      const client = ClientFakeBuilder.aClient()
        .withLastPurchaseDate(new Date(Date.now() - 400 * 24 * 60 * 60 * 1000)) // 400 dias
        .withTotalPurchases(2)
        .withTotalSpent(80)
        .build();

      const rfmScores = service.calculateRFMScores(client);

      expect(rfmScores.R).toBeLessThanOrEqual(2);
      expect(rfmScores.F).toBeLessThanOrEqual(2);
      expect(rfmScores.M).toBeLessThanOrEqual(2);
    });
  });

  // Remove duplicate describe('ClientSegmentationDomainService') and integrate tests
  // Add or merge to existing Behavior Pattern Analysis if not present
  describe('Behavior Pattern Analysis', () => {
    it('should analyze irregular seasonality', () => {
      const client = ClientFakeBuilder.aClient()
        .withTotalPurchases(3)
        .withLastPurchaseDate(subMonths(new Date(), 6))
        .build();
      const pattern = service.analyzeBehaviorPattern(client);
      expect(pattern.seasonality).toBe('IRREGULAR');
    });
    it('should analyze high price sensitivity', () => {
      const client = ClientFakeBuilder.aClient()
        .withAvgMonthlySpending(50)
        .withTotalSpent(500)
        .build();
      const pattern = service.analyzeBehaviorPattern(client);
      expect(pattern.pricesensitivity).toBe('HIGH');
    });
    it('should analyze offline channel preference', () => {
      const client = ClientFakeBuilder.aClient()
        .withCustomerType(CustomerType.BUSINESS)
        .build();
      const pattern = service.analyzeBehaviorPattern(client);
      expect(pattern.channelPreference).toBe('OFFLINE');
    });
  });

  // Merge to existing Constructor
  it('should validate params and throw on invalid weights', () => {
    const invalidParams = { ...defaultParams, ltvRecencyWeight: 0.5, ltvFrequencyWeight: 0.6 };
    expect(() => new ClientSegmentationDomainService(invalidParams)).toThrow('A soma dos pesos de LTV deve ser igual a 1.0');
  });

  // Merge to existing segmentClient
  it('should return valid segment structure for champion client', async () => {
    const client = ClientFakeBuilder.aClient().withChampionClient().build();
    const segment = await service.segmentClient(client);
    
    expect(segment.segmentType).toBe(SegmentType.CHAMPIONS);
    expect(segment.confidence).toBeGreaterThan(80);
    expect(segment.churnRisk).toBe(ChurnRiskLevel.VERY_LOW);
    expect(segment.lifetimeValue).toBeGreaterThan(50000);
    expect(segment.characteristics).toContain('Comprador recente');
    expect(segment.characteristics).toContain('Comprador frequente');
    expect(segment.characteristics).toContain('Alto valor');
    expect(segment.recommendedActions).toContain('Oferecer programa VIP exclusivo');
  });

  describe('Lifetime Value Calculation', () => {
    it('should calculate high LTV for champion client', () => {
      const client = ClientFakeBuilder.aClient()
        .withChampionClient()
        .withLoyaltyLevel(LoyaltyLevel.PLATINUM)
        .withTotalSpent(10000)
        .withCreatedAt(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)) // 1 ano
        .build();

      const ltv = service.calculateLifetimeValue(client);

      expect(ltv).toBeGreaterThan(5000);
    });

    it('should calculate low LTV for new client', () => {
      const client = ClientFakeBuilder.aClient()
        .withNewClient()
        .withLoyaltyLevel(LoyaltyLevel.BRONZE)
        .withCreatedAt(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) // 1 mês
        .build();

      const ltv = service.calculateLifetimeValue(client);

      expect(ltv).toBeLessThan(1000);
    });
  });

  describe('Edge Cases', () => {
    it('should handle client with null last purchase date', async () => {
      const oldDate = new Date();
      oldDate.setFullYear(oldDate.getFullYear() - 2); // 2 anos atrás
      
      const client = ClientFakeBuilder.aClient()
        .withLastPurchaseDate(null)
        .withTotalPurchases(0)
        .withTotalSpent(0)
        .withCreatedAt(oldDate) // Cliente antigo, não recentemente criado
        .build();

      const segment = await service.segmentClient(client);

      expect(segment.segmentType).toBeOneOf([SegmentType.NEW_CUSTOMERS, SegmentType.LOST]);
      expect(segment.churnRisk).toBeOneOf([ChurnRiskLevel.HIGH, ChurnRiskLevel.VERY_HIGH]);
    });

    it('should handle client with future creation date', async () => {
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 1 mês no futuro
      const client = ClientFakeBuilder.aClient()
        .withCreatedAt(futureDate)
        .withTotalSpent(1000)
        .build();

      const segment = await service.segmentClient(client);

      expect(segment).toBeDefined();
      expect(segment.confidence).toBeGreaterThanOrEqual(0);
    });

    it('should handle client with extremely high values', async () => {
      const client = ClientFakeBuilder.aClient()
        .withTotalPurchases(10000)
        .withTotalSpent(1000000)
        .withLastPurchaseDate(new Date())
        .withCreatedAt(new Date(Date.now() - 10 * 365 * 24 * 60 * 60 * 1000)) // 10 anos
        .build();

      const segment = await service.segmentClient(client);

      expect(segment.segmentType).toBe(SegmentType.CHAMPIONS);
      expect(segment.confidence).toBeGreaterThan(80);
    });
  });

  describe('Custom Parameters', () => {
    it('should work with custom thresholds', async () => {
      const customParams: SegmentationParams = {
        recencyThresholds: [15, 45, 90, 180],
        frequencyThresholds: [2, 10, 25, 50],
        monetaryThresholds: [200, 1000, 3000, 8000],
        
        ltvRecencyWeight: 0.30,
        ltvFrequencyWeight: 0.40,
        ltvMonetaryWeight: 0.25,
        ltvTenureWeight: 0.05,
        
        churnDaysThreshold: 120,
        churnFrequencyThreshold: 3,
        
        highValueThreshold: 3000,
        mediumValueThreshold: 1000
      };

      const customService = new ClientSegmentationDomainService(customParams);
      
      const client = ClientFakeBuilder.aClient()
        .withFrequentBuyer()
        .withTotalSpent(2000)
        .build();

      const segment = await customService.segmentClient(client);

      expect(segment).toBeDefined();
      expect(Object.values(SegmentType)).toContain(segment.segmentType);
    });

    it('should work with different LTV weight distribution', async () => {
      const customParams: SegmentationParams = {
        ...defaultParams,
        ltvRecencyWeight: 0.10,
        ltvFrequencyWeight: 0.20,
        ltvMonetaryWeight: 0.60, // Maior peso para valor monetário
        ltvTenureWeight: 0.10
      };

      const customService = new ClientSegmentationDomainService(customParams);
      
      const highValueClient = ClientFakeBuilder.aClient()
        .withTotalSpent(10000)
        .withTotalPurchases(10) // Baixa frequência
        .withLastPurchaseDate(new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)) // 60 dias
        .build();

      const segment = await customService.segmentClient(highValueClient);

      expect(segment.lifetimeValue).toBeGreaterThan(3000);
    });
  });
});

// Move helper outside of any describe
// Helper para expect.toBeOneOf
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeOneOf(expected: any[]): R;
    }
  }
}

expect.extend({
  toBeOneOf(received, expected) {
    const pass = expected.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${expected}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${expected}`,
        pass: false,
      };
    }
  },
});

// Remove the extra }); at the end of the file
// Ensure proper closure of main describe block

// End of tests