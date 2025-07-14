import { ValueObject } from '../value-object';
import { Money } from './money.vo';

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  BUY_X_GET_Y = 'BUY_X_GET_Y',
  BULK_DISCOUNT = 'BULK_DISCOUNT'
}

export class Discount extends ValueObject {
  readonly type: DiscountType;
  readonly value: number;
  readonly description: string;
  readonly minAmount?: Money;
  readonly maxDiscount?: Money;
  readonly buyQuantity?: number;
  readonly getQuantity?: number;
  readonly bulkThreshold?: number;

  constructor(props: DiscountProps) {
    super();
    this.type = props.type;
    this.value = props.value;
    this.description = props.description;
    this.minAmount = props.minAmount;
    this.maxDiscount = props.maxDiscount;
    this.buyQuantity = props.buyQuantity;
    this.getQuantity = props.getQuantity;
    this.bulkThreshold = props.bulkThreshold;
    this.validate();
  }

  private validate() {
    if (!Object.values(DiscountType).includes(this.type)) {
      throw new InvalidDiscountError('Invalid discount type');
    }

    if (!this.description || this.description.trim().length === 0) {
      throw new InvalidDiscountError('Discount description is required');
    }

    if (this.description.length > 255) {
      throw new InvalidDiscountError('Discount description cannot exceed 255 characters');
    }

    // Validações específicas por tipo
    switch (this.type) {
      case DiscountType.PERCENTAGE:
        this.validatePercentageDiscount();
        break;
      case DiscountType.FIXED_AMOUNT:
        this.validateFixedAmountDiscount();
        break;
      case DiscountType.BUY_X_GET_Y:
        this.validateBuyXGetYDiscount();
        break;
      case DiscountType.BULK_DISCOUNT:
        this.validateBulkDiscount();
        break;
    }

    // Validações gerais
    if (this.minAmount && this.minAmount.value < 0) {
      throw new InvalidDiscountError('Minimum amount cannot be negative');
    }

    if (this.maxDiscount && this.maxDiscount.value < 0) {
      throw new InvalidDiscountError('Maximum discount cannot be negative');
    }
  }

  private validatePercentageDiscount() {
    if (this.value <= 0 || this.value > 100) {
      throw new InvalidDiscountError('Percentage discount must be between 0 and 100');
    }
  }

  private validateFixedAmountDiscount() {
    if (this.value <= 0) {
      throw new InvalidDiscountError('Fixed amount discount must be positive');
    }
  }

  private validateBuyXGetYDiscount() {
    if (!this.buyQuantity || this.buyQuantity <= 0) {
      throw new InvalidDiscountError('Buy quantity must be positive for Buy X Get Y discount');
    }

    if (!this.getQuantity || this.getQuantity <= 0) {
      throw new InvalidDiscountError('Get quantity must be positive for Buy X Get Y discount');
    }

    if (this.getQuantity >= this.buyQuantity) {
      throw new InvalidDiscountError('Get quantity must be less than buy quantity');
    }
  }

  private validateBulkDiscount() {
    if (this.value <= 0 || this.value > 100) {
      throw new InvalidDiscountError('Bulk discount percentage must be between 0 and 100');
    }

    if (!this.bulkThreshold || this.bulkThreshold <= 0) {
      throw new InvalidDiscountError('Bulk threshold must be positive');
    }
  }

  isPercentage(): boolean {
    return this.type === DiscountType.PERCENTAGE;
  }

  isFixedAmount(): boolean {
    return this.type === DiscountType.FIXED_AMOUNT;
  }

  isBuyXGetY(): boolean {
    return this.type === DiscountType.BUY_X_GET_Y;
  }

  isBulkDiscount(): boolean {
    return this.type === DiscountType.BULK_DISCOUNT;
  }

  canApplyTo(amount: Money, quantity?: number): boolean {
    // Verifica valor mínimo
    if (this.minAmount && amount.value < this.minAmount.value) {
      return false;
    }

    // Verifica quantidade para desconto bulk
    if (this.isBulkDiscount() && quantity && quantity < this.bulkThreshold!) {
      return false;
    }

    return true;
  }

  calculateDiscount(amount: Money, quantity: number = 1): Money {
    if (!this.canApplyTo(amount, quantity)) {
      return Money.zero();
    }

    let discountAmount: Money;

    switch (this.type) {
      case DiscountType.PERCENTAGE:
        discountAmount = amount.multiply(this.value / 100);
        break;

      case DiscountType.FIXED_AMOUNT:
        discountAmount = new Money(this.value);
        break;

      case DiscountType.BUY_X_GET_Y:
        discountAmount = this.calculateBuyXGetYDiscount(amount, quantity);
        break;

      case DiscountType.BULK_DISCOUNT:
        discountAmount = amount.multiply(this.value / 100);
        break;

      default:
        discountAmount = Money.zero();
    }

    // Aplica limite máximo se definido
    if (this.maxDiscount && discountAmount.value > this.maxDiscount.value) {
      discountAmount = this.maxDiscount;
    }

    // Garante que o desconto não seja maior que o valor original
    if (discountAmount.value > amount.value) {
      discountAmount = amount;
    }

    return discountAmount;
  }

  private calculateBuyXGetYDiscount(amount: Money, quantity: number): Money {
    const freeItems = Math.floor(quantity / this.buyQuantity!) * this.getQuantity!;
    const unitPrice = amount.divide(quantity);
    return unitPrice.multiply(freeItems);
  }

  applyTo(amount: Money, quantity: number = 1): Money {
    const discountAmount = this.calculateDiscount(amount, quantity);
    return amount.subtract(discountAmount);
  }

  getDiscountPercentage(amount: Money, quantity: number = 1): number {
    if (amount.value === 0) return 0;
    
    const discountAmount = this.calculateDiscount(amount, quantity);
    return (discountAmount.value / amount.value) * 100;
  }

  getSavings(amount: Money, quantity: number = 1): Money {
    return this.calculateDiscount(amount, quantity);
  }

  getDisplayText(): string {
    switch (this.type) {
      case DiscountType.PERCENTAGE:
        return `${this.value}% de desconto`;
      
      case DiscountType.FIXED_AMOUNT:
        return `R$ ${this.value.toFixed(2)} de desconto`;
      
      case DiscountType.BUY_X_GET_Y:
        return `Leve ${this.buyQuantity}, pague ${this.buyQuantity! - this.getQuantity!}`;
      
      case DiscountType.BULK_DISCOUNT:
        return `${this.value}% de desconto (min. ${this.bulkThreshold} unidades)`;
      
      default:
        return this.description;
    }
  }

  getShortDescription(): string {
    switch (this.type) {
      case DiscountType.PERCENTAGE:
        return `${this.value}%`;
      
      case DiscountType.FIXED_AMOUNT:
        return `R$ ${this.value.toFixed(2)}`;
      
      case DiscountType.BUY_X_GET_Y:
        return `${this.buyQuantity}x${this.getQuantity}`;
      
      case DiscountType.BULK_DISCOUNT:
        return `${this.value}% (${this.bulkThreshold}+)`;
      
      default:
        return 'Desconto';
    }
  }

  getConditions(): string[] {
    const conditions: string[] = [];

    if (this.minAmount) {
      conditions.push(`Valor mínimo: R$ ${this.minAmount.value.toFixed(2)}`);
    }

    if (this.maxDiscount) {
      conditions.push(`Desconto máximo: R$ ${this.maxDiscount.value.toFixed(2)}`);
    }

    if (this.isBulkDiscount() && this.bulkThreshold) {
      conditions.push(`Quantidade mínima: ${this.bulkThreshold} unidades`);
    }

    return conditions;
  }

  isValidFor(amount: Money, quantity: number = 1): boolean {
    return this.canApplyTo(amount, quantity);
  }

  toString(): string {
    return this.getDisplayText();
  }

  equals(other: Discount): boolean {
    return this.type === other.type &&
           this.value === other.value &&
           this.description === other.description &&
           this.compareOptionalMoney(this.minAmount, other.minAmount) &&
           this.compareOptionalMoney(this.maxDiscount, other.maxDiscount) &&
           this.buyQuantity === other.buyQuantity &&
           this.getQuantity === other.getQuantity &&
           this.bulkThreshold === other.bulkThreshold;
  }

  private compareOptionalMoney(a?: Money, b?: Money): boolean {
    if (a === undefined && b === undefined) return true;
    if (a === undefined || b === undefined) return false;
    return a.equals(b);
  }

  // Factory methods para criação fácil
  static percentage(value: number, description: string, options?: DiscountOptions): Discount {
    return new Discount({
      type: DiscountType.PERCENTAGE,
      value,
      description,
      ...options
    });
  }

  static fixedAmount(value: number, description: string, options?: DiscountOptions): Discount {
    return new Discount({
      type: DiscountType.FIXED_AMOUNT,
      value,
      description,
      ...options
    });
  }

  static buyXGetY(buyQuantity: number, getQuantity: number, description: string, options?: DiscountOptions): Discount {
    return new Discount({
      type: DiscountType.BUY_X_GET_Y,
      value: 0, // Não usado para este tipo
      description,
      buyQuantity,
      getQuantity,
      ...options
    });
  }

  static bulk(percentage: number, threshold: number, description: string, options?: DiscountOptions): Discount {
    return new Discount({
      type: DiscountType.BULK_DISCOUNT,
      value: percentage,
      description,
      bulkThreshold: threshold,
      ...options
    });
  }

  // Descontos pré-definidos comuns
  static tenPercent(): Discount {
    return Discount.percentage(10, '10% de desconto');
  }

  static fifteenPercent(): Discount {
    return Discount.percentage(15, '15% de desconto');
  }

  static twentyPercent(): Discount {
    return Discount.percentage(20, '20% de desconto');
  }

  static buyTwoGetOne(): Discount {
    return Discount.buyXGetY(3, 1, 'Leve 3, pague 2');
  }

  static buyOneGetOne(): Discount {
    return Discount.buyXGetY(2, 1, 'Leve 2, pague 1');
  }

  static bulkTenPercent(): Discount {
    return Discount.bulk(10, 10, '10% de desconto para 10+ unidades');
  }
}

export interface DiscountProps {
  type: DiscountType;
  value: number;
  description: string;
  minAmount?: Money;
  maxDiscount?: Money;
  buyQuantity?: number;
  getQuantity?: number;
  bulkThreshold?: number;
}

export interface DiscountOptions {
  minAmount?: Money;
  maxDiscount?: Money;
}

export class InvalidDiscountError extends Error {
  constructor(message?: string) {
    super(message || 'Invalid discount');
    this.name = 'InvalidDiscountError';
  }
}
