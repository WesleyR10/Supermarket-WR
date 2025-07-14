import { AggregateRoot } from '../../shared/domain/aggregate-root';
import { ValueObject } from '../../shared/domain/value-object';
import { Uuid } from '../../shared/domain/value-objects/uuid.vo';
import { ClientValidatorFactory } from './client.validator';
import { ClientFakeBuilder } from './client-fake.builder';

export class ClientId extends Uuid {}

export enum CustomerType {
  INDIVIDUAL = 'INDIVIDUAL', // Pessoa física
  BUSINESS = 'BUSINESS', // Pessoa jurídica
  VIP = 'VIP', // Cliente VIP
  WHOLESALE = 'WHOLESALE', // Atacadista
  EMPLOYEE = 'EMPLOYEE', // Funcionário
}

export enum LoyaltyLevel {
  BRONZE = 'BRONZE', // 0-999 pontos
  SILVER = 'SILVER', // 1000-2999 pontos
  GOLD = 'GOLD', // 3000-4999 pontos
  PLATINUM = 'PLATINUM', // 5000-9999 pontos
  DIAMOND = 'DIAMOND', // 10000+ pontos
}

export enum ContactMethod {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  WHATSAPP = 'WHATSAPP',
  PHONE = 'PHONE',
  NONE = 'NONE',
}

export enum PaymentPreference {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  PIX = 'PIX',
  CASH = 'CASH',
  STORE_CREDIT = 'STORE_CREDIT', // Fiado
  BANK_SLIP = 'BANK_SLIP',
  NONE = 'NONE',
}

export enum DeliveryPreference {
  PICKUP = 'PICKUP', // Retirada
  HOME_DELIVERY = 'HOME_DELIVERY', // Entrega em casa
  WORKPLACE_DELIVERY = 'WORKPLACE_DELIVERY', // Entrega no trabalho
  NONE = 'NONE',
}

export type ClientConstructorProps = {
  client_id?: ClientId;
  user_id: string; // FK para User global
  stores_id: string; // FK para Store específica
  
  // Programa de fidelidade
  loyalty_points?: number;
  loyalty_level?: LoyaltyLevel;
  loyalty_card_number?: string | null;
  
  // Segmentação de cliente
  customer_type?: CustomerType;
  avg_monthly_spending?: number | null;
  total_purchases?: number;
  
  // Crédito/Fiado
  credit_limit?: number | null;
  
  // Preferências
  preferred_contact_method?: ContactMethod;
  allows_promotions?: boolean;
  allows_sms?: boolean;
  allows_email?: boolean;
  payment_preference?: PaymentPreference;
  delivery_preference?: DeliveryPreference;
  
  // Dados comportamentais
  last_purchase_date?: Date | null;
  registration_source?: string | null; // 'website', 'app', 'store', 'social'
  notes?: string | null;
  
  // Status e controle
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
};

export type ClientCreateCommand = {
  user_id: string;
  stores_id: string;
  customer_type?: CustomerType;
  credit_limit?: number | null;
  preferred_contact_method?: ContactMethod;
  allows_promotions?: boolean;
  allows_sms?: boolean;
  allows_email?: boolean;
  payment_preference?: PaymentPreference;
  delivery_preference?: DeliveryPreference;
  registration_source?: string | null;
  notes?: string | null;
};

export class Client extends AggregateRoot {
  client_id: ClientId;
  user_id: string;
  stores_id: string;
  
  // Programa de fidelidade
  loyalty_points: number;
  loyalty_level: LoyaltyLevel;
  loyalty_card_number: string | null;
  
  // Segmentação de cliente
  customer_type: CustomerType;
  avg_monthly_spending: number | null;
  total_purchases: number;
  
  // Crédito/Fiado
  credit_limit: number | null;
  
  // Preferências
  preferred_contact_method: ContactMethod;
  allows_promotions: boolean;
  allows_sms: boolean;
  allows_email: boolean;
  payment_preference: PaymentPreference;
  delivery_preference: DeliveryPreference;
  
  // Dados comportamentais
  last_purchase_date: Date | null;
  registration_source: string | null;
  notes: string | null;
  
  // Status e controle
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;

  constructor(props: ClientConstructorProps) {
    super();
    this.client_id = props.client_id ?? new ClientId();
    this.user_id = props.user_id;
    this.stores_id = props.stores_id;
    
    // Programa de fidelidade
    this.loyalty_points = props.loyalty_points ?? 0;
    this.loyalty_level = props.loyalty_level ?? this.calculateLoyaltyLevel(props.loyalty_points ?? 0);
    this.loyalty_card_number = props.loyalty_card_number ?? null;
    
    // Segmentação
    this.customer_type = props.customer_type ?? CustomerType.INDIVIDUAL;
    this.avg_monthly_spending = props.avg_monthly_spending ?? null;
    this.total_purchases = props.total_purchases ?? 0;
    
    // Crédito
    this.credit_limit = props.credit_limit ?? null;
    
    // Preferências
    this.preferred_contact_method = props.preferred_contact_method ?? ContactMethod.NONE;
    this.allows_promotions = props.allows_promotions ?? true;
    this.allows_sms = props.allows_sms ?? false;
    this.allows_email = props.allows_email ?? false;
    this.payment_preference = props.payment_preference ?? PaymentPreference.NONE;
    this.delivery_preference = props.delivery_preference ?? DeliveryPreference.NONE;
    
    // Dados comportamentais
    this.last_purchase_date = props.last_purchase_date ?? null;
    this.registration_source = props.registration_source ?? null;
    this.notes = props.notes ?? null;
    
    // Status
    this.is_active = props.is_active ?? true;
    this.created_at = props.created_at ?? new Date();
    this.updated_at = props.updated_at ?? new Date();
    this.deleted_at = props.deleted_at ?? null;
  }

  get entity_id(): ValueObject {
    return this.client_id;
  }

  static create(props: ClientCreateCommand): Client {
    const client = new Client(props);
    client.validate();
    return client;
  }

  // =============================================
  // MÉTODOS DE NEGÓCIO - PROGRAMA DE FIDELIDADE
  // =============================================

  addLoyaltyPoints(points: number): void {
    if (points < 0) {
      this.notification.addError('Pontos não podem ser negativos', 'loyalty_points');
      return;
    }
    
    this.loyalty_points += points;
    this.loyalty_level = this.calculateLoyaltyLevel(this.loyalty_points);
    this.updated_at = new Date();
    this.validate(['loyalty_points']);
  }

  redeemLoyaltyPoints(points: number): void {
    if (points < 0) {
      this.notification.addError('Pontos não podem ser negativos', 'loyalty_points');
      return;
    }
    
    if (points > this.loyalty_points) {
      this.notification.addError('Pontos insuficientes', 'loyalty_points');
      return;
    }
    
    this.loyalty_points -= points;
    this.loyalty_level = this.calculateLoyaltyLevel(this.loyalty_points);
    this.updated_at = new Date();
    this.validate(['loyalty_points']);
  }

  setLoyaltyCardNumber(cardNumber: string): void {
    this.loyalty_card_number = cardNumber;
    this.updated_at = new Date();
    this.validate(['loyalty_card_number']);
  }

  private calculateLoyaltyLevel(points: number): LoyaltyLevel {
    if (points >= 10000) return LoyaltyLevel.DIAMOND;
    if (points >= 5000) return LoyaltyLevel.PLATINUM;
    if (points >= 3000) return LoyaltyLevel.GOLD;
    if (points >= 1000) return LoyaltyLevel.SILVER;
    return LoyaltyLevel.BRONZE;
  }

  // =============================================
  // MÉTODOS DE NEGÓCIO - SEGMENTAÇÃO
  // =============================================

  updateCustomerType(type: CustomerType): void {
    this.customer_type = type;
    this.updated_at = new Date();
    this.validate(['customer_type']);
  }

  updatePurchaseStats(purchaseAmount: number): void {
    if (purchaseAmount < 0) {
      this.notification.addError('Valor da compra não pode ser negativo', 'avg_monthly_spending');
      return;
    }

    this.total_purchases += 1;
    this.last_purchase_date = new Date();
    
    // Recalcular média mensal simplificada
    if (this.avg_monthly_spending) {
      this.avg_monthly_spending = (this.avg_monthly_spending + purchaseAmount) / 2;
    } else {
      this.avg_monthly_spending = purchaseAmount;
    }
    
    this.updated_at = new Date();
    this.validate(['avg_monthly_spending']);
  }

  // =============================================
  // MÉTODOS DE NEGÓCIO - CRÉDITO/FIADO
  // =============================================

  setCreditLimit(limit: number | null): void {
    if (limit !== null && limit < 0) {
      this.notification.addError('Limite de crédito não pode ser negativo', 'credit_limit');
      return;
    }
    
    this.credit_limit = limit;
    this.updated_at = new Date();
    this.validate(['credit_limit']);
  }

  canPurchaseOnCredit(amount: number): boolean {
    if (!this.credit_limit) return false;
    if (amount < 0) return false;
    return amount <= this.credit_limit;
  }

  // =============================================
  // MÉTODOS DE NEGÓCIO - PREFERÊNCIAS
  // =============================================

  updateContactPreferences(
    contactMethod: ContactMethod,
    allowsPromotions: boolean,
    allowsSms: boolean,
    allowsEmail: boolean
  ): void {
    this.preferred_contact_method = contactMethod;
    this.allows_promotions = allowsPromotions;
    this.allows_sms = allowsSms;
    this.allows_email = allowsEmail;
    this.updated_at = new Date();
    this.validate(['preferred_contact_method']);
  }

  updatePaymentPreference(preference: PaymentPreference): void {
    this.payment_preference = preference;
    this.updated_at = new Date();
    this.validate(['payment_preference']);
  }

  updateDeliveryPreference(preference: DeliveryPreference): void {
    this.delivery_preference = preference;
    this.updated_at = new Date();
    this.validate(['delivery_preference']);
  }

  // =============================================
  // MÉTODOS DE NEGÓCIO - ANÁLISE E SEGMENTAÇÃO
  // =============================================

  isVipClient(): boolean {
    return this.customer_type === CustomerType.VIP || 
           this.loyalty_level === LoyaltyLevel.DIAMOND ||
           (this.avg_monthly_spending !== null && this.avg_monthly_spending > 1000);
  }

  isHighValueClient(): boolean {
    return (this.avg_monthly_spending !== null && this.avg_monthly_spending > 500) ||
           this.loyalty_level === LoyaltyLevel.PLATINUM ||
           this.loyalty_level === LoyaltyLevel.DIAMOND;
  }

  isAtRiskClient(): boolean {
    if (!this.last_purchase_date) return false;
    
    const daysSinceLastPurchase = Math.floor(
      (new Date().getTime() - this.last_purchase_date.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    return daysSinceLastPurchase > 90; // 3 meses sem comprar
  }

  getCustomerLifetimeValue(): number {
    if (this.avg_monthly_spending === null) return 0;
    
    // Estimativa simples: média mensal * 12 meses * fator de retenção
    const retentionFactor = this.loyalty_level === LoyaltyLevel.DIAMOND ? 5 :
                          this.loyalty_level === LoyaltyLevel.PLATINUM ? 4 :
                          this.loyalty_level === LoyaltyLevel.GOLD ? 3 :
                          this.loyalty_level === LoyaltyLevel.SILVER ? 2 : 1;
    
    return this.avg_monthly_spending * 12 * retentionFactor;
  }

  // =============================================
  // MÉTODOS DE CONTROLE
  // =============================================

  activate(): void {
    this.is_active = true;
    this.updated_at = new Date();
  }

  deactivate(): void {
    this.is_active = false;
    this.updated_at = new Date();
  }

  softDelete(): void {
    this.is_active = false;
    this.deleted_at = new Date();
    this.updated_at = new Date();
  }

  addNote(note: string): void {
    this.notes = this.notes ? `${this.notes}\n${note}` : note;
    this.updated_at = new Date();
  }

  validate(fields?: string[]): boolean {
    const validator = ClientValidatorFactory.create();
    return validator.validate(this.notification, this, fields);
  }

  static fake(): typeof ClientFakeBuilder {
    return ClientFakeBuilder;
  }

  toJSON() {
    return {
      client_id: this.client_id.id,
      user_id: this.user_id,
      stores_id: this.stores_id,
      loyalty_points: this.loyalty_points,
      loyalty_level: this.loyalty_level,
      loyalty_card_number: this.loyalty_card_number,
      customer_type: this.customer_type,
      avg_monthly_spending: this.avg_monthly_spending,
      total_purchases: this.total_purchases,
      credit_limit: this.credit_limit,
      preferred_contact_method: this.preferred_contact_method,
      allows_promotions: this.allows_promotions,
      allows_sms: this.allows_sms,
      allows_email: this.allows_email,
      payment_preference: this.payment_preference,
      delivery_preference: this.delivery_preference,
      last_purchase_date: this.last_purchase_date,
      registration_source: this.registration_source,
      notes: this.notes,
      is_active: this.is_active,
      created_at: this.created_at,
      updated_at: this.updated_at,
      deleted_at: this.deleted_at,
    };
  }
} 