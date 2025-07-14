import { ValueObject } from '../value-object';

export class Money extends ValueObject {
  readonly value: number;

  constructor(value: number) {
    super();
    this.value = this.roundToTwoDecimals(value);
    this.validate();
  }

  private validate() {
    if (!Number.isFinite(this.value)) {
      throw new InvalidMoneyError('Money must be a valid number');
    }

    if (this.value < 0) {
      throw new InvalidMoneyError('Money cannot be negative');
    }

    if (this.value > 9999999.99) {
      throw new InvalidMoneyError('Money cannot exceed R$ 9,999,999.99');
    }
  }

  private roundToTwoDecimals(value: number): number {
    return Math.round(value * 100) / 100;
  }

  add(other: Money): Money {
    return new Money(this.value + other.value);
  }

  subtract(other: Money): Money {
    const result = this.value - other.value;
    if (result < 0) {
      throw new InvalidMoneyError('Resulting money cannot be negative');
    }
    return new Money(result);
  }

  multiply(factor: number): Money {
    return new Money(this.value * factor);
  }

  divide(divisor: number): Money {
    if (divisor === 0) {
      throw new InvalidMoneyError('Cannot divide by zero');
    }
    return new Money(this.value / divisor);
  }

  percentage(percent: number): Money {
    return new Money(this.value * (percent / 100));
  }

  isGreaterThan(other: Money): boolean {
    return this.value > other.value;
  }

  isLessThan(other: Money): boolean {
    return this.value < other.value;
  }

  isEqualTo(other: Money): boolean {
    return this.value === other.value;
  }

  isZero(): boolean {
    return this.value === 0;
  }

  isPositive(): boolean {
    return this.value > 0;
  }

  canSubtract(other: Money): boolean {
    return this.value >= other.value;
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

  equals(other: Money): boolean {
    return this.value === other.value;
  }

  static zero(): Money {
    return new Money(0);
  }

  static fromCents(cents: number): Money {
    return new Money(cents / 100);
  }

  static fromString(value: string): Money {
    // Remove símbolos de moeda e converte vírgula para ponto
    const cleanValue = value.replace(/[^\d.,]/g, '').replace(',', '.');
    const numericValue = parseFloat(cleanValue);
    
    if (isNaN(numericValue)) {
      throw new InvalidMoneyError('Invalid money string format');
    }
    
    return new Money(numericValue);
  }

  toCents(): number {
    return Math.round(this.value * 100);
  }
}

export class InvalidMoneyError extends Error {
  constructor(message?: string) {
    super(message || 'Invalid money value');
    this.name = 'InvalidMoneyError';
  }
}
