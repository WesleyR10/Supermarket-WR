import { Client, ClientId } from '../client.aggregate';
import { LoyaltyLevel } from '../client.aggregate';

export interface ILoyaltyCalculationDomainService {
  calculateLoyaltyLevel(client: Client): Promise<LoyaltyLevel>;
  calculateLoyaltyScore(client: Client): Promise<number>;
  shouldUpgradeLoyalty(client: Client, newPurchaseValue: number): Promise<boolean>;
}

export type LoyaltyCalculationParams = {
  recencyWeight: number; // Peso para recência (0-1)
  frequencyWeight: number; // Peso para frequência (0-1)
  monetaryWeight: number; // Peso para valor monetário (0-1)
  tenureWeight: number; // Peso para tempo como cliente (0-1)
  minScoreForSilver: number; // Score mínimo para Silver
  minScoreForGold: number; // Score mínimo para Gold
  minScoreForPlatinum: number; // Score mínimo para Platinum
};

export class LoyaltyCalculationDomainService implements ILoyaltyCalculationDomainService {
  private readonly params: LoyaltyCalculationParams;

  constructor(
    params?: LoyaltyCalculationParams
  ) {
    this.params = params || {
      recencyWeight: 0.25,
      frequencyWeight: 0.30,
      monetaryWeight: 0.35,
      tenureWeight: 0.10,
      minScoreForSilver: 25,
      minScoreForGold: 50,
      minScoreForPlatinum: 75
    };
    this.validateParams(this.params);
  }

  async calculateLoyaltyLevel(client: Client): Promise<LoyaltyLevel> {
    const score = await this.calculateLoyaltyScore(client);
    return this.mapScoreToLevel(score);
  }

  async calculateLoyaltyScore(client: Client): Promise<number> {
    const recencyScore = this.calculateRecencyScore(client);
    const frequencyScore = this.calculateFrequencyScore(client);
    const monetaryScore = this.calculateMonetaryScore(client);
    const tenureScore = this.calculateTenureScore(client);

    const weightedScore = (
      recencyScore * this.params.recencyWeight +
      frequencyScore * this.params.frequencyWeight +
      monetaryScore * this.params.monetaryWeight +
      tenureScore * this.params.tenureWeight
    );

    // Normaliza o score para escala 0-100
    return Math.min(100, Math.max(0, weightedScore));
  }

  async shouldUpgradeLoyalty(client: Client, newPurchaseValue: number): Promise<boolean> {
  if (newPurchaseValue == null || newPurchaseValue <= 0 || newPurchaseValue > 100000) {
    return false;
  }
  const currentLevel = client.loyalty_level;
  
  // Simula o impacto da nova compra
  const simulatedClient = this.simulateNewPurchase(client, newPurchaseValue);
  const newLevel = await this.calculateLoyaltyLevel(simulatedClient);
  
  return this.isLevelUpgrade(currentLevel, newLevel);
}

  private calculateRecencyScore(client: Client): number {
    if (!client.last_purchase_date) {
      return 0;
    }

    const daysSinceLastPurchase = this.getDaysSince(client.last_purchase_date);
    
    // Score baseado na recência (mais recente = maior score)
    if (daysSinceLastPurchase <= 7) return 100;
    if (daysSinceLastPurchase <= 30) return 80;
    if (daysSinceLastPurchase <= 90) return 60;
    if (daysSinceLastPurchase <= 180) return 40;
    if (daysSinceLastPurchase <= 365) return 20;
    return 10;
  }

  private calculateFrequencyScore(client: Client): number {
    const totalPurchases = client.total_purchases;
    
    // Score baseado na frequência de compras
    if (totalPurchases >= 100) return 100;
    if (totalPurchases >= 50) return 80;
    if (totalPurchases >= 25) return 60;
    if (totalPurchases >= 10) return 40;
    if (totalPurchases >= 5) return 20;
    return totalPurchases * 4; // 4 pontos por compra até 5 compras
  }

  private calculateMonetaryScore(client: Client): number {
    if (client.total_purchases === 0) {
      return 0;
    }
    // Calcula total gasto estimado baseado em avg_monthly_spending e tempo como cliente
    const totalSpent = this.calculateEstimatedTotalSpent(client);
    
    // Score baseado no valor total gasto (ajustar valores conforme negócio)
    if (totalSpent >= 10000) return 100;
    if (totalSpent >= 5000) return 80;
    if (totalSpent >= 2500) return 60;
    if (totalSpent >= 1000) return 40;
    if (totalSpent >= 500) return 20;
    return Math.min(20, totalSpent / 25); // 1 ponto a cada R$ 25 até R$ 500
  }

  private calculateEstimatedTotalSpent(client: Client): number {
    if (!client.avg_monthly_spending) return 0;
    
    const monthsAsClient = this.getMonthsSince(client.created_at);
    return client.avg_monthly_spending * monthsAsClient;
  }

  private calculateTenureScore(client: Client): number {
    const daysSinceRegistration = this.getDaysSince(client.created_at);
    const monthsAsClient = Math.floor(daysSinceRegistration / 30);
    
    // Score baseado no tempo como cliente
    if (monthsAsClient >= 24) return 100;
    if (monthsAsClient >= 12) return 80;
    if (monthsAsClient >= 6) return 60;
    if (monthsAsClient >= 3) return 40;
    if (monthsAsClient >= 1) return 20;
    return monthsAsClient * 20; // 20 pontos por mês no primeiro mês
  }

  private getMonthsSince(date: Date | null): number {
    if (!date) return 999; // Valor alto para clientes sem data
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30)));
  }

  private mapScoreToLevel(score: number): LoyaltyLevel {
    if (score >= this.params.minScoreForPlatinum) return LoyaltyLevel.PLATINUM;
    if (score >= this.params.minScoreForGold) return LoyaltyLevel.GOLD;
    if (score >= this.params.minScoreForSilver) return LoyaltyLevel.SILVER;
    return LoyaltyLevel.BRONZE;
  }

  private simulateNewPurchase(client: Client, purchaseValue: number): Client {
  const months = this.getMonthsSince(client.created_at);
  const currentEstimatedTotal = (client.avg_monthly_spending || 0) * months;
  const newTotal = currentEstimatedTotal + purchaseValue;
  const newAvg = months > 0 ? newTotal / months : 0;
  const simulatedData = {
    client_id: new ClientId(client.client_id.id),
    user_id: client.user_id,
    stores_id: client.stores_id,
    loyalty_points: client.loyalty_points,
    loyalty_level: client.loyalty_level,
    loyalty_card_number: client.loyalty_card_number,
    customer_type: client.customer_type,
    avg_monthly_spending: newAvg,
    total_purchases: client.total_purchases + 1,
    credit_limit: client.credit_limit,
    preferred_contact_method: client.preferred_contact_method,
    allows_promotions: client.allows_promotions,
    allows_sms: client.allows_sms,
    allows_email: client.allows_email,
    payment_preference: client.payment_preference,
    delivery_preference: client.delivery_preference,
    last_purchase_date: new Date(),
    registration_source: client.registration_source,
    notes: client.notes,
    is_active: client.is_active,
    created_at: client.created_at,
    updated_at: client.updated_at,
    deleted_at: client.deleted_at
  };
  return new Client(simulatedData);
}

  private isLevelUpgrade(currentLevel: LoyaltyLevel, newLevel: LoyaltyLevel): boolean {
    const levelOrder = {
      [LoyaltyLevel.BRONZE]: 0,
      [LoyaltyLevel.SILVER]: 1,
      [LoyaltyLevel.GOLD]: 2,
      [LoyaltyLevel.PLATINUM]: 3
    };

    return levelOrder[newLevel] > levelOrder[currentLevel];
  }

  private getDaysSince(date: Date | null): number {
    if (!date) return 999; // Valor alto para clientes sem data
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  private validateParams(params: LoyaltyCalculationParams): void {
    const totalWeight = params.recencyWeight + params.frequencyWeight + 
                       params.monetaryWeight + params.tenureWeight;
    
    if (Math.abs(totalWeight - 1.0) > 0.001) {
      throw new Error('A soma dos pesos deve ser igual a 1.0');
    }

    if (params.minScoreForSilver >= params.minScoreForGold || 
        params.minScoreForGold >= params.minScoreForPlatinum) {
      throw new Error('Os scores mínimos devem estar em ordem crescente');
    }
  }
}

export class LoyaltyCalculationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LoyaltyCalculationError';
  }
}