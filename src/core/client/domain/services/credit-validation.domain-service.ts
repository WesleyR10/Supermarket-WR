import { Client } from '../client.aggregate';
import { CustomerType } from '../client.aggregate';

export interface ICreditValidationDomainService {
  validateCreditLimit(client: Client, requestedAmount: number): Promise<CreditValidationResult>;
  calculateMaxCreditLimit(client: Client): Promise<number>;
  updateCreditScore(client: Client): Promise<number>;
  canIncreaseCreditLimit(client: Client, newLimit: number): Promise<boolean>;
}

export type CreditValidationResult = {
  approved: boolean;
  approvedAmount: number;
  rejectionReasons: string[];
  riskLevel: RiskLevel;
  creditScore: number;
  recommendations: string[];
};

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  VERY_HIGH = 'VERY_HIGH'
}

export type CreditValidationParams = {
  // Fatores de score
  purchaseHistoryWeight: number;
  paymentHistoryWeight: number;
  loyaltyWeight: number;
  tenureWeight: number;
  
  // Limites por tipo de cliente
  individualMaxCredit: number;
  corporateMaxCredit: number;
  vipMaxCredit: number;
  
  // Thresholds de risco
  lowRiskThreshold: number;
  mediumRiskThreshold: number;
  highRiskThreshold: number;
  
  // Configurações de validação
  minCreditScore: number;
  maxDebtToIncomeRatio: number;
  minMonthsAsClient: number;
  minSuccessfulPayments: number;
};

export class CreditValidationDomainService implements ICreditValidationDomainService {
  private readonly defaultParams: CreditValidationParams = {
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
    
    minCreditScore: 30,
    maxDebtToIncomeRatio: 0.3,
    minMonthsAsClient: 1,
    minSuccessfulPayments: 2
  };
  private readonly params: CreditValidationParams;

  constructor(params?: CreditValidationParams) {
    this.params = params ?? this.defaultParams;
    this.validateParams(this.params);
  }

  async validateCreditLimit(client: Client, requestedAmount: number): Promise<CreditValidationResult> {    
    // Verifica se o valor solicitado é válido
    if (requestedAmount <= 0) {
      return {
        approved: false,
        approvedAmount: 0,
        rejectionReasons: ['Valor solicitado deve ser maior que zero'],
        riskLevel: RiskLevel.VERY_HIGH,
        creditScore: 0,
        recommendations: []
      };
    }

    // Realiza as verificações básicas
    const validationResult = await this.performValidationChecks(client, requestedAmount);
    if (!validationResult.passed) {
      return {
        approved: false,
        approvedAmount: 0,
        rejectionReasons: [validationResult.reason!],
        riskLevel: RiskLevel.VERY_HIGH,
        creditScore: 0,
        recommendations: []
      };
    }

    // Calcula score de crédito e limite máximo
    const creditScore = await this.updateCreditScore(client);
    const maxLimit = await this.calculateMaxCreditLimit(client);
    const riskLevel = this.calculateRiskLevel(creditScore);

    // Verifica se passou na validação E se o valor solicitado está dentro do limite
    const approved = validationResult.passed && requestedAmount <= maxLimit;
    const approvedAmount = approved ? requestedAmount : 0;

    const rejectionReasons: string[] = [];
    if (!validationResult.passed && validationResult.reason) {
      rejectionReasons.push(validationResult.reason);
    }
    if (requestedAmount > maxLimit) {
      rejectionReasons.push(`Valor solicitado excede o limite máximo de R$ ${maxLimit.toFixed(2)}`);
    }

    return {
      approved,
      approvedAmount,
      rejectionReasons,
      riskLevel,
      creditScore,
      recommendations: this.generateRecommendations(client, validationResult)
    };
  }

  async calculateMaxCreditLimit(client: Client): Promise<number> {
    // Verifica se o cliente atende aos requisitos mínimos
    const validationResult = await this.performValidationChecks(client, 0);
    if (!validationResult.passed) {
      return 0;
    }
    
    const creditScore = await this.updateCreditScore(client);
    
    // Verifica se o score atende ao mínimo
    if (creditScore < this.params.minCreditScore) {
      return 0;
    }
    
    const maxLimit = this.getBaseLimitByCustomerType(client.customer_type); // Limite máximo absoluto
    const baseLimit = maxLimit * 0.50; // Base é 50% do limite máximo (mais generoso)
    
    // Aplica multiplicador baseado no score de crédito
    const scoreMultiplier = this.calculateScoreMultiplier(creditScore);
    
    // Aplica ajustes baseados no histórico
    const historyMultiplier = this.calculateHistoryMultiplier(client);
    
    // Aplica limitações de risco
    const riskMultiplier = this.calculateRiskMultiplier(creditScore);
    
    const calculatedLimit = baseLimit * scoreMultiplier * historyMultiplier * riskMultiplier;
    
    // SEMPRE respeita o limite máximo absoluto do tipo de cliente
    const finalLimit = Math.min(calculatedLimit, maxLimit);
    
    return Math.round(finalLimit);
  }

  async updateCreditScore(client: Client): Promise<number> {
    const purchaseScore = this.calculatePurchaseHistoryScore(client);
    const paymentScore = this.calculatePaymentHistoryScore(client);
    const loyaltyScore = this.calculateLoyaltyScore(client);
    const tenureScore = this.calculateTenureScore(client);

    // Validar se todos os scores são números válidos
    const validPurchaseScore = isNaN(purchaseScore) ? 0 : purchaseScore;
    const validPaymentScore = isNaN(paymentScore) ? 0 : paymentScore;
    const validLoyaltyScore = isNaN(loyaltyScore) ? 0 : loyaltyScore;
    const validTenureScore = isNaN(tenureScore) ? 0 : tenureScore;

    const weightedScore = (
      validPurchaseScore * this.params.purchaseHistoryWeight +
      validPaymentScore * this.params.paymentHistoryWeight +
      validLoyaltyScore * this.params.loyaltyWeight +
      validTenureScore * this.params.tenureWeight
    );

    return Math.min(100, Math.max(0, weightedScore));
  }

  async canIncreaseCreditLimit(client: Client, newLimit: number): Promise<boolean> {
    const currentMaxLimit = await this.calculateMaxCreditLimit(client);
    const absoluteMaxLimit = this.getBaseLimitByCustomerType(client.customer_type);
    const creditScore = await this.updateCreditScore(client);
    
    // Verifica se o novo limite não excede o limite absoluto do tipo de cliente
    if (newLimit > absoluteMaxLimit) {
      return false;
    }
    
    // Verifica se o novo limite não excede o máximo calculado
    if (newLimit > currentMaxLimit) {
      return false;
    }
    
    // Verifica se o score de crédito é suficiente
    if (creditScore < this.params.minCreditScore) {
      return false;
    }
    
    return true;
  }

  private async performValidationChecks(client: Client, requestedAmount: number): Promise<ValidationCheckResult> {
    // Verifica tempo mínimo como cliente
    const monthsAsClient = this.getMonthsSince(client.created_at);
    if (monthsAsClient < this.params.minMonthsAsClient) {
      return {
        passed: false,
        reason: `Cliente deve ter pelo menos ${this.params.minMonthsAsClient} meses de cadastro`
      };
    }

    // Verifica histórico de pagamentos (usando total_purchases como proxy)
    if (client.total_purchases < this.params.minSuccessfulPayments) {
      return {
        passed: false,
        reason: `Cliente deve ter pelo menos ${this.params.minSuccessfulPayments} compras realizadas`
      };
    }

    // Verifica se cliente está ativo
    if (!client.is_active) {
      return {
        passed: false,
        reason: 'Cliente inativo'
      };
    }

    // Verifica score mínimo
    const creditScore = await this.updateCreditScore(client);
    if (creditScore < this.params.minCreditScore) {
      return {
        passed: false,
        reason: `Score de crédito insuficiente (mínimo: ${this.params.minCreditScore})`
      };
    }

    return { passed: true };
  }

  private calculatePurchaseHistoryScore(client: Client): number {
    const totalSpent = this.calculateEstimatedTotalSpent(client);
    const avgPurchaseValue = client.total_purchases > 0 ? totalSpent / client.total_purchases : 0;
    
    // Score baseado no valor total e ticket médio
    let score = 0;
    
    // Pontuação por valor total gasto
    if (totalSpent >= 10000) score += 40;
    else if (totalSpent >= 5000) score += 30;
    else if (totalSpent >= 2000) score += 20;
    else if (totalSpent >= 500) score += 10;
    
    // Pontuação por ticket médio
    if (avgPurchaseValue >= 200) score += 30;
    else if (avgPurchaseValue >= 100) score += 20;
    else if (avgPurchaseValue >= 50) score += 10;
    
    // Pontuação por consistência (frequência de compras)
    const monthsAsClient = this.getMonthsSince(client.created_at);
    const purchasesPerMonth = monthsAsClient > 0 && monthsAsClient !== 999 ? client.total_purchases / monthsAsClient : 0;
    
    if (purchasesPerMonth >= 4) score += 30;
    else if (purchasesPerMonth >= 2) score += 20;
    else if (purchasesPerMonth >= 1) score += 10;
    
    return Math.min(100, score);
  }

  private calculateEstimatedTotalSpent(client: Client): number {
    if (!client.avg_monthly_spending) return 0;
    
    const monthsAsClient = this.getMonthsSince(client.created_at);
    if (monthsAsClient <= 0) return 0; // Evita valores negativos para datas futuras
    
    return client.avg_monthly_spending * monthsAsClient;
  }

  private calculatePaymentHistoryScore(client: Client): number {
    // Usa total_purchases como proxy para histórico de pagamentos
    const totalPurchases = client.total_purchases;
    
    if (totalPurchases === 0) return 0;
    
    // Assume uma taxa de sucesso alta para clientes com muitas compras
    let score = 0;
    
    // Score baseado no volume de compras (proxy para pagamentos bem-sucedidos)
    if (totalPurchases >= 50) score = 90;
    else if (totalPurchases >= 20) score = 75;
    else if (totalPurchases >= 10) score = 60;
    else if (totalPurchases >= 5) score = 45;
    else score = 20;
    
    // Bônus por cliente ativo (compra recente)
    if (client.last_purchase_date) {
      const daysSinceLastPurchase = Math.floor((Date.now() - client.last_purchase_date.getTime()) / (24 * 60 * 60 * 1000));
      if (daysSinceLastPurchase <= 30) score += 10;
      else if (daysSinceLastPurchase <= 90) score += 5;
    }
    
    return Math.min(100, Math.max(0, score));
  }

  private calculateLoyaltyScore(client: Client): number {
    // Converte nível de fidelidade em score numérico
    const loyaltyScores = {
      'BRONZE': 25,
      'SILVER': 50,
      'GOLD': 75,
      'PLATINUM': 100
    };
    
    return loyaltyScores[client.loyalty_level] || 0;
  }

  private calculateTenureScore(client: Client): number {
    const monthsAsClient = this.getMonthsSince(client.created_at);
    if (monthsAsClient <= 0) return 0;
    
    // Score baseado no tempo como cliente (máximo 100 pontos para 24+ meses)
    const tenureScore = Math.min(100, (monthsAsClient / 24) * 100);
    return Math.round(tenureScore);
  }

  private calculateRiskLevel(creditScore: number): RiskLevel {
    if (creditScore >= this.params.lowRiskThreshold) return RiskLevel.LOW;
    if (creditScore >= this.params.mediumRiskThreshold) return RiskLevel.MEDIUM;
    if (creditScore >= this.params.highRiskThreshold) return RiskLevel.HIGH;
    return RiskLevel.VERY_HIGH;
  }

  private getBaseLimitByCustomerType(customerType: CustomerType): number {
    switch (customerType) {
      case CustomerType.BUSINESS:
        return this.params.corporateMaxCredit;
      case CustomerType.VIP:
        return this.params.vipMaxCredit;
      case CustomerType.INDIVIDUAL:
      default:
        return this.params.individualMaxCredit;
    }
  }

  private calculateScoreMultiplier(creditScore: number): number {
    // Multiplicador baseado no score (0.6x a 1.8x) - mais generoso
    return 0.6 + (creditScore / 100) * 1.2;
  }

  private calculateHistoryMultiplier(client: Client): number {
    let multiplier = 1.0;
    
    // Bônus por histórico longo (reduzido)
    const monthsAsClient = this.getMonthsSince(client.created_at);
    if (monthsAsClient > 0) {
      if (monthsAsClient >= 24) multiplier += 0.15;
      else if (monthsAsClient >= 12) multiplier += 0.10;
      else if (monthsAsClient >= 6) multiplier += 0.05;
    }
    
    // Bônus por volume de compras (reduzido)
    if (client.total_purchases >= 100) multiplier += 0.10;
    else if (client.total_purchases >= 50) multiplier += 0.05;
    
    return Math.min(multiplier, 1.3); // Limita o multiplicador máximo
  }

  private calculateRiskMultiplier(creditScore: number): number {
    const riskLevel = this.calculateRiskLevel(creditScore);
    
    switch (riskLevel) {
      case RiskLevel.LOW: return 1.0;
      case RiskLevel.MEDIUM: return 0.8;
      case RiskLevel.HIGH: return 0.6;
      case RiskLevel.VERY_HIGH: return 0.4;
      default: return 0.5;
    }
  }

  private generateRecommendations(client: Client, validationResult: ValidationCheckResult): string[] {
    const recommendations: string[] = [];
    
    if (client.total_purchases < 10) {
      recommendations.push('Realize mais compras para melhorar seu histórico');
    }
    
    if (client.total_purchases < this.params.minSuccessfulPayments) {
      recommendations.push('Mantenha seus pagamentos em dia para aumentar seu score');
    }
    
    const monthsAsClient = this.getMonthsSince(client.created_at);
    if (monthsAsClient < 6) {
      recommendations.push('Continue como cliente por mais tempo para aumentar seu limite');
    }
    
    // Sempre adiciona pelo menos uma recomendação
    if (recommendations.length === 0) {
      recommendations.push('Continue mantendo um bom histórico de compras');
    }
    
    return recommendations;
  }

  private getMonthsSince(date: Date | null): number {
    if (!date) return 999; // Valor alto para clientes sem data
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const months = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30));
    return months < 0 ? -1 : months; // Retorna -1 para datas futuras
  }

  private validateParams(params: CreditValidationParams): void {
    const totalWeight = params.purchaseHistoryWeight + params.paymentHistoryWeight + 
                       params.loyaltyWeight + params.tenureWeight;

    if (Math.abs(totalWeight - 1.0) > 0.01) {
      throw new Error('A soma dos pesos deve ser igual a 1.0');
    }
  }
}

type ValidationCheckResult = {
  passed: boolean;
  reason?: string;
};

export class CreditValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CreditValidationError';
  }
}