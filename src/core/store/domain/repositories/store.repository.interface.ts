import { ISearchableRepository } from '../../../shared/domain/repository/repository-interface';
import { SearchParams, SearchParamsConstructorProps } from '../../../shared/domain/repository/search-params';
import { SearchResult } from '../../../shared/domain/repository/search-result';
import { Store, StoreId, StoreStatus } from '../store.aggregate';

export type StoreFilter = {
  name?: string;
  cnpj?: string;
  status?: StoreStatus;
  plan_type?: 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
  is_trial?: boolean;
  city?: string;
  state?: string;
};

export class StoreSearchParams extends SearchParams<StoreFilter> {
  static create(props: SearchParamsConstructorProps<StoreFilter> = {}): StoreSearchParams {
    return new StoreSearchParams(props);
  }

  get filter(): StoreFilter | null {
    return this._filter;
  }

  protected set filter(value: StoreFilter | null) {
    const _value =
      !value || (value as unknown) === '' || typeof value !== 'object'
        ? null
        : value;

    const filter = {
      ...(_value && _value.name && { name: `${_value.name}` }),
      ...(_value && _value.cnpj && { cnpj: `${_value.cnpj}` }),
      ...(_value && _value.status && { status: _value.status }),
      ...(_value && _value.plan_type && { plan_type: _value.plan_type }),
      ...(_value && _value.is_trial !== undefined && { is_trial: _value.is_trial }),
      ...(_value && _value.city && { city: `${_value.city}` }),
      ...(_value && _value.state && { state: `${_value.state}` }),
    };

    this._filter = Object.keys(filter).length === 0 ? null : filter;
  }
}

export class StoreSearchResult extends SearchResult<Store> {}

export interface IStoreRepository
  extends ISearchableRepository<
    Store,
    StoreId,
    StoreFilter,
    StoreSearchParams,
    StoreSearchResult
  > {
  // Métodos específicos do domínio Store
  findByCnpj(cnpj: string): Promise<Store | null>;
  findActiveStores(): Promise<Store[]>;
  findByStatus(status: StoreStatus): Promise<Store[]>;
  findByPlanType(planType: 'BASIC' | 'PREMIUM' | 'ENTERPRISE'): Promise<Store[]>;
  findTrialStores(): Promise<Store[]>;
  findExpiredSubscriptions(): Promise<Store[]>;
  findStoresWithOverduePayment(): Promise<Store[]>;
  findStoresByLocation(city: string, state?: string): Promise<Store[]>;
}