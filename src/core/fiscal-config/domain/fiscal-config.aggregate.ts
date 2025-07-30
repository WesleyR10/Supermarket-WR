import { AggregateRoot } from '../../shared/domain/aggregate-root';
import { ValueObject } from '../../shared/domain/value-object';
import { Uuid } from '../../shared/domain/value-objects/uuid.vo';
import { FiscalConfigFakeBuilder } from './fiscal-config-fake.builder';
import { FiscalConfigValidatorFactory } from './fiscal-config.validator';

export enum FiscalConfigType {
  ICMS = 'ICMS',
  IPI = 'IPI',
  PIS = 'PIS',
  COFINS = 'COFINS',
  ISS = 'ISS',
  CUSTOM = 'CUSTOM'
}

export type FiscalConfigConstructorProps = {
  fiscal_config_id?: FiscalConfigId;
  store_id: string;
  config_name: string;
  config_type: FiscalConfigType;
  tax_rate?: number | null;
  applies_to_ncm?: string[];
  applies_to_categories?: string[];
  min_value?: number | null;
  max_value?: number | null;
  start_date?: Date | null;
  end_date?: Date | null;
  is_active?: boolean;
  priority?: number;
  description?: string | null;
  metadata?: Record<string, any> | null;
  created_at?: Date;
  updated_at?: Date;
};

export type FiscalConfigCreateCommand = {
  store_id: string;
  config_name: string;
  config_type: FiscalConfigType;
  tax_rate?: number | null;
  applies_to_ncm?: string[];
  applies_to_categories?: string[];
  min_value?: number | null;
  max_value?: number | null;
  start_date?: Date | null;
  end_date?: Date | null;
  is_active?: boolean;
  priority?: number;
  description?: string | null;
  metadata?: Record<string, any> | null;
};

export class FiscalConfigId extends Uuid {}

export class FiscalConfig extends AggregateRoot {
  fiscal_config_id: FiscalConfigId;
  store_id: string;
  config_name: string;
  config_type: FiscalConfigType;
  tax_rate: number | null;
  applies_to_ncm: string[];
  applies_to_categories: string[];
  min_value: number | null;
  max_value: number | null;
  start_date: Date | null;
  end_date: Date | null;
  is_active: boolean;
  priority: number;
  description: string | null;
  metadata: Record<string, any> | null;
  created_at: Date;
  updated_at: Date;

  constructor(props: FiscalConfigConstructorProps) {
    super();
    this.fiscal_config_id = props.fiscal_config_id ?? new FiscalConfigId();
    this.store_id = props.store_id;
    this.config_name = props.config_name;
    this.config_type = props.config_type;
    this.tax_rate = props.tax_rate ?? null;
    this.applies_to_ncm = props.applies_to_ncm ?? [];
    this.applies_to_categories = props.applies_to_categories ?? [];
    this.min_value = props.min_value ?? null;
    this.max_value = props.max_value ?? null;
    this.start_date = props.start_date ?? null;
    this.end_date = props.end_date ?? null;
    this.is_active = props.is_active ?? true;
    this.priority = props.priority ?? 0;
    this.description = props.description ?? null;
    this.metadata = props.metadata ?? null;
    this.created_at = props.created_at ?? new Date();
    this.updated_at = props.updated_at ?? new Date();
  }

  get entity_id(): ValueObject {
    return this.fiscal_config_id;
  }

  static create(props: FiscalConfigCreateCommand): FiscalConfig {
    const fiscalConfig = new FiscalConfig({
      ...props,
      created_at: new Date(),
      updated_at: new Date()
    });
    // Validar apenas campos obrigatórios, como nos outros domínios
    fiscalConfig.validate(['config_name']);
    return fiscalConfig;
  }

  // REGRAS DE NEGÓCIO ESPECÍFICAS FISCAIS

  changeName(name: string): void {
    this.config_name = name;
    this.updated_at = new Date();
    this.validate(['config_name']);
  }

  changeDescription(description: string | null): void {
    this.description = description;
    this.updated_at = new Date();
  }

  updateTaxRate(taxRate: number | null): void {
    this.tax_rate = taxRate;
    this.updated_at = new Date();
    this.validate(['tax_rate']);
  }

  addNCMCode(ncmCode: string): void {
    if (!this.applies_to_ncm.includes(ncmCode)) {
      this.applies_to_ncm.push(ncmCode);
      this.updated_at = new Date();
    }
  }

  removeNCMCode(ncmCode: string): void {
    this.applies_to_ncm = this.applies_to_ncm.filter(code => code !== ncmCode);
    this.updated_at = new Date();
  }

  addCategory(categoryId: string): void {
    if (!this.applies_to_categories.includes(categoryId)) {
      this.applies_to_categories.push(categoryId);
      this.updated_at = new Date();
    }
  }

  removeCategory(categoryId: string): void {
    this.applies_to_categories = this.applies_to_categories.filter(id => id !== categoryId);
    this.updated_at = new Date();
  }

  activate(): void {
    this.is_active = true;
    this.updated_at = new Date();
  }

  deactivate(): void {
    this.is_active = false;
    this.updated_at = new Date();
  }

  updatePriority(priority: number): void {
    this.priority = priority;
    this.updated_at = new Date();
    this.validate(['priority']);
  }

  setValidityPeriod(startDate: Date | null, endDate: Date | null): void {
    if (startDate && endDate && startDate >= endDate) {
      throw new Error('Data de início deve ser anterior à data de fim');
    }
    this.start_date = startDate;
    this.end_date = endDate;
    this.updated_at = new Date();
  }

  // REGRAS DE NEGÓCIO - VALIDAÇÕES FISCAIS

  isValidForDate(date: Date = new Date()): boolean {
    if (!this.is_active) return false;
    
    if (this.start_date && date < this.start_date) return false;
    if (this.end_date && date > this.end_date) return false;
    
    return true;
  }

  appliesTo(productData: {
    ncm_code?: string;
    category_id?: string;
    value?: number;
  }): boolean {
    if (!this.isValidForDate()) return false;

    // Verifica NCM
    if (productData.ncm_code && this.applies_to_ncm.length > 0) {
      if (!this.applies_to_ncm.includes(productData.ncm_code)) return false;
    }

    // Verifica categoria
    if (productData.category_id && this.applies_to_categories.length > 0) {
      if (!this.applies_to_categories.includes(productData.category_id)) return false;
    }

    // Verifica valor mínimo
    if (this.min_value && productData.value && productData.value < this.min_value) {
      return false;
    }

    // Verifica valor máximo
    if (this.max_value && productData.value && productData.value > this.max_value) {
      return false;
    }

    return true;
  }

  calculateTax(baseValue: number): number {
    if (!this.tax_rate || !this.isValidForDate()) return 0;
    return (baseValue * this.tax_rate) / 100;
  }

  isHigherPriorityThan(other: FiscalConfig): boolean {
    return this.priority > other.priority;
  }

  validate(fields?: string[]) {
    const validator = FiscalConfigValidatorFactory.create();
    return validator.validate(this.notification, this, fields);
  }

  static fake() {
    return FiscalConfigFakeBuilder;
  }

  toJSON() {
    return {
      fiscal_config_id: this.fiscal_config_id.id,
      store_id: this.store_id,
      config_name: this.config_name,
      config_type: this.config_type,
      tax_rate: this.tax_rate,
      applies_to_ncm: this.applies_to_ncm,
      applies_to_categories: this.applies_to_categories,
      min_value: this.min_value,
      max_value: this.max_value,
      start_date: this.start_date,
      end_date: this.end_date,
      is_active: this.is_active,
      priority: this.priority,
      description: this.description,
      metadata: this.metadata,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }
}