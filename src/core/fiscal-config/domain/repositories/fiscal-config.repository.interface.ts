import { ISearchableRepository } from '../../../shared/domain/repository/repository-interface';
import { FiscalConfig, FiscalConfigId, FiscalConfigType } from '../fiscal-config.aggregate';
import { SearchParams, SearchParamsConstructorProps } from '../../../shared/domain/repository/search-params';
import { SearchResult } from '../../../shared/domain/repository/search-result';

export type FiscalConfigFilter = {
  store_id?: string;
  config_type?: FiscalConfigType;
  is_active?: boolean;
  config_name?: string;
};

export class FiscalConfigSearchParams extends SearchParams<FiscalConfigFilter> {
  static create(props: SearchParamsConstructorProps<FiscalConfigFilter> = {}): FiscalConfigSearchParams {
    return new FiscalConfigSearchParams(props);
  }

  get filter(): FiscalConfigFilter | null {
    return this._filter;
  }

  protected set filter(value: FiscalConfigFilter | null) {
    const _value =
      !value || (value as unknown) === '' || typeof value !== 'object'
        ? null
        : value;

    const filter = {
      ...(_value && _value.store_id && { store_id: `${_value.store_id}` }),
      ...(_value && _value.config_type && { config_type: _value.config_type }),
      ...(_value && typeof _value.is_active === 'boolean' && { is_active: _value.is_active }),
      ...(_value && _value.config_name && { config_name: `${_value.config_name}` }),
    };

    this._filter = Object.keys(filter).length === 0 ? null : filter;
  }
}

export class FiscalConfigSearchResult extends SearchResult<FiscalConfig> {}

export interface IFiscalConfigRepository extends ISearchableRepository<
  FiscalConfig,
  FiscalConfigId,
  FiscalConfigFilter,
  FiscalConfigSearchParams,
  FiscalConfigSearchResult
> {
  // Métodos específicos para configurações fiscais
  findByStoreId(storeId: string): Promise<FiscalConfig[]>;
  findActiveByStoreId(storeId: string): Promise<FiscalConfig[]>;
  findByStoreAndType(storeId: string, configType: FiscalConfigType): Promise<FiscalConfig[]>;
  findApplicableConfigs(storeId: string, productData: {
    ncm_code?: string;
    category_id?: string;
    value?: number;
  }): Promise<FiscalConfig[]>;
  findByStoreAndName(storeId: string, configName: string): Promise<FiscalConfig | null>;
}