import { AggregateRoot } from '../../shared/domain/aggregate-root';
import { ValueObject } from '../../shared/domain/value-object';
import { Uuid } from '../../shared/domain/value-objects/uuid.vo';
import { SaleFakeBuilder } from './sale-fake.builder';
import { SaleValidatorFactory } from './sale.validator';

export type SaleConstructorProps = {
  sale_id?: SaleId;
  customer_id?: string | null;
  store_id: string;
  cashier_id: string;
  total_amount: number;
  discount_amount?: number;
  tax_amount?: number;
  payment_method: PaymentMethod;
  sale_status: SaleStatus;
  items: SaleItem[];
  // Campos específicos do domínio de supermercado

  register_number: number; // Número do caixa/registradora
  sale_date: Date;
  created_at?: Date;
  updated_at?: Date;
};

export type SaleCreateCommand = {
  customer_id?: string | null;
  cashier_id: string;
  store_id: string;
  register_number: number;
  items: SaleItemCreateCommand[];
  payment_method: PaymentMethod;
  discount_amount?: number;
};

export type SaleItemCreateCommand = {
  product_id: string;
  quantity: number;
  unit_price: number;
  discount_percentage?: number;
};

export class SaleId extends Uuid {}

export enum PaymentMethod {
  CASH = 'cash',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  PIX = 'pix',
  BANK_TRANSFER = 'bank_transfer',
  FOOD_VOUCHER = 'food_voucher',
  MEAL_VOUCHER = 'meal_voucher'
}

export enum SaleStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

export class SaleItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  discount_percentage: number;
  total_price: number;

  constructor(props: {
    product_id: string;
    quantity: number;
    unit_price: number;
    discount_percentage?: number;
  }) {
    this.product_id = props.product_id;
    this.quantity = props.quantity;
    this.unit_price = props.unit_price;
    this.discount_percentage = props.discount_percentage ?? 0;
    this.total_price = this.calculateTotalPrice();
  }

  private calculateTotalPrice(): number {
    const subtotal = this.quantity * this.unit_price;
    const discount = subtotal * (this.discount_percentage / 100);
    return subtotal - discount;
  }

  updateQuantity(quantity: number): void {
    this.quantity = quantity;
    this.total_price = this.calculateTotalPrice();
  }

  updateUnitPrice(unitPrice: number): void {
    this.unit_price = unitPrice;
    this.total_price = this.calculateTotalPrice();
  }

  updateDiscountPercentage(discountPercentage: number): void {
    this.discount_percentage = discountPercentage;
    this.total_price = this.calculateTotalPrice();
  }

  toJSON() {
    return {
      product_id: this.product_id,
      quantity: this.quantity,
      unit_price: this.unit_price,
      discount_percentage: this.discount_percentage,
      total_price: this.total_price,
    };
  }
}

export class Sale extends AggregateRoot {
  sale_id: SaleId;
  customer_id: string | null;
  cashier_id: string;
  total_amount: number;
  discount_amount: number;
  tax_amount: number;
  payment_method: PaymentMethod;
  sale_status: SaleStatus;
  items: SaleItem[];
  // Campos específicos do domínio de supermercado
  store_id: string;
  register_number: number;
  sale_date: Date;
  created_at: Date;
  updated_at: Date;

  constructor(props: SaleConstructorProps) {
    super();
    this.sale_id = props.sale_id ?? new SaleId();
    this.customer_id = props.customer_id ?? null;
    this.cashier_id = props.cashier_id;
    this.total_amount = props.total_amount;
    this.discount_amount = props.discount_amount ?? 0;
    this.tax_amount = props.tax_amount ?? 0;
    this.payment_method = props.payment_method;
    this.sale_status = props.sale_status;
    this.items = props.items;
    this.store_id = props.store_id;
    this.register_number = props.register_number;
    this.sale_date = props.sale_date;
    this.created_at = props.created_at ?? new Date();
    this.updated_at = props.updated_at ?? new Date();
  }

  get entity_id(): ValueObject {
    return this.sale_id;
  }

  static create(props: SaleCreateCommand): Sale {
    const items = props.items.map(item => new SaleItem(item));
    const totalAmount = items.reduce((sum, item) => sum + item.total_price, 0);
    const discountAmount = props.discount_amount ?? 0;
    const taxAmount = this.calculateTaxAmount(totalAmount - discountAmount);

    const sale = new Sale({
      customer_id: props.customer_id,
      cashier_id: props.cashier_id,
      store_id: props.store_id,
      register_number: props.register_number,
      total_amount: totalAmount,
      discount_amount: discountAmount,
      tax_amount: taxAmount,
      payment_method: props.payment_method,
      sale_status: SaleStatus.PENDING,
      items,
      sale_date: new Date(),
    });

    sale.validate(['total_amount', 'payment_method', 'items']);
    return sale;
  }

  // REGRAS DE NEGÓCIO ESPECÍFICAS DO SUPERMERCADO

  addItem(item: SaleItemCreateCommand): void {
    const saleItem = new SaleItem(item);
    this.items.push(saleItem);
    this.recalculateTotals();
    this.updated_at = new Date();
    this.validate(['items', 'total_amount']);
  }

  removeItem(productId: string): void {
    this.items = this.items.filter(item => item.product_id !== productId);
    this.recalculateTotals();
    this.updated_at = new Date();
    this.validate(['items', 'total_amount']);
  }

  updateItemQuantity(productId: string, quantity: number): void {
    const item = this.items.find(item => item.product_id === productId);
    if (item) {
      item.updateQuantity(quantity);
      this.recalculateTotals();
      this.updated_at = new Date();
      this.validate(['items', 'total_amount']);
    }
  }

  applyDiscount(discountAmount: number): void {
    this.discount_amount = discountAmount;
    this.recalculateTotals();
    this.updated_at = new Date();
    this.validate(['discount_amount']);
  }

  setPaymentMethod(paymentMethod: PaymentMethod): void {
    this.payment_method = paymentMethod;
    this.updated_at = new Date();
    this.validate(['payment_method']);
  }

  completeSale(): void {
    if (this.sale_status !== SaleStatus.PENDING) {
      throw new Error('Sale can only be completed from pending status');
    }
    this.sale_status = SaleStatus.COMPLETED;
    this.updated_at = new Date();
  }

  cancelSale(): void {
    if (this.sale_status !== SaleStatus.PENDING) {
      throw new Error('Sale can only be cancelled from pending status');
    }
    this.sale_status = SaleStatus.CANCELLED;
    this.updated_at = new Date();
  }

  refundSale(): void {
    if (this.sale_status !== SaleStatus.COMPLETED) {
      throw new Error('Sale can only be refunded from completed status');
    }
    this.sale_status = SaleStatus.REFUNDED;
    this.updated_at = new Date();
  }

  // Regra de negócio: Calcula imposto baseado no total (ICMS brasileiro)
  private static calculateTaxAmount(subtotal: number): number {
    // Taxa padrão de ICMS para supermercados (varia por estado)
    const ICMS_RATE = 18.5; // 18.5%
    return subtotal * (ICMS_RATE / 100);
  }

  private recalculateTotals(): void {
    const subtotal = this.items.reduce((sum, item) => sum + item.total_price, 0);
    this.total_amount = subtotal;
    this.tax_amount = Sale.calculateTaxAmount(subtotal - this.discount_amount);
  }

  // Regra de negócio: Verifica se venda é elegível para desconto
  isEligibleForDiscount(): boolean {
    return this.total_amount >= 50; // Desconto mínimo para compras acima de R$ 50
  }

  // Regra de negócio: Verifica se venda pode ser cancelada
  canBeCancelled(): boolean {
    return this.sale_status === SaleStatus.PENDING;
  }

  // Regra de negócio: Verifica se venda pode ser reembolsada
  canBeRefunded(): boolean {
    return this.sale_status === SaleStatus.COMPLETED;
  }

  // Regra de negócio: Calcula total final com impostos
  getFinalTotal(): number {
    return this.total_amount - this.discount_amount + this.tax_amount;
  }

  // Regra de negócio: Verifica se método de pagamento aceita desconto
  paymentMethodAcceptsDiscount(): boolean {
    const discountableMethods = [
      PaymentMethod.CASH,
      PaymentMethod.CREDIT_CARD,
      PaymentMethod.DEBIT_CARD,
      PaymentMethod.PIX
    ];
    return discountableMethods.includes(this.payment_method);
  }

  validate(fields?: string[]) {
    const validator = SaleValidatorFactory.create();
    return validator.validate(this.notification, this, fields);
  }

  static fake() {
    return SaleFakeBuilder;
  }

  toJSON() {
    return {
      sale_id: this.sale_id.id,
      customer_id: this.customer_id,
      store_id: this.store_id,
      cashier_id: this.cashier_id,
      total_amount: this.total_amount,
      discount_amount: this.discount_amount,
      tax_amount: this.tax_amount,
      payment_method: this.payment_method,
      sale_status: this.sale_status,
      items: this.items.map(item => item.toJSON()),
      register_number: this.register_number,
      sale_date: this.sale_date,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
} 