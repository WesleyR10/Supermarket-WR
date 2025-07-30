import { Chance } from 'chance';
import { Store, StoreId, StoreStatus, StoreSettings, StoreSubscription } from './store.aggregate';

type PropOrFactory<T> = T | ((index: number) => T);

export class StoreFakeBuilder<TBuild = any> {
  private _store_id: PropOrFactory<StoreId> | undefined = undefined;
  private _name: PropOrFactory<string> = (_index) => this.chance.company();
  private _cnpj: PropOrFactory<string> = (_index) => this.generateCNPJ();
  private _status: PropOrFactory<StoreStatus> = (_index) => StoreStatus.ACTIVE;
  private _settings: PropOrFactory<StoreSettings> = (_index) => this.generateDefaultSettings();
  private _subscription: PropOrFactory<StoreSubscription> = (_index) => this.generateDefaultSubscription();
  private _created_at: PropOrFactory<Date> = (_index) => new Date();
  private _updated_at: PropOrFactory<Date> = (_index) => new Date();

  private countObjs;
  private chance: Chance.Chance;

  static aStore() {
    return new StoreFakeBuilder<Store>();
  }

  static theStores(countObjs: number) {
    return new StoreFakeBuilder<Store[]>(countObjs);
  }

  private constructor(countObjs: number = 1) {
    this.countObjs = countObjs;
    this.chance = Chance();
  }

  withStoreId(valueOrFactory: PropOrFactory<StoreId>) {
    this._store_id = valueOrFactory;
    return this;
  }

  withName(valueOrFactory: PropOrFactory<string>) {
    this._name = valueOrFactory;
    return this;
  }

  withCNPJ(valueOrFactory: PropOrFactory<string>) {
    this._cnpj = valueOrFactory;
    return this;
  }

  withStatus(valueOrFactory: PropOrFactory<StoreStatus>) {
    this._status = valueOrFactory;
    return this;
  }

  withSettings(valueOrFactory: PropOrFactory<StoreSettings>) {
    this._settings = valueOrFactory;
    return this;
  }

  withSubscription(valueOrFactory: PropOrFactory<StoreSubscription>) {
    this._subscription = valueOrFactory;
    return this;
  }

  withCreatedAt(valueOrFactory: PropOrFactory<Date>) {
    this._created_at = valueOrFactory;
    return this;
  }

  withUpdatedAt(valueOrFactory: PropOrFactory<Date>) {
    this._updated_at = valueOrFactory;
    return this;
  }

  // Métodos para cenários específicos
  withActiveStatus() {
    this._status = StoreStatus.ACTIVE;
    return this;
  }

  withSuspendedStatus() {
    this._status = StoreStatus.SUSPENDED;
    return this;
  }

  withCancelledStatus() {
    this._status = StoreStatus.CANCELLED;
    return this;
  }

  withPendingActivationStatus() {
    this._status = StoreStatus.PENDING_ACTIVATION;
    return this;
  }

  withTrialSubscription() {
    this._subscription = (_index) => ({
      ...this.generateDefaultSubscription(),
      is_trial: true,
      trial_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      payment_status: 'PENDING'
    });
    return this;
  }

  withExpiredSubscription() {
    this._subscription = (_index) => ({
      ...this.generateDefaultSubscription(),
      end_date: new Date(Date.now() - 24 * 60 * 60 * 1000),
      payment_status: 'OVERDUE'
    });
    return this;
  }

  withPremiumSubscription() {
    this._subscription = (_index) => ({
      ...this.generateDefaultSubscription(),
      plan_type: 'PREMIUM',
      features: {
        max_products: 5000,
        max_employees: 20,
        max_sales_per_month: 10000,
        advanced_reports: true,
        multi_location: true,
        api_access: false
      },
      billing_info: {
        amount: 199.90,
        currency: 'BRL',
        billing_cycle: 'MONTHLY',
        next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });
    return this;
  }

  withInvalidCNPJ() {
    this._cnpj = '00.000.000/0000-00';
    return this;
  }

  withInvalidName() {
    this._name = '';
    return this;
  }

  build(): TBuild {
    const stores = new Array(this.countObjs).fill(undefined).map((_, index) => {
      return new Store({
        store_id: this.callFactory(this._store_id, index),
        name: this.callFactory(this._name, index),
        cnpj: this.callFactory(this._cnpj, index),
        status: this.callFactory(this._status, index),
        settings: this.callFactory(this._settings, index),
        subscription: this.callFactory(this._subscription, index),
        created_at: this.callFactory(this._created_at, index),
        updated_at: this.callFactory(this._updated_at, index)
      });
    });
    return this.countObjs === 1 ? (stores[0] as any) : (stores as any);
  }

  // Getters para acesso aos valores
  get store_id() {
    return this.getValue('store_id');
  }

  get name() {
    return this.getValue('name');
  }

  get cnpj() {
    return this.getValue('cnpj');
  }

  get status() {
    return this.getValue('status');
  }

  get settings() {
    return this.getValue('settings');
  }

  get subscription() {
    return this.getValue('subscription');
  }

  get created_at() {
    return this.getValue('created_at');
  }

  get updated_at() {
    return this.getValue('updated_at');
  }

  private getValue(prop: any) {
    const optional = ['store_id'];
    const privateProp = `_${prop}` as keyof this;
    if (!optional.includes(prop) && !this[privateProp]) {
      throw new Error(`Property ${prop} not have a factory, use 'with' methods`);
    }
    return this.callFactory(this[privateProp], 0);
  }

  private callFactory(factoryOrValue: PropOrFactory<any>, index: number) {
    if (typeof factoryOrValue === 'function') {
      return factoryOrValue(index);
    }
    if (factoryOrValue !== undefined) {
      return factoryOrValue;
    }
    return undefined;
  }

  private generateCNPJ(): string {
    // Gera um CNPJ válido aleatório
    const randomNumbers = () => Math.floor(Math.random() * 9);
    let cnpj = '';
    
    // Gera os primeiros 12 dígitos
    for (let i = 0; i < 12; i++) {
      cnpj += randomNumbers();
    }
    
    // Calcula os dígitos verificadores
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cnpj[i]) * weights1[i];
    }
    
    let remainder = sum % 11;
    const digit1 = remainder < 2 ? 0 : 11 - remainder;
    cnpj += digit1;
    
    sum = 0;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cnpj[i]) * weights2[i];
    }
    
    remainder = sum % 11;
    const digit2 = remainder < 2 ? 0 : 11 - remainder;
    cnpj += digit2;
    
    // Formata o CNPJ
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }

  private generateDefaultSettings(): StoreSettings {
    return {
      business_hours: {
        monday: { open: '08:00', close: '18:00', closed: false },
        tuesday: { open: '08:00', close: '18:00', closed: false },
        wednesday: { open: '08:00', close: '18:00', closed: false },
        thursday: { open: '08:00', close: '18:00', closed: false },
        friday: { open: '08:00', close: '18:00', closed: false },
        saturday: { open: '08:00', close: '12:00', closed: false },
        sunday: { open: '08:00', close: '12:00', closed: true }
      },
      sales_config: {
        allow_negative_stock: this.chance.bool({ likelihood: 20 }),
        auto_approve_sales: this.chance.bool({ likelihood: 80 }),
        max_discount_percentage: this.chance.integer({ min: 5, max: 20 }),
        require_customer_identification: this.chance.bool({ likelihood: 30 })
      },
      inventory_config: {
        low_stock_threshold: this.chance.integer({ min: 5, max: 50 }),
        auto_reorder: this.chance.bool({ likelihood: 40 }),
        track_expiry_dates: this.chance.bool({ likelihood: 70 })
      },
      fiscal_config: {
        tax_regime: this.chance.pickone(['SIMPLES', 'LUCRO_PRESUMIDO', 'LUCRO_REAL']),
        issue_nfe: this.chance.bool({ likelihood: 60 }),
        municipal_inscription: this.chance.bool({ likelihood: 50 }) ? this.chance.string({ length: 10, pool: '0123456789' }) : null,
        state_inscription: this.chance.bool({ likelihood: 50 }) ? this.chance.string({ length: 12, pool: '0123456789' }) : null
      },
      notification_config: {
        email_notifications: this.chance.bool({ likelihood: 80 }),
        sms_notifications: this.chance.bool({ likelihood: 30 }),
        low_stock_alerts: this.chance.bool({ likelihood: 90 }),
        sales_reports: this.chance.bool({ likelihood: 70 })
      }
    };
  }

  private generateDefaultSubscription(): StoreSubscription {
    const now = new Date();
    const endDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 ano
    
    return {
      plan_type: this.chance.pickone(['BASIC', 'PREMIUM', 'ENTERPRISE']),
      start_date: now,
      end_date: endDate,
      is_trial: this.chance.bool({ likelihood: 30 }),
      trial_end_date: this.chance.bool({ likelihood: 30 }) ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) : null,
      payment_status: this.chance.pickone(['PENDING', 'PAID', 'OVERDUE', 'CANCELLED']),
      features: {
        max_products: this.chance.integer({ min: 100, max: 10000 }),
        max_employees: this.chance.integer({ min: 1, max: 100 }),
        max_sales_per_month: this.chance.integer({ min: 100, max: 50000 }),
        advanced_reports: this.chance.bool({ likelihood: 50 }),
        multi_location: this.chance.bool({ likelihood: 30 }),
        api_access: this.chance.bool({ likelihood: 40 })
      },
      billing_info: {
        amount: this.chance.floating({ min: 50, max: 500, fixed: 2 }),
        currency: 'BRL',
        billing_cycle: this.chance.pickone(['MONTHLY', 'YEARLY']),
        next_billing_date: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      }
    };
  }
}