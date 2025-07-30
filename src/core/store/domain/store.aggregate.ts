import { AggregateRoot } from '../../shared/domain/aggregate-root';
import { Uuid } from '../../shared/domain/value-objects/uuid.vo';
import { StoreValidatorFactory } from './store.validator';
import { StoreFakeBuilder } from './store-fake.builder';

export class StoreId extends Uuid {}

export enum StoreStatus {
  PENDING_ACTIVATION = 'PENDING_ACTIVATION', // Aguardando ativação
  ACTIVE = 'ACTIVE', // Ativo
  SUSPENDED = 'SUSPENDED', // Suspenso
  CANCELLED = 'CANCELLED' // Cancelado
}

export type StoreSettings = {
  // Configurações de funcionamento
  business_hours: {
    monday: { open: string; close: string; closed: boolean };
    tuesday: { open: string; close: string; closed: boolean };
    wednesday: { open: string; close: string; closed: boolean };
    thursday: { open: string; close: string; closed: boolean };
    friday: { open: string; close: string; closed: boolean };
    saturday: { open: string; close: string; closed: boolean };
    sunday: { open: string; close: string; closed: boolean };
  };
  
  // Configurações de vendas
  sales_config: {
    allow_negative_stock: boolean;
    auto_approve_sales: boolean;
    max_discount_percentage: number;
    require_customer_identification: boolean;
  };
  
  // Configurações de estoque
  inventory_config: {
    low_stock_threshold: number;
    auto_reorder: boolean;
    track_expiry_dates: boolean;
  };
  
  // Configurações fiscais
  fiscal_config: {
    tax_regime: 'SIMPLES' | 'LUCRO_PRESUMIDO' | 'LUCRO_REAL';
    issue_nfe: boolean;
    municipal_inscription: string | null;
    state_inscription: string | null;
  };
  
  // Configurações de notificação
  notification_config: {
    email_notifications: boolean;
    sms_notifications: boolean;
    low_stock_alerts: boolean;
    sales_reports: boolean;
  };
};

export type StoreSubscription = {
  plan_type: 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
  start_date: Date;
  end_date: Date;
  is_trial: boolean;
  trial_end_date: Date | null;
  payment_status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  features: {
    max_products: number;
    max_employees: number;
    max_sales_per_month: number;
    advanced_reports: boolean;
    multi_location: boolean;
    api_access: boolean;
  };
  billing_info: {
    amount: number;
    currency: string;
    billing_cycle: 'MONTHLY' | 'YEARLY';
    next_billing_date: Date;
  };
};

export type StoreConstructorProps = {
  store_id?: StoreId;
  name: string;
  cnpj: string;
  status?: StoreStatus;
  settings?: StoreSettings;
  subscription?: StoreSubscription;
  created_at?: Date;
  updated_at?: Date;
};

// Corrigir o StoreCreateCommand para seguir o padrão
export type StoreCreateCommand = {
  name: string;
  cnpj: string;
  // Configurações opcionais (campos diretos para facilitar uso)
  business_hours?: {
    monday?: { open: string; close: string; closed: boolean };
    tuesday?: { open: string; close: string; closed: boolean };
    wednesday?: { open: string; close: string; closed: boolean };
    thursday?: { open: string; close: string; closed: boolean };
    friday?: { open: string; close: string; closed: boolean };
    saturday?: { open: string; close: string; closed: boolean };
    sunday?: { open: string; close: string; closed: boolean };
  };
  plan_type?: 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
  is_trial?: boolean;
  sales_config?: {
    allow_negative_stock?: boolean;
    auto_approve_sales?: boolean;
    max_discount_percentage?: number;
    require_customer_identification?: boolean;
  };
  inventory_config?: {
    low_stock_threshold?: number;
    auto_reorder?: boolean;
    track_expiry_dates?: boolean;
  };
  settings?: Partial<StoreSettings>;
  subscription?: Partial<StoreSubscription>;
};

export class Store extends AggregateRoot {
  store_id: StoreId;
  name: string;
  cnpj: string;
  status: StoreStatus;
  settings: StoreSettings;
  subscription: StoreSubscription;
  created_at: Date;
  updated_at: Date;

  constructor(props: StoreConstructorProps) {
    super();
    this.store_id = props.store_id ?? new StoreId();
    this.name = props.name;
    this.cnpj = props.cnpj;
    this.status = props.status ?? StoreStatus.PENDING_ACTIVATION;
    this.settings = props.settings ?? Store.getDefaultSettings();
    this.subscription = props.subscription ?? Store.getDefaultSubscription();
    this.created_at = props.created_at ?? new Date();
    this.updated_at = props.updated_at ?? new Date();
  }

  static create(props: StoreCreateCommand): Store {
    const defaultSettings = Store.getDefaultSettings();
    const defaultSubscription = Store.getDefaultSubscription();
    
    let settings: StoreSettings = {
      ...defaultSettings,
      ...props.settings
    };
    
    if (props.business_hours) {
      settings = {
        ...settings,
        business_hours: {
          ...defaultSettings.business_hours,
          ...props.business_hours
        }
      };
    }
    
    if (props.sales_config) {
      settings = {
        ...settings,
        sales_config: { ...defaultSettings.sales_config, ...props.sales_config }
      };
    }
    
    // Adicionar processamento do inventory_config
    if (props.inventory_config) {
      settings = {
        ...settings,
        inventory_config: { ...defaultSettings.inventory_config, ...props.inventory_config }
      };
    }
    
    // Mesclar configurações de subscription se fornecidas
    const subscription: StoreSubscription = {
      ...defaultSubscription,
      ...props.subscription,
      ...(props.plan_type && { plan_type: props.plan_type }),
      ...(props.is_trial !== undefined && { is_trial: props.is_trial })
    };
    
    const constructorProps: StoreConstructorProps = {
      name: props.name,
      cnpj: props.cnpj,
      settings,
      subscription
    };
    
    const store = new Store(constructorProps);
    store.validate();
    return store;
  }

  get entity_id(): StoreId {
    return this.store_id;
  }

  // Métodos de status
  activate(): void {
    if (this.status === StoreStatus.CANCELLED) {
      this.notification.addError('Cannot activate a cancelled store', 'status');
      return;
    }
    this.status = StoreStatus.ACTIVE;
    this.updated_at = new Date();
  }

  suspend(): void {
    if (this.status === StoreStatus.CANCELLED) {
      this.notification.addError('Cannot suspend a cancelled store', 'status');
      return;
    }
    this.status = StoreStatus.SUSPENDED;
    this.updated_at = new Date();
  }

  cancel(): void {
    this.status = StoreStatus.CANCELLED;
    this.updated_at = new Date();
  }

  // Métodos de configuração
  updateSettings(newSettings: Partial<StoreSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.updated_at = new Date();
    this.validate(['settings']);
  }

  updateSubscription(newSubscription: Partial<StoreSubscription>): void {
    this.subscription = { ...this.subscription, ...newSubscription };
    this.updated_at = new Date();
    this.validate(['subscription']);
  }

  updateStoreInfo(props: {
    name?: string;
    cnpj?: string;
  }): void {
    if (props.name !== undefined) {
      this.name = props.name;
    }
    if (props.cnpj !== undefined) {
      this.cnpj = props.cnpj;
    }
    this.updated_at = new Date();
    this.validate(['name', 'cnpj']);
  }

  changeName(name: string): void {
    this.name = name;
    this.updated_at = new Date();
    this.validate(['name']);
  }

  // Métodos de verificação
  isActive(): boolean {
    return this.status === StoreStatus.ACTIVE;
  }

  isSuspended(): boolean {
    return this.status === StoreStatus.SUSPENDED;
  }

  isCancelled(): boolean {
    return this.status === StoreStatus.CANCELLED;
  }

  isPendingActivation(): boolean {
    return this.status === StoreStatus.PENDING_ACTIVATION;
  }

  canOperate(): boolean {
    return this.isActive() && this.hasValidSubscription();
  }

  hasValidSubscription(): boolean {
    const now = new Date();
    
    // Se está em trial e ainda não expirou, é válido
    if (this.subscription.is_trial && this.subscription.trial_end_date && this.subscription.trial_end_date > now) {
      return true;
    }
    
    // Para assinaturas pagas, verifica se está paga e não expirou
    return (
      this.subscription.end_date > now &&
      this.subscription.payment_status === 'PAID'
    );
  }

  isTrialActive(): boolean {
    const now = new Date();
    return (
      this.subscription.is_trial &&
      this.subscription.trial_end_date !== null &&
      this.subscription.trial_end_date > now
    );
  }

  canCreateProduct(): boolean {
    return this.canOperate();
  }

  canAddEmployee(): boolean {
    return this.canOperate();
  }

  getMaxProductsAllowed(): number {
    return this.subscription.features.max_products;
  }

  getMaxEmployeesAllowed(): number {
    return this.subscription.features.max_employees;
  }

  private static getDefaultSettings(): StoreSettings {
    return {
      business_hours: {
        monday: { open: '08:00', close: '18:00', closed: false },
        tuesday: { open: '08:00', close: '18:00', closed: false },
        wednesday: { open: '08:00', close: '18:00', closed: false },
        thursday: { open: '08:00', close: '18:00', closed: false },
        friday: { open: '08:00', close: '18:00', closed: false },
        saturday: { open: '08:00', close: '14:00', closed: false },
        sunday: { open: '08:00', close: '12:00', closed: false }
      },
      sales_config: {
        allow_negative_stock: false,
        auto_approve_sales: true,
        max_discount_percentage: 10,
        require_customer_identification: false
      },
      inventory_config: {
        low_stock_threshold: 10,
        auto_reorder: false,
        track_expiry_dates: true
      },
      fiscal_config: {
        tax_regime: 'SIMPLES',
        issue_nfe: false,
        municipal_inscription: null,
        state_inscription: null
      },
      notification_config: {
        email_notifications: true,
        sms_notifications: false,
        low_stock_alerts: true,
        sales_reports: true
      }
    };
  }

  private static getDefaultSubscription(): StoreSubscription {
    const now = new Date();
    const trialEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 dias
    
    return {
      plan_type: 'BASIC',
      start_date: now,
      end_date: trialEnd,
      is_trial: true,
      trial_end_date: trialEnd,
      payment_status: 'PENDING',
      features: {
        max_products: 1000,
        max_employees: 5,
        max_sales_per_month: 1000,
        advanced_reports: false,
        multi_location: false,
        api_access: false
      },
      billing_info: {
        amount: 99.90,
        currency: 'BRL',
        billing_cycle: 'MONTHLY',
        next_billing_date: trialEnd
      }
    };
  }

  validate(fields?: string[]) {
    const validator = StoreValidatorFactory.create();
    return validator.validate(this.notification, this, fields);
  }

  toJSON() {
    return {
      store_id: this.store_id.id,
      name: this.name,
      cnpj: this.cnpj,
      status: this.status,
      settings: this.settings,
      subscription: this.subscription,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  static fake() {
    return StoreFakeBuilder;
  }
}