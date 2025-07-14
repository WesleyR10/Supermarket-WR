import { ValueObject } from '../value-object';

export class Quantity extends ValueObject {
  readonly value: number;

  constructor(value: number) {
    super();
    this.value = Math.floor(value); // Sempre inteiro
    this.validate();
  }

  private validate() {
    if (this.value < 0) {
      throw new InvalidQuantityError('Quantity cannot be negative');
    }

    if (!Number.isInteger(this.value)) {
      throw new InvalidQuantityError('Quantity must be an integer');
    }

    if (this.value > 999999) {
      throw new InvalidQuantityError('Quantity cannot exceed 999,999 units');
    }
  }

  add(other: Quantity): Quantity {
    return new Quantity(this.value + other.value);
  }

  subtract(other: Quantity): Quantity {
    const result = this.value - other.value;
    if (result < 0) {
      throw new InvalidQuantityError('Resulting quantity cannot be negative');
    }
    return new Quantity(result);
  }

  multiply(factor: number): Quantity {
    return new Quantity(this.value * factor);
  }

  canSubtract(other: Quantity): boolean {
    return this.value >= other.value;
  }

  isGreaterThan(other: Quantity): boolean {
    return this.value > other.value;
  }

  isLessThan(other: Quantity): boolean {
    return this.value < other.value;
  }

  isEqualTo(other: Quantity): boolean {
    return this.value === other.value;
  }

  isZero(): boolean {
    return this.value === 0;
  }

  isPositive(): boolean {
    return this.value > 0;
  }

  toString(): string {
    return this.value.toString();
  }

  equals(other: Quantity): boolean {
    return this.value === other.value;
  }

  static zero(): Quantity {
    return new Quantity(0);
  }

  static one(): Quantity {
    return new Quantity(1);
  }

  static fromString(value: string): Quantity {
    const numericValue = parseInt(value, 10);
    if (isNaN(numericValue)) {
      throw new InvalidQuantityError('Invalid quantity string format');
    }
    return new Quantity(numericValue);
  }
}

export class InvalidQuantityError extends Error {
  constructor(message?: string) {
    super(message || 'Invalid quantity value');
    this.name = 'InvalidQuantityError';
  }
}
