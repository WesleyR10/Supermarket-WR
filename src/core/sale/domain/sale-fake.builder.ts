import { Chance } from 'chance';
import { Sale, SaleId, PaymentMethod, SaleStatus, SaleItem } from './sale.aggregate';

type PropOrFactory<T> = T | ((index: number) => T);

export class SaleFakeBuilder<TBuild = any> {
  // auto generated in entity
  private _sale_id: PropOrFactory<SaleId> | undefined = undefined;
  private _customer_id: PropOrFactory<string | null> = (_index) => this.chance.guid();
  private _cashier_id: PropOrFactory<string> = (_index) => this.chance.guid();
  private _total_amount: PropOrFactory<number> = (_index) => this.chance.floating({ min: 10, max: 1000, fixed: 2 });
  private _discount_amount: PropOrFactory<number> = (_index) => this.chance.floating({ min: 0, max: 50, fixed: 2 });
  private _tax_amount: PropOrFactory<number> = (_index) => this.chance.floating({ min: 0, max: 100, fixed: 2 });
  private _payment_method: PropOrFactory<PaymentMethod> = (_index) => this.getRandomPaymentMethod();
  private _sale_status: PropOrFactory<SaleStatus> = (_index) => SaleStatus.COMPLETED;
  private _items: PropOrFactory<SaleItem[]> = (_index) => this.generateSaleItems();
  private _store_id: PropOrFactory<string> = (_index) => this.chance.guid();
  private _register_number: PropOrFactory<number> = (_index) => this.chance.integer({ min: 1, max: 20 });
  private _sale_date: PropOrFactory<Date> = (_index) => new Date(this.chance.date({ year: 2024 }));
  // auto generated in entity
  private _created_at: PropOrFactory<Date> | undefined = undefined;

  private countObjs;

  static aSale() {
    return new SaleFakeBuilder<Sale>();
  }

  static theSales(countObjs: number) {
    return new SaleFakeBuilder<Sale[]>(countObjs);
  }

  private chance: Chance.Chance;

  private constructor(countObjs: number = 1) {
    this.countObjs = countObjs;
    this.chance = Chance();
  }

  withSaleId(valueOrFactory: PropOrFactory<SaleId>) {
    this._sale_id = valueOrFactory;
    return this;
  }

  withCustomerId(valueOrFactory: PropOrFactory<string | null>) {
    this._customer_id = valueOrFactory;
    return this;
  }

  withCashierId(valueOrFactory: PropOrFactory<string>) {
    this._cashier_id = valueOrFactory;
    return this;
  }

  withTotalAmount(valueOrFactory: PropOrFactory<number>) {
    this._total_amount = valueOrFactory;
    return this;
  }

  withDiscountAmount(valueOrFactory: PropOrFactory<number>) {
    this._discount_amount = valueOrFactory;
    return this;
  }

  withTaxAmount(valueOrFactory: PropOrFactory<number>) {
    this._tax_amount = valueOrFactory;
    return this;
  }

  withPaymentMethod(valueOrFactory: PropOrFactory<PaymentMethod>) {
    this._payment_method = valueOrFactory;
    return this;
  }

  withSaleStatus(valueOrFactory: PropOrFactory<SaleStatus>) {
    this._sale_status = valueOrFactory;
    return this;
  }

  withItems(valueOrFactory: PropOrFactory<SaleItem[]>) {
    this._items = valueOrFactory;
    return this;
  }

  withStoreId(valueOrFactory: PropOrFactory<string>) {
    this._store_id = valueOrFactory;
    return this;
  }

  withRegisterNumber(valueOrFactory: PropOrFactory<number>) {
    this._register_number = valueOrFactory;
    return this;
  }

  withSaleDate(valueOrFactory: PropOrFactory<Date>) {
    this._sale_date = valueOrFactory;
    return this;
  }

  withCreatedAt(valueOrFactory: PropOrFactory<Date>) {
    this._created_at = valueOrFactory;
    return this;
  }

  // Métodos específicos para supermercado
  withSupermarketSale() {
    this._payment_method = PaymentMethod.CREDIT_CARD;
    this._total_amount = this.chance.floating({ min: 50, max: 500, fixed: 2 });
    this._items = this.generateSupermarketItems();
    return this;
  }

  withCashSale() {
    this._payment_method = PaymentMethod.CASH;
    this._total_amount = this.chance.floating({ min: 10, max: 200, fixed: 2 });
    return this;
  }

  withPixSale() {
    this._payment_method = PaymentMethod.PIX;
    this._total_amount = this.chance.floating({ min: 20, max: 300, fixed: 2 });
    return this;
  }

  withVoucherSale() {
    this._payment_method = this.chance.pickone([PaymentMethod.FOOD_VOUCHER, PaymentMethod.MEAL_VOUCHER]);
    this._total_amount = this.chance.floating({ min: 30, max: 150, fixed: 2 });
    return this;
  }

  withPendingStatus() {
    this._sale_status = SaleStatus.PENDING;
    return this;
  }

  withCancelledStatus() {
    this._sale_status = SaleStatus.CANCELLED;
    return this;
  }

  withRefundedStatus() {
    this._sale_status = SaleStatus.REFUNDED;
    return this;
  }

  build(): TBuild {
    const sales = new Array(this.countObjs)
      .fill(undefined)
      .map((_, index) => {
        const sale = new Sale({
          sale_id: !this._sale_id
            ? undefined
            : this.callFactory(this._sale_id, index),
          customer_id: this.callFactory(this._customer_id, index),
          cashier_id: this.callFactory(this._cashier_id, index),
          total_amount: this.callFactory(this._total_amount, index),
          discount_amount: this.callFactory(this._discount_amount, index),
          tax_amount: this.callFactory(this._tax_amount, index),
          payment_method: this.callFactory(this._payment_method, index),
          sale_status: this.callFactory(this._sale_status, index),
          items: this.callFactory(this._items, index),
          store_id: this.callFactory(this._store_id, index),
          register_number: this.callFactory(this._register_number, index),
          sale_date: this.callFactory(this._sale_date, index),
          ...(this._created_at && {
            created_at: this.callFactory(this._created_at, index),
          }),
        });
        sale.validate();
        return sale;
      });
    return this.countObjs === 1 ? (sales[0] as any) : (sales as any);
  }

  get sale_id() {
    return this.getValue('sale_id');
  }

  get customer_id() {
    return this.getValue('customer_id');
  }

  get cashier_id() {
    return this.getValue('cashier_id');
  }

  get total_amount() {
    return this.getValue('total_amount');
  }

  get discount_amount() {
    return this.getValue('discount_amount');
  }

  get tax_amount() {
    return this.getValue('tax_amount');
  }

  get payment_method() {
    return this.getValue('payment_method');
  }

  get sale_status() {
    return this.getValue('sale_status');
  }

  get items() {
    return this.getValue('items');
  }

  get store_id() {
    return this.getValue('store_id');
  }

  get register_number() {
    return this.getValue('register_number');
  }

  get sale_date() {
    return this.getValue('sale_date');
  }

  get created_at() {
    return this.getValue('created_at');
  }

  private getValue(prop: any) {
    const optional = ['sale_id', 'created_at'];
    const privateProp = `_${prop}` as keyof this;
    if (!this[privateProp] && optional.includes(prop)) {
      throw new Error(
        `Property ${prop} not have a factory, use 'with' methods`,
      );
    }
    return this.callFactory(this[privateProp], 0);
  }

  private callFactory(factoryOrValue: PropOrFactory<any>, index: number) {
    return typeof factoryOrValue === 'function'
      ? factoryOrValue(index)
      : factoryOrValue;
  }

  // Dados específicos do domínio de supermercado
  private getRandomPaymentMethod(): PaymentMethod {
    const methods = Object.values(PaymentMethod);
    return this.chance.pickone(methods);
  }

  private generateSaleItems(): SaleItem[] {
    const itemCount = this.chance.integer({ min: 1, max: 5 });
    const items: SaleItem[] = [];

    for (let i = 0; i < itemCount; i++) {
      const item = new SaleItem({
        product_id: this.chance.guid(),
        quantity: this.chance.integer({ min: 1, max: 10 }),
        unit_price: this.chance.floating({ min: 2, max: 50, fixed: 2 }),
        discount_percentage: this.chance.floating({ min: 0, max: 20, fixed: 2 }),
      });
      items.push(item);
    }

    return items;
  }

  private generateSupermarketItems(): SaleItem[] {
    const supermarketProducts = [
      { name: 'Arroz Integral', price: 8.50 },
      { name: 'Feijão Preto', price: 6.80 },
      { name: 'Leite Integral', price: 4.20 },
      { name: 'Pão de Forma', price: 7.90 },
      { name: 'Banana Prata', price: 5.60 },
      { name: 'Detergente Líquido', price: 3.40 },
      { name: 'Sabonete', price: 2.80 },
      { name: 'Refrigerante Cola', price: 6.50 },
      { name: 'Queijo Mussarela', price: 12.80 },
      { name: 'Frango Congelado', price: 15.90 },
    ];

    const itemCount = this.chance.integer({ min: 2, max: 6 });
    const items: SaleItem[] = [];

    for (let i = 0; i < itemCount; i++) {
      const product = this.chance.pickone(supermarketProducts);
      const item = new SaleItem({
        product_id: this.chance.guid(),
        quantity: this.chance.integer({ min: 1, max: 5 }),
        unit_price: product.price,
        discount_percentage: this.chance.floating({ min: 0, max: 15, fixed: 2 }),
      });
      items.push(item);
    }

    return items;
  }
}