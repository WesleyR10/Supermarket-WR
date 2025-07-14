import { Chance } from 'chance';
import { Client, ClientId, CustomerType, LoyaltyLevel, ContactMethod, PaymentPreference, DeliveryPreference } from './client.aggregate';

type PropOrFactory<T> = T | ((index: number) => T);

export class ClientFakeBuilder<TBuild = any> {
  // auto generated in entity
  private _client_id: PropOrFactory<ClientId> | undefined = undefined;
  private _user_id: PropOrFactory<string> = (_index) => this.chance.guid();
  private _stores_id: PropOrFactory<string> = (_index) => this.chance.guid();
  
  // Programa de fidelidade
  private _loyalty_points: PropOrFactory<number> = (_index) => this.chance.integer({ min: 0, max: 10000 });
  private _loyalty_level: PropOrFactory<LoyaltyLevel> = (_index) => this.chance.pickone(Object.values(LoyaltyLevel));
  private _loyalty_card_number: PropOrFactory<string | null> = (_index) => 
    this.chance.bool({ likelihood: 70 }) ? this.chance.string({ length: 12, pool: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' }) : null;
  
  // Segmentação de cliente
  private _customer_type: PropOrFactory<CustomerType> = (_index) => this.chance.pickone(Object.values(CustomerType));
  private _avg_monthly_spending: PropOrFactory<number | null> = (_index) => 
    this.chance.bool({ likelihood: 80 }) ? this.chance.floating({ min: 50, max: 2000, fixed: 2 }) : null;
  private _total_purchases: PropOrFactory<number> = (_index) => this.chance.integer({ min: 0, max: 500 });
  
  // Crédito/Fiado
  private _credit_limit: PropOrFactory<number | null> = (_index) => 
    this.chance.bool({ likelihood: 30 }) ? this.chance.floating({ min: 100, max: 5000, fixed: 2 }) : null;
  
  // Preferências
  private _preferred_contact_method: PropOrFactory<ContactMethod> = (_index) => this.chance.pickone(Object.values(ContactMethod));
  private _allows_promotions: PropOrFactory<boolean> = (_index) => this.chance.bool({ likelihood: 70 });
  private _allows_sms: PropOrFactory<boolean> = (_index) => this.chance.bool({ likelihood: 40 });
  private _allows_email: PropOrFactory<boolean> = (_index) => this.chance.bool({ likelihood: 60 });
  private _payment_preference: PropOrFactory<PaymentPreference> = (_index) => this.chance.pickone(Object.values(PaymentPreference));
  private _delivery_preference: PropOrFactory<DeliveryPreference> = (_index) => this.chance.pickone(Object.values(DeliveryPreference));
  
  // Dados comportamentais
  private _last_purchase_date: PropOrFactory<Date | null> = (_index) => 
    this.chance.bool({ likelihood: 80 }) ? new Date(this.chance.date({ min: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) })) : null;
  private _registration_source: PropOrFactory<string | null> = (_index) => 
    this.chance.bool({ likelihood: 70 }) ? this.chance.pickone(['website', 'app', 'store', 'social']) : null;
  private _notes: PropOrFactory<string | null> = (_index) => 
    this.chance.bool({ likelihood: 20 }) ? this.chance.sentence({ words: 5 }) : null;
  
  // Status e controle
  private _is_active: PropOrFactory<boolean> = (_index) => true;
  private _created_at: PropOrFactory<Date> | undefined = undefined;
  private _updated_at: PropOrFactory<Date> | undefined = undefined;
  private _deleted_at: PropOrFactory<Date | null> = (_index) => null;

  private countObjs;
  private chance: Chance.Chance;

  static aClient() {
    return new ClientFakeBuilder<Client>();
  }

  static theClients(countObjs: number) {
    return new ClientFakeBuilder<Client[]>(countObjs);
  }

  private constructor(countObjs: number = 1) {
    this.countObjs = countObjs;
    this.chance = Chance();
  }

  withClientId(valueOrFactory: PropOrFactory<ClientId>) {
    this._client_id = valueOrFactory;
    return this;
  }

  withUserId(valueOrFactory: PropOrFactory<string>) {
    this._user_id = valueOrFactory;
    return this;
  }

  withStoresId(valueOrFactory: PropOrFactory<string>) {
    this._stores_id = valueOrFactory;
    return this;
  }

  withLoyaltyPoints(valueOrFactory: PropOrFactory<number>) {
    this._loyalty_points = valueOrFactory;
    return this;
  }

  withLoyaltyLevel(valueOrFactory: PropOrFactory<LoyaltyLevel>) {
    this._loyalty_level = valueOrFactory;
    return this;
  }

  withLoyaltyCardNumber(valueOrFactory: PropOrFactory<string | null>) {
    this._loyalty_card_number = valueOrFactory;
    return this;
  }

  withCustomerType(valueOrFactory: PropOrFactory<CustomerType>) {
    this._customer_type = valueOrFactory;
    return this;
  }

  withAvgMonthlySpending(valueOrFactory: PropOrFactory<number | null>) {
    this._avg_monthly_spending = valueOrFactory;
    return this;
  }

  withTotalPurchases(valueOrFactory: PropOrFactory<number>) {
    this._total_purchases = valueOrFactory;
    return this;
  }

  withCreditLimit(valueOrFactory: PropOrFactory<number | null>) {
    this._credit_limit = valueOrFactory;
    return this;
  }

  withPreferredContactMethod(valueOrFactory: PropOrFactory<ContactMethod>) {
    this._preferred_contact_method = valueOrFactory;
    return this;
  }

  withAllowsPromotions(valueOrFactory: PropOrFactory<boolean>) {
    this._allows_promotions = valueOrFactory;
    return this;
  }

  withAllowsSms(valueOrFactory: PropOrFactory<boolean>) {
    this._allows_sms = valueOrFactory;
    return this;
  }

  withAllowsEmail(valueOrFactory: PropOrFactory<boolean>) {
    this._allows_email = valueOrFactory;
    return this;
  }

  withPaymentPreference(valueOrFactory: PropOrFactory<PaymentPreference>) {
    this._payment_preference = valueOrFactory;
    return this;
  }

  withDeliveryPreference(valueOrFactory: PropOrFactory<DeliveryPreference>) {
    this._delivery_preference = valueOrFactory;
    return this;
  }

  withLastPurchaseDate(valueOrFactory: PropOrFactory<Date | null>) {
    this._last_purchase_date = valueOrFactory;
    return this;
  }

  withRegistrationSource(valueOrFactory: PropOrFactory<string | null>) {
    this._registration_source = valueOrFactory;
    return this;
  }

  withNotes(valueOrFactory: PropOrFactory<string | null>) {
    this._notes = valueOrFactory;
    return this;
  }

  activate() {
    this._is_active = true;
    return this;
  }

  deactivate() {
    this._is_active = false;
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

  withDeletedAt(valueOrFactory: PropOrFactory<Date | null>) {
    this._deleted_at = valueOrFactory;
    return this;
  }

  // Métodos específicos para supermercado
  withVipClient() {
    this._customer_type = CustomerType.VIP;
    this._loyalty_level = LoyaltyLevel.DIAMOND;
    this._loyalty_points = (_index) => this.chance.integer({ min: 10000, max: 50000 });
    this._avg_monthly_spending = (_index) => this.chance.floating({ min: 1000, max: 5000, fixed: 2 });
    this._credit_limit = (_index) => this.chance.floating({ min: 2000, max: 10000, fixed: 2 });
    this._allows_promotions = true;
    this._allows_sms = true;
    this._allows_email = true;
    return this;
  }

  withBusinessClient() {
    this._customer_type = CustomerType.BUSINESS;
    this._loyalty_level = LoyaltyLevel.GOLD;
    this._avg_monthly_spending = (_index) => this.chance.floating({ min: 500, max: 2000, fixed: 2 });
    this._credit_limit = (_index) => this.chance.floating({ min: 1000, max: 5000, fixed: 2 });
    this._payment_preference = PaymentPreference.BANK_SLIP;
    return this;
  }

  withHighValueClient() {
    this._loyalty_level = this.chance.pickone([LoyaltyLevel.PLATINUM, LoyaltyLevel.DIAMOND]);
    this._avg_monthly_spending = (_index) => this.chance.floating({ min: 800, max: 3000, fixed: 2 });
    this._total_purchases = (_index) => this.chance.integer({ min: 50, max: 200 });
    this._allows_promotions = true;
    return this;
  }

  withNewClient() {
    this._loyalty_points = 0;
    this._loyalty_level = LoyaltyLevel.BRONZE;
    this._total_purchases = 0;
    this._avg_monthly_spending = null;
    this._last_purchase_date = null;
    this._credit_limit = null;
    return this;
  }

  withInactiveClient() {
    this._is_active = false;
    this._deleted_at = (_index) => new Date(this.chance.date({ min: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }));
    return this;
  }

  build(): TBuild {
    const clients = new Array(this.countObjs)
      .fill(undefined)
      .map((_, index) => {
        const client = new Client({
          client_id: !this._client_id
            ? undefined
            : this.callFactory(this._client_id, index),
          user_id: this.callFactory(this._user_id, index),
          stores_id: this.callFactory(this._stores_id, index),
          loyalty_points: this.callFactory(this._loyalty_points, index),
          loyalty_level: this.callFactory(this._loyalty_level, index),
          loyalty_card_number: this.callFactory(this._loyalty_card_number, index),
          customer_type: this.callFactory(this._customer_type, index),
          avg_monthly_spending: this.callFactory(this._avg_monthly_spending, index),
          total_purchases: this.callFactory(this._total_purchases, index),
          credit_limit: this.callFactory(this._credit_limit, index),
          preferred_contact_method: this.callFactory(this._preferred_contact_method, index),
          allows_promotions: this.callFactory(this._allows_promotions, index),
          allows_sms: this.callFactory(this._allows_sms, index),
          allows_email: this.callFactory(this._allows_email, index),
          payment_preference: this.callFactory(this._payment_preference, index),
          delivery_preference: this.callFactory(this._delivery_preference, index),
          last_purchase_date: this.callFactory(this._last_purchase_date, index),
          registration_source: this.callFactory(this._registration_source, index),
          notes: this.callFactory(this._notes, index),
          is_active: this.callFactory(this._is_active, index),
          ...(this._created_at && {
            created_at: this.callFactory(this._created_at, index),
          }),
          ...(this._updated_at && {
            updated_at: this.callFactory(this._updated_at, index),
          }),
          deleted_at: this.callFactory(this._deleted_at, index),
        });
        client.validate();
        return client;
      });
    return (this.countObjs === 1 ? clients[0] : clients) as TBuild;
  }

  get client_id() {
    return this.getValue('client_id');
  }

  get user_id() {
    return this.getValue('user_id');
  }

  get stores_id() {
    return this.getValue('stores_id');
  }

  get loyalty_points() {
    return this.getValue('loyalty_points');
  }

  get loyalty_level() {
    return this.getValue('loyalty_level');
  }

  get loyalty_card_number() {
    return this.getValue('loyalty_card_number');
  }

  get customer_type() {
    return this.getValue('customer_type');
  }

  get avg_monthly_spending() {
    return this.getValue('avg_monthly_spending');
  }

  get total_purchases() {
    return this.getValue('total_purchases');
  }

  get credit_limit() {
    return this.getValue('credit_limit');
  }

  get preferred_contact_method() {
    return this.getValue('preferred_contact_method');
  }

  get allows_promotions() {
    return this.getValue('allows_promotions');
  }

  get allows_sms() {
    return this.getValue('allows_sms');
  }

  get allows_email() {
    return this.getValue('allows_email');
  }

  get payment_preference() {
    return this.getValue('payment_preference');
  }

  get delivery_preference() {
    return this.getValue('delivery_preference');
  }

  get last_purchase_date() {
    return this.getValue('last_purchase_date');
  }

  get registration_source() {
    return this.getValue('registration_source');
  }

  get notes() {
    return this.getValue('notes');
  }

  get is_active() {
    return this.getValue('is_active');
  }

  get created_at() {
    return this.getValue('created_at');
  }

  get updated_at() {
    return this.getValue('updated_at');
  }

  get deleted_at() {
    return this.getValue('deleted_at');
  }

  private getValue(prop: any) {
    const optional = ['client_id', 'created_at', 'updated_at'];
    const privateProp = `_${prop}` as keyof this;
    if (!this[privateProp] && optional.includes(prop)) {
      throw new Error(
        `Property ${prop} not have a factory, use 'with' methods`,
      );
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
} 