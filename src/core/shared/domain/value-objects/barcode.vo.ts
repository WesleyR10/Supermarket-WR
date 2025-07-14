import { ValueObject } from '../value-object';

export class Barcode extends ValueObject {
  readonly value: string;

  constructor(value: string) {
    super();
    this.value = value;
    this.validate();
  }

  private validate() {
    if (!this.value || this.value.trim().length === 0) {
      throw new InvalidBarcodeError('Barcode cannot be empty');
    }

    // Remove espaços e caracteres especiais
    const cleanBarcode = this.value.replace(/\D/g, '');
    
    if (cleanBarcode.length < 8 || cleanBarcode.length > 14) {
      throw new InvalidBarcodeError('Barcode must be between 8 and 14 digits');
    }

    // Validação EAN-13 (mais comum no Brasil)
    if (cleanBarcode.length === 13) {
      if (!this.isValidEAN13(cleanBarcode)) {
        throw new InvalidBarcodeError('Invalid EAN-13 barcode');
      }
    }

    // Validação EAN-8
    if (cleanBarcode.length === 8) {
      if (!this.isValidEAN8(cleanBarcode)) {
        throw new InvalidBarcodeError('Invalid EAN-8 barcode');
      }
    }
  }

  private isValidEAN13(barcode: string): boolean {
    const digits = barcode.split('').map(Number);
    const checkDigit = digits.pop()!;
    
    let sum = 0;
    for (let i = 0; i < digits.length; i++) {
      sum += digits[i] * (i % 2 === 0 ? 1 : 3);
    }
    
    const calculatedCheckDigit = (10 - (sum % 10)) % 10;
    return calculatedCheckDigit === checkDigit;
  }

  private isValidEAN8(barcode: string): boolean {
    const digits = barcode.split('').map(Number);
    const checkDigit = digits.pop()!;
    
    let sum = 0;
    for (let i = 0; i < digits.length; i++) {
      sum += digits[i] * (i % 2 === 0 ? 3 : 1);
    }
    
    const calculatedCheckDigit = (10 - (sum % 10)) % 10;
    return calculatedCheckDigit === checkDigit;
  }

  toString(): string {
    return this.value;
  }

  equals(other: Barcode): boolean {
    return this.value === other.value;
  }
}

export class InvalidBarcodeError extends Error {
  constructor(message?: string) {
    super(message || 'Invalid barcode format');
    this.name = 'InvalidBarcodeError';
  }
}
