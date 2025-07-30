import { Chance } from 'chance';
import { FiscalConfig, FiscalConfigId, FiscalConfigType } from './fiscal-config.aggregate';

type PropOrFactory<T> = T | ((index: number) => T);

export class FiscalConfigFakeBuilder<TBuild = any> {
  private _fiscal_config_id: PropOrFactory<FiscalConfigId> | undefined = undefined;
  private _store_id: PropOrFactory<string> = (_index) => this.chance.guid();
  private _config_name: PropOrFactory<string> = (_index) => this.getFiscalConfigName();
  private _config_type: PropOrFactory<FiscalConfigType> = (_index) => this.chance.pickone(Object.values(FiscalConfigType));
  private _tax_rate: PropOrFactory<number | null> = (_index) => this.chance.floating({ min: 0, max: 30, fixed: 2 });
  private _applies_to_ncm: PropOrFactory<string[]> = (_index) => this.getNCMCodes();
  private _applies_to_categories: PropOrFactory<string[]> = (_index) => this.getCategoryIds();
  private _min_value: PropOrFactory<number | null> = (_index) => this.chance.floating({ min: 0, max: 100, fixed: 2 });
  private _max_value: PropOrFactory<number | null> = (_index) => this.chance.floating({ min: 100, max: 10000, fixed: 2 });
  private _start_date: PropOrFactory<Date | null> = (_index) => new Date(this.chance.date({ year: 2024 }));
  private _end_date: PropOrFactory<Date | null> = (_index) => new Date(this.chance.date({ year: 2025 }));
  private _is_active: PropOrFactory<boolean> = (_index) => true;
  private _priority: PropOrFactory<number> = (_index) => this.chance.integer({ min: 0, max: 10 });
  private _description: PropOrFactory<string | null> = (_index) => this.chance.sentence();
  private _metadata: PropOrFactory<Record<string, any> | null> = (_index) => null;
  private _created_at: PropOrFactory<Date> | undefined = undefined;
  private _updated_at: PropOrFactory<Date> | undefined = undefined;

  private countObjs;
  private chance: Chance.Chance;

  static aFiscalConfig() {
    return new FiscalConfigFakeBuilder<FiscalConfig>();
  }

  static theFiscalConfigs(countObjs: number) {
    return new FiscalConfigFakeBuilder<FiscalConfig[]>(countObjs);
  }

  private constructor(countObjs: number = 1) {
    this.countObjs = countObjs;
    this.chance = Chance();
  }

  withFiscalConfigId(valueOrFactory: PropOrFactory<FiscalConfigId>) {
    this._fiscal_config_id = valueOrFactory;
    return this;
  }

  withStoreId(valueOrFactory: PropOrFactory<string>) {
    this._store_id = valueOrFactory;
    return this;
  }

  withConfigName(valueOrFactory: PropOrFactory<string>) {
    this._config_name = valueOrFactory;
    return this;
  }

  withConfigType(valueOrFactory: PropOrFactory<FiscalConfigType>) {
    this._config_type = valueOrFactory;
    return this;
  }

  withTaxRate(valueOrFactory: PropOrFactory<number | null>) {
    this._tax_rate = valueOrFactory;
    return this;
  }

  withAppliesTo(ncm: string[], categories: string[]) {
    this._applies_to_ncm = () => ncm;
    this._applies_to_categories = () => categories;
    return this;
  }

  withValueRange(min: number | null, max: number | null) {
    this._min_value = () => min;
    this._max_value = () => max;
    return this;
  }

  withValidityPeriod(start: Date | null, end: Date | null) {
    this._start_date = () => start;
    this._end_date = () => end;
    return this;
  }

  withPriority(valueOrFactory: PropOrFactory<number>) {
    this._priority = valueOrFactory;
    return this;
  }

  withDescription(valueOrFactory: PropOrFactory<string | null>) {
    this._description = valueOrFactory;
    return this;
  }

  activate() {
    this._is_active = () => true;
    return this;
  }

  deactivate() {
    this._is_active = () => false;
    return this;
  }

  withCreatedAt(valueOrFactory: PropOrFactory<Date>) {
    this._created_at = valueOrFactory;
    return this;
  }

  withUpdatedAt(valueOrFactory: PropOrFactory<Date>) {
    this._updated_at = valueOrFactory;
    return this;
  }

  withInvalidConfigName(value?: string) {
    this._config_name = () => value ?? this.chance.string({ length: 256 });
    return this;
  }

  withInvalidTaxRate(value?: number) {
    this._tax_rate = () => value ?? -1;
    return this;
  }

  asICMSConfig() {
    this._config_type = () => FiscalConfigType.ICMS;
    this._config_name = () => 'ICMS_PADRAO';
    this._tax_rate = () => 18.0;
    return this;
  }

  asIPIConfig() {
    this._config_type = () => FiscalConfigType.IPI;
    this._config_name = () => 'IPI_BEBIDAS';
    this._tax_rate = () => 10.0;
    return this;
  }

  build(): TBuild {
    const fiscalConfigs = new Array(this.countObjs).fill(undefined).map((_, index) => {
      return new FiscalConfig({
        fiscal_config_id: !this._fiscal_config_id ? undefined : this.callFactory(this._fiscal_config_id, index),
        store_id: this.callFactory(this._store_id, index),
        config_name: this.callFactory(this._config_name, index),
        config_type: this.callFactory(this._config_type, index),
        tax_rate: this.callFactory(this._tax_rate, index),
        applies_to_ncm: this.callFactory(this._applies_to_ncm, index),
        applies_to_categories: this.callFactory(this._applies_to_categories, index),
        min_value: this.callFactory(this._min_value, index),
        max_value: this.callFactory(this._max_value, index),
        start_date: this.callFactory(this._start_date, index),
        end_date: this.callFactory(this._end_date, index),
        is_active: this.callFactory(this._is_active, index),
        priority: this.callFactory(this._priority, index),
        description: this.callFactory(this._description, index),
        metadata: this.callFactory(this._metadata, index),
        created_at: !this._created_at ? undefined : this.callFactory(this._created_at, index),
        updated_at: !this._updated_at ? undefined : this.callFactory(this._updated_at, index),
      });
    });
    return this.countObjs === 1 ? (fiscalConfigs[0] as any) : fiscalConfigs as TBuild;
  }

  get fiscal_config_id() {
    return this.getValue('fiscal_config_id');
  }

  get store_id() {
    return this.getValue('store_id');
  }

  get config_name() {
    return this.getValue('config_name');
  }

  get is_active() {
    return this.getValue('is_active');
  }

  get created_at() {
    return this.getValue('created_at');
  }

  private getValue(prop: any) {
    const optional = ['fiscal_config_id', 'created_at', 'updated_at'];
    const privateProp = `_${prop}` as keyof this;
    if (!optional.includes(prop) && !this[privateProp]) {
      throw new Error(`Property ${prop} not have a factory, use 'with' methods`);
    }
    return this.callFactory(this[privateProp] as any, 0);
  }

  private callFactory(factoryOrValue: PropOrFactory<any>, index: number) {
    return typeof factoryOrValue === 'function' ? factoryOrValue(index) : factoryOrValue;
  }

  private getFiscalConfigName(): string {
    const names = [
      'ICMS_PADRAO', 'ICMS_REDUZIDO', 'IPI_BEBIDAS', 'IPI_CIGARROS',
      'PIS_PADRAO', 'COFINS_PADRAO', 'ISS_SERVICOS', 'ICMS_ST'
    ];
    return this.chance.pickone(names);
  }

  private getNCMCodes(): string[] {
    const codes = ['12345678', '87654321', '11111111', '22222222', '33333333'];
    return this.chance.pickset(codes, this.chance.integer({ min: 0, max: 3 }));
  }

  private getCategoryIds(): string[] {
    const ids = [this.chance.guid(), this.chance.guid(), this.chance.guid()];
    return this.chance.pickset(ids, this.chance.integer({ min: 0, max: 2 }));
  }
}