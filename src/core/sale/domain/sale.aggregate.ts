import { AggregateRoot } from '../../shared/domain/aggregate-root';
import { ValueObject } from '../../shared/domain/value-object';
import { Uuid } from '../../shared/domain/value-objects/uuid.vo';
import { SaleFakeBuilder } from './sale-fake.builder';
import { SaleValidatorFactory } from './sale.validator';
import { Money } from '../../shared/domain/value-objects/money.vo';

export type SaleConstructorProps = {
  sale_id?: SaleId;
  customer_id?: string | null;
  store_id: string;
  cashier_id: string;
  total_amount: number;
  discount_amount?: number;
  tax_amount?: number;
  tax_rate?: number; 
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
  tax_rate?: number; // ✅ NOVO: Taxa de imposto opcional (padrão 0%)
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
    store_id: string;
  customer_id: string | null;
  cashier_id: string;
  total_amount: number;
  discount_amount: number;
  tax_amount: number;
  tax_rate: number; //  Armazenar a taxa de imposto usada
  payment_method: PaymentMethod;
  sale_status: SaleStatus;
  items: SaleItem[];
  // Campos específicos do domínio de supermercado
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
    this.tax_rate = props.tax_rate?? 0;
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
    const taxRate = props.tax_rate ?? 0; // ✅ Padrão 0%
    const taxAmount = this.calculateTaxAmount(totalAmount - discountAmount, taxRate);

    const sale = new Sale({
      customer_id: props.customer_id,
      cashier_id: props.cashier_id,
      store_id: props.store_id,
      register_number: props.register_number,
      total_amount: totalAmount,
      discount_amount: discountAmount,
      tax_amount: taxAmount,
      tax_rate: taxRate, 
      payment_method: props.payment_method,
      sale_status: SaleStatus.PENDING,
      items,
      sale_date: new Date(),
    });

    sale.validate(['total_amount', 'payment_method', 'items']);
    return sale;
  }

  addItem(item: SaleItemCreateCommand): void {
    const saleItem = new SaleItem(item);
    this.items.push(saleItem);
    this.recalculateTotals();
    this.updated_at = new Date();
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

    setPaymentMethod(paymentMethod: PaymentMethod): void {
    this.payment_method = paymentMethod;
    this.updated_at = new Date();
    this.validate(['payment_method']);
  }

  completeSale(): void {
    if (this.sale_status !== SaleStatus.PENDING) {
      this.notification.addError(
        'Sale can only be completed from pending status',
        'sale_status'
      );
      return;
    }
    this.sale_status = SaleStatus.COMPLETED;
    this.updated_at = new Date();
  }

  canBeCancelled(): boolean {
    return this.sale_status === SaleStatus.PENDING;
  }

  cancelSale(): void {
    if (this.sale_status !== SaleStatus.PENDING) {
      this.notification.addError(
        'Sale can only be cancelled from pending status',
        'sale_status'
      );
      return;
    }
    this.sale_status = SaleStatus.CANCELLED;
    this.updated_at = new Date();
  }
  
  refundSale(): void {
    if (this.sale_status !== SaleStatus.COMPLETED) {
      this.notification.addError(
        'Sale can only be refunded from completed status',
        'sale_status'
      );
      return;
    }
    this.sale_status = SaleStatus.REFUNDED;
    this.updated_at = new Date();
  }

  private static calculateTaxAmount(subtotal: number, taxRate: number = 0): number {
    const taxAmount = subtotal * (taxRate / 100);
    return new Money(taxAmount).value; // ✅ Arredondamento automático
  }

    /**
   * Retorna o subtotal com desconto aplicado (total_amount - discount_amount)
   * Representa o valor dos itens após aplicação do desconto, mas antes dos impostos
   */
  // ✅ Métodos que retornam valores monetários padronizados
  getSubtotalWithDiscount(): number {
    const subtotal = this.total_amount - this.discount_amount;
    return new Money(subtotal).value;
  }

    /**
   * Retorna o valor final da venda (subtotal com desconto + impostos)
   * Representa o valor total que o cliente deve pagar
   */

  getFinalTotal(): number {
    const finalTotal = this.total_amount - this.discount_amount + this.tax_amount;
    return new Money(finalTotal).value;
  }

  // ✅ Aplicar desconto com Money e notification pattern
  applyDiscount(discountAmount: number): void {
    if (discountAmount < 0) {
      this.notification.addError(
        'Discount amount must be positive',
        'discount_amount'
      );
      return;
    }
    if (discountAmount > this.total_amount) {
      this.notification.addError(
        'Discount amount cannot exceed total amount',
        'discount_amount'
      );
      return;
    }
    
    // ✅ Usar Money para garantir precisão
    this.discount_amount = new Money(discountAmount).value;
    this.tax_amount = Sale.calculateTaxAmount(this.total_amount - this.discount_amount, this.tax_rate);
    this.updated_at = new Date();
    this.validate(['discount_amount']);
  }

  // ✅ Recalcular totais com Money
  private recalculateTotals(): void {
    const subtotal = this.items.reduce((sum, item) => sum + item.total_price, 0);
    this.total_amount = new Money(subtotal).value;
    this.tax_amount = Sale.calculateTaxAmount(subtotal - this.discount_amount, this.tax_rate);
  }

  
  static fake() {
    return SaleFakeBuilder;
  }

  validate(fields?: string[]) {
    const validator = SaleValidatorFactory.create();
    return validator.validate(this.notification, this, fields);
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
      tax_rate: this.tax_rate, // ✅ Incluir no JSON
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