import { ValueObject } from '../value-object';

export class ExpiryDate extends ValueObject {
  readonly value: Date;

  constructor(value: Date | string) {
    super();
    this.value = typeof value === 'string' ? new Date(value) : value;
    this.validate();
  }

  private validate() {
    if (!(this.value instanceof Date) || isNaN(this.value.getTime())) {
      throw new InvalidExpiryDateError('Invalid expiry date');
    }

    // Não permitir datas muito antigas (mais de 10 anos atrás)
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
    
    if (this.value < tenYearsAgo) {
      throw new InvalidExpiryDateError('Expiry date cannot be more than 10 years in the past');
    }

    // Não permitir datas muito futuras (mais de 50 anos)
    const fiftyYearsFromNow = new Date();
    fiftyYearsFromNow.setFullYear(fiftyYearsFromNow.getFullYear() + 50);
    
    if (this.value > fiftyYearsFromNow) {
      throw new InvalidExpiryDateError('Expiry date cannot be more than 50 years in the future');
    }
  }

  static create(value: Date | string): ExpiryDate {
    return new ExpiryDate(value);
  }

  static today(): ExpiryDate {
    return new ExpiryDate(new Date());
  }

  static tomorrow(): ExpiryDate {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return new ExpiryDate(tomorrow);
  }

  static inDays(days: number): ExpiryDate {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    return new ExpiryDate(futureDate);
  }

  static inWeeks(weeks: number): ExpiryDate {
    return ExpiryDate.inDays(weeks * 7);
  }

  static inMonths(months: number): ExpiryDate {
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + months);
    return new ExpiryDate(futureDate);
  }

  static inYears(years: number): ExpiryDate {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + years);
    return new ExpiryDate(futureDate);
  }

  isExpired(referenceDate?: Date): boolean {
    const reference = referenceDate || new Date();
    return this.value < reference;
  }

  isExpiredToday(): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiryDay = new Date(this.value);
    expiryDay.setHours(0, 0, 0, 0);
    return expiryDay < today;
  }

  isExpiringSoon(daysThreshold: number = 7): boolean {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + daysThreshold);
    return this.value <= threshold && !this.isExpired();
  }

  isExpiringToday(): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return this.value >= today && this.value < tomorrow;
  }

  isExpiringTomorrow(): boolean {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
    
    return this.value >= tomorrow && this.value < dayAfterTomorrow;
  }

  daysUntilExpiry(referenceDate?: Date): number {
    const reference = referenceDate || new Date();
    const diffTime = this.value.getTime() - reference.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  hoursUntilExpiry(referenceDate?: Date): number {
    const reference = referenceDate || new Date();
    const diffTime = this.value.getTime() - reference.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60));
  }

  minutesUntilExpiry(referenceDate?: Date): number {
    const reference = referenceDate || new Date();
    const diffTime = this.value.getTime() - reference.getTime();
    return Math.ceil(diffTime / (1000 * 60));
  }

  getExpiryStatus(): ExpiryStatus {
    if (this.isExpired()) {
      return ExpiryStatus.EXPIRED;
    }

    if (this.isExpiringToday()) {
      return ExpiryStatus.EXPIRING_TODAY;
    }

    if (this.isExpiringTomorrow()) {
      return ExpiryStatus.EXPIRING_TOMORROW;
    }

    if (this.isExpiringSoon(3)) {
      return ExpiryStatus.EXPIRING_SOON;
    }

    if (this.isExpiringSoon(7)) {
      return ExpiryStatus.EXPIRING_THIS_WEEK;
    }

    return ExpiryStatus.FRESH;
  }

  getUrgencyLevel(): UrgencyLevel {
    const status = this.getExpiryStatus();
    
    switch (status) {
      case ExpiryStatus.EXPIRED:
        return UrgencyLevel.CRITICAL;
      case ExpiryStatus.EXPIRING_TODAY:
        return UrgencyLevel.HIGH;
      case ExpiryStatus.EXPIRING_TOMORROW:
        return UrgencyLevel.MEDIUM;
      case ExpiryStatus.EXPIRING_SOON:
        return UrgencyLevel.LOW;
      default:
        return UrgencyLevel.NONE;
    }
  }

  getDiscountSuggestion(): number {
    const status = this.getExpiryStatus();
    
    switch (status) {
      case ExpiryStatus.EXPIRED:
        return 0; // Produto vencido não deve ser vendido
      case ExpiryStatus.EXPIRING_TODAY:
        return 50; // 50% de desconto
      case ExpiryStatus.EXPIRING_TOMORROW:
        return 30; // 30% de desconto
      case ExpiryStatus.EXPIRING_SOON:
        return 20; // 20% de desconto
      case ExpiryStatus.EXPIRING_THIS_WEEK:
        return 10; // 10% de desconto
      default:
        return 0; // Sem desconto
    }
  }

  shouldBeRemoved(): boolean {
    return this.getExpiryStatus() === ExpiryStatus.EXPIRED;
  }

  shouldHaveDiscount(): boolean {
    return this.getDiscountSuggestion() > 0;
  }

  canBeSold(): boolean {
    return !this.isExpired();
  }

  isBefore(other: ExpiryDate): boolean {
    return this.value < other.value;
  }

  isAfter(other: ExpiryDate): boolean {
    return this.value > other.value;
  }

  isSameDay(other: ExpiryDate): boolean {
    const thisDay = new Date(this.value);
    thisDay.setHours(0, 0, 0, 0);
    
    const otherDay = new Date(other.value);
    otherDay.setHours(0, 0, 0, 0);
    
    return thisDay.getTime() === otherDay.getTime();
  }

  addDays(days: number): ExpiryDate {
    const newDate = new Date(this.value);
    newDate.setDate(newDate.getDate() + days);
    return new ExpiryDate(newDate);
  }

  subtractDays(days: number): ExpiryDate {
    return this.addDays(-days);
  }

  toDateString(): string {
    return this.value.toLocaleDateString('pt-BR');
  }

  toISOString(): string {
    return this.value.toISOString();
  }

  toDisplayString(): string {
    const status = this.getExpiryStatus();
    const dateStr = this.toDateString();
    
    switch (status) {
      case ExpiryStatus.EXPIRED:
        return `Vencido em ${dateStr}`;
      case ExpiryStatus.EXPIRING_TODAY:
        return `Vence hoje (${dateStr})`;
      case ExpiryStatus.EXPIRING_TOMORROW:
        return `Vence amanhã (${dateStr})`;
      case ExpiryStatus.EXPIRING_SOON:
        const days = this.daysUntilExpiry();
        return `Vence em ${days} dias (${dateStr})`;
      default:
        return `Válido até ${dateStr}`;
    }
  }

  getStatusColor(): string {
    const status = this.getExpiryStatus();
    
    switch (status) {
      case ExpiryStatus.EXPIRED:
        return '#dc3545'; // Vermelho
      case ExpiryStatus.EXPIRING_TODAY:
        return '#fd7e14'; // Laranja escuro
      case ExpiryStatus.EXPIRING_TOMORROW:
        return '#ffc107'; // Amarelo
      case ExpiryStatus.EXPIRING_SOON:
        return '#fd7e14'; // Laranja
      case ExpiryStatus.EXPIRING_THIS_WEEK:
        return '#ffc107'; // Amarelo claro
      default:
        return '#28a745'; // Verde
    }
  }

  getStatusIcon(): string {
    const status = this.getExpiryStatus();
    
    switch (status) {
      case ExpiryStatus.EXPIRED:
        return '❌';
      case ExpiryStatus.EXPIRING_TODAY:
        return '🚨';
      case ExpiryStatus.EXPIRING_TOMORROW:
        return '⚠️';
      case ExpiryStatus.EXPIRING_SOON:
        return '⏰';
      case ExpiryStatus.EXPIRING_THIS_WEEK:
        return '📅';
      default:
        return '✅';
    }
  }

  toString(): string {
    return this.toDisplayString();
  }

  equals(other: ExpiryDate): boolean {
    return this.value.getTime() === other.value.getTime();
  }

  // Métodos para comparação FIFO (First In, First Out)
  static sortByExpiry(dates: ExpiryDate[]): ExpiryDate[] {
    return dates.sort((a, b) => a.value.getTime() - b.value.getTime());
  }

  static getEarliest(dates: ExpiryDate[]): ExpiryDate | null {
    if (dates.length === 0) return null;
    return dates.reduce((earliest, current) => 
      current.isBefore(earliest) ? current : earliest
    );
  }

  static getLatest(dates: ExpiryDate[]): ExpiryDate | null {
    if (dates.length === 0) return null;
    return dates.reduce((latest, current) => 
      current.isAfter(latest) ? current : latest
    );
  }

  // Métodos para análise de lote
  static groupByStatus(dates: ExpiryDate[]): Record<ExpiryStatus, ExpiryDate[]> {
    const groups: Record<ExpiryStatus, ExpiryDate[]> = {
      [ExpiryStatus.EXPIRED]: [],
      [ExpiryStatus.EXPIRING_TODAY]: [],
      [ExpiryStatus.EXPIRING_TOMORROW]: [],
      [ExpiryStatus.EXPIRING_SOON]: [],
      [ExpiryStatus.EXPIRING_THIS_WEEK]: [],
      [ExpiryStatus.FRESH]: []
    };

    dates.forEach(date => {
      const status = date.getExpiryStatus();
      groups[status].push(date);
    });

    return groups;
  }

  static getExpiringCount(dates: ExpiryDate[], daysThreshold: number = 7): number {
    return dates.filter(date => date.isExpiringSoon(daysThreshold)).length;
  }

  static getExpiredCount(dates: ExpiryDate[]): number {
    return dates.filter(date => date.isExpired()).length;
  }
}

export enum ExpiryStatus {
  EXPIRED = 'EXPIRED',
  EXPIRING_TODAY = 'EXPIRING_TODAY',
  EXPIRING_TOMORROW = 'EXPIRING_TOMORROW',
  EXPIRING_SOON = 'EXPIRING_SOON',
  EXPIRING_THIS_WEEK = 'EXPIRING_THIS_WEEK',
  FRESH = 'FRESH'
}

export enum UrgencyLevel {
  NONE = 'NONE',
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export class InvalidExpiryDateError extends Error {
  constructor(message?: string) {
    super(message || 'Invalid expiry date');
    this.name = 'InvalidExpiryDateError';
  }
}
