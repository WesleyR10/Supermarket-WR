import { ValueObject } from '../value-object';

export enum PaymentMethodType {
  CASH = 'CASH',
  DEBIT_CARD = 'DEBIT_CARD',
  CREDIT_CARD = 'CREDIT_CARD',
  PIX = 'PIX',
  BANK_SLIP = 'BANK_SLIP',
  STORE_CREDIT = 'STORE_CREDIT',
  VOUCHER = 'VOUCHER',
  CHECK = 'CHECK'
}

export class PaymentMethod extends ValueObject {
  readonly type: PaymentMethodType;
  readonly details?: PaymentMethodDetails;

  constructor(type: PaymentMethodType, details?: PaymentMethodDetails) {
    super();
    this.type = type;
    this.details = details;
    this.validate();
  }

  private validate() {
    if (!Object.values(PaymentMethodType).includes(this.type)) {
      throw new InvalidPaymentMethodError('Invalid payment method type');
    }

    // Validações específicas por tipo
    switch (this.type) {
      case PaymentMethodType.CREDIT_CARD:
        this.validateCreditCardDetails();
        break;
      case PaymentMethodType.DEBIT_CARD:
        this.validateDebitCardDetails();
        break;
      case PaymentMethodType.PIX:
        this.validatePixDetails();
        break;
      case PaymentMethodType.BANK_SLIP:
        this.validateBankSlipDetails();
        break;
      case PaymentMethodType.VOUCHER:
        this.validateVoucherDetails();
        break;
      case PaymentMethodType.CHECK:
        this.validateCheckDetails();
        break;
    }
  }

  private validateCreditCardDetails() {
    if (this.details?.installments && this.details.installments < 1) {
      throw new InvalidPaymentMethodError('Credit card installments must be at least 1');
    }

    if (this.details?.installments && this.details.installments > 24) {
      throw new InvalidPaymentMethodError('Credit card installments cannot exceed 24');
    }

    if (this.details?.cardBrand && !this.isValidCardBrand(this.details.cardBrand)) {
      throw new InvalidPaymentMethodError('Invalid card brand');
    }
  }

  private validateDebitCardDetails() {
    if (this.details?.installments && this.details.installments > 1) {
      throw new InvalidPaymentMethodError('Debit card cannot have installments');
    }

    if (this.details?.cardBrand && !this.isValidCardBrand(this.details.cardBrand)) {
      throw new InvalidPaymentMethodError('Invalid card brand');
    }
  }

  private validatePixDetails() {
    if (this.details?.pixKey && !this.isValidPixKey(this.details.pixKey)) {
      throw new InvalidPaymentMethodError('Invalid PIX key format');
    }
  }

  private validateBankSlipDetails() {
    if (this.details?.dueDate) {
      const dueDate = new Date(this.details.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dueDate < today) {
        throw new InvalidPaymentMethodError('Bank slip due date cannot be in the past');
      }
    }
  }

  private validateVoucherDetails() {
    if (this.details?.voucherCode && this.details.voucherCode.trim().length === 0) {
      throw new InvalidPaymentMethodError('Voucher code cannot be empty');
    }
  }

  private validateCheckDetails() {
    if (this.details?.checkNumber && this.details.checkNumber.trim().length === 0) {
      throw new InvalidPaymentMethodError('Check number cannot be empty');
    }

    if (this.details?.bankCode && this.details.bankCode.trim().length === 0) {
      throw new InvalidPaymentMethodError('Bank code cannot be empty');
    }
  }

  private isValidCardBrand(brand: string): boolean {
    const validBrands = ['VISA', 'MASTERCARD', 'AMEX', 'ELO', 'HIPERCARD', 'DINERS'];
    return validBrands.includes(brand.toUpperCase());
  }

  private isValidPixKey(pixKey: string): boolean {
    // Validação básica para chaves PIX (CPF, CNPJ, email, telefone, chave aleatória)
    const cpfRegex = /^\d{11}$/;
    const cnpjRegex = /^\d{14}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+55\d{10,11}$/;
    const randomKeyRegex = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

    return cpfRegex.test(pixKey) ||
           cnpjRegex.test(pixKey) ||
           emailRegex.test(pixKey) ||
           phoneRegex.test(pixKey) ||
           randomKeyRegex.test(pixKey);
  }

  isCash(): boolean {
    return this.type === PaymentMethodType.CASH;
  }

  isCard(): boolean {
    return this.type === PaymentMethodType.CREDIT_CARD || 
           this.type === PaymentMethodType.DEBIT_CARD;
  }

  isCreditCard(): boolean {
    return this.type === PaymentMethodType.CREDIT_CARD;
  }

  isDebitCard(): boolean {
    return this.type === PaymentMethodType.DEBIT_CARD;
  }

  isPix(): boolean {
    return this.type === PaymentMethodType.PIX;
  }

  isElectronic(): boolean {
    return this.isPix() || this.isCard();
  }

  requiresChange(): boolean {
    return this.isCash();
  }

  allowsInstallments(): boolean {
    return this.type === PaymentMethodType.CREDIT_CARD;
  }

  getInstallments(): number {
    return this.details?.installments || 1;
  }

  getCardBrand(): string | undefined {
    return this.details?.cardBrand;
  }

  getPixKey(): string | undefined {
    return this.details?.pixKey;
  }

  getVoucherCode(): string | undefined {
    return this.details?.voucherCode;
  }

  getCheckNumber(): string | undefined {
    return this.details?.checkNumber;
  }

  getBankCode(): string | undefined {
    return this.details?.bankCode;
  }

  getDueDate(): Date | undefined {
    return this.details?.dueDate ? new Date(this.details.dueDate) : undefined;
  }

  getDisplayName(): string {
    switch (this.type) {
      case PaymentMethodType.CASH:
        return 'Dinheiro';
      case PaymentMethodType.CREDIT_CARD:
        const installments = this.getInstallments();
        const brand = this.getCardBrand();
        const brandText = brand ? ` ${brand}` : '';
        return installments > 1 
          ? `Cartão de Crédito${brandText} (${installments}x)`
          : `Cartão de Crédito${brandText}`;
      case PaymentMethodType.DEBIT_CARD:
        const debitBrand = this.getCardBrand();
        const debitBrandText = debitBrand ? ` ${debitBrand}` : '';
        return `Cartão de Débito${debitBrandText}`;
      case PaymentMethodType.PIX:
        return 'PIX';
      case PaymentMethodType.BANK_SLIP:
        return 'Boleto Bancário';
      case PaymentMethodType.STORE_CREDIT:
        return 'Crédito da Loja';
      case PaymentMethodType.VOUCHER:
        return 'Vale/Voucher';
      case PaymentMethodType.CHECK:
        return 'Cheque';
      default:
        return this.type;
    }
  }

  getShortName(): string {
    switch (this.type) {
      case PaymentMethodType.CASH:
        return 'Dinheiro';
      case PaymentMethodType.CREDIT_CARD:
        return 'Crédito';
      case PaymentMethodType.DEBIT_CARD:
        return 'Débito';
      case PaymentMethodType.PIX:
        return 'PIX';
      case PaymentMethodType.BANK_SLIP:
        return 'Boleto';
      case PaymentMethodType.STORE_CREDIT:
        return 'Crédito Loja';
      case PaymentMethodType.VOUCHER:
        return 'Voucher';
      case PaymentMethodType.CHECK:
        return 'Cheque';
      default:
        return this.type;
    }
  }

  toString(): string {
    return this.getDisplayName();
  }

  equals(other: PaymentMethod): boolean {
    return this.type === other.type &&
           JSON.stringify(this.details) === JSON.stringify(other.details);
  }

  // Factory methods para criação fácil
  static cash(): PaymentMethod {
    return new PaymentMethod(PaymentMethodType.CASH);
  }

  static creditCard(installments: number = 1, cardBrand?: string): PaymentMethod {
    return new PaymentMethod(PaymentMethodType.CREDIT_CARD, {
      installments,
      cardBrand: cardBrand?.toUpperCase()
    });
  }

  static debitCard(cardBrand?: string): PaymentMethod {
    return new PaymentMethod(PaymentMethodType.DEBIT_CARD, {
      cardBrand: cardBrand?.toUpperCase()
    });
  }

  static pix(pixKey?: string): PaymentMethod {
    return new PaymentMethod(PaymentMethodType.PIX, {
      pixKey
    });
  }

  static bankSlip(dueDate?: Date): PaymentMethod {
    return new PaymentMethod(PaymentMethodType.BANK_SLIP, {
      dueDate
    });
  }

  static storeCredit(): PaymentMethod {
    return new PaymentMethod(PaymentMethodType.STORE_CREDIT);
  }

  static voucher(voucherCode: string): PaymentMethod {
    return new PaymentMethod(PaymentMethodType.VOUCHER, {
      voucherCode
    });
  }

  static check(checkNumber: string, bankCode: string): PaymentMethod {
    return new PaymentMethod(PaymentMethodType.CHECK, {
      checkNumber,
      bankCode
    });
  }

  static fromString(paymentString: string): PaymentMethod {
    const upperString = paymentString.toUpperCase();
    
    if (upperString.includes('DINHEIRO') || upperString === 'CASH') {
      return PaymentMethod.cash();
    }
    
    if (upperString.includes('CREDITO') || upperString.includes('CREDIT')) {
      return PaymentMethod.creditCard();
    }
    
    if (upperString.includes('DEBITO') || upperString.includes('DEBIT')) {
      return PaymentMethod.debitCard();
    }
    
    if (upperString === 'PIX') {
      return PaymentMethod.pix();
    }
    
    if (upperString.includes('BOLETO') || upperString.includes('BANK_SLIP')) {
      return PaymentMethod.bankSlip();
    }
    
    throw new InvalidPaymentMethodError(`Cannot parse payment method from string: ${paymentString}`);
  }
}

export interface PaymentMethodDetails {
  installments?: number;
  cardBrand?: string;
  pixKey?: string;
  voucherCode?: string;
  checkNumber?: string;
  bankCode?: string;
  dueDate?: Date;
}

export class InvalidPaymentMethodError extends Error {
  constructor(message?: string) {
    super(message || 'Invalid payment method');
    this.name = 'InvalidPaymentMethodError';
  }
}
