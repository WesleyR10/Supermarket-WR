import { ValueObject } from '../value-object';

export class Price extends ValueObject {
  readonly value: number;

  constructor(value: number) {
    super();
    this.value = this.roundToTwoDecimals(value);
    this.validate();
  }

  private validate() {
    if (this.value < 0) {
      throw new InvalidPriceError('Price cannot be negative');
    }

    if (!Number.isFinite(this.value)) {
      throw new InvalidPriceError('Price must be a valid number');
    }

    if (this.value > 999999.99) {
      throw new InvalidPriceError('Price cannot exceed R$ 999,999.99');
    }
  }

  private roundToTwoDecimals(value: number): number {
    return Math.round(value * 100) / 100;
  }

  add(other: Price): Price {
    return new Price(this.value + other.value);
  }

  subtract(other: Price): Price {
    return new Price(this.value - other.value);
  }

  multiply(factor: number): Price {
    return new Price(this.value * factor);
  }

  divide(divisor: number): Price {
    if (divisor === 0) {
      throw new InvalidPriceError('Cannot divide by zero');
    }
    return new Price(this.value / divisor);
  }

  isGreaterThan(other: Price): boolean {
    return this.value > other.value;
  }

  isLessThan(other: Price): boolean {
    return this.value < other.value;
  }

  isEqualTo(other: Price): boolean {
    return this.value === other.value;
  }

  toFormattedString(): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(this.value);
  }

  toString(): string {
    return this.value.toFixed(2);
  }

  equals(other: Price): boolean {
    return this.value === other.value;
  }

  static zero(): Price {
    return new Price(0);
  }

  static fromString(value: string): Price {
    const numericValue = parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.'));
    if (isNaN(numericValue)) {
      throw new InvalidPriceError('Invalid price string format');
    }
    return new Price(numericValue);
  }
}

export class InvalidPriceError extends Error {
  constructor(message?: string) {
    super(message || 'Invalid price value');
    this.name = 'InvalidPriceError';
  }
}
