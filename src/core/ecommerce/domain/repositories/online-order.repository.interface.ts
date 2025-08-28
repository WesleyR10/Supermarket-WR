import { ISearchableRepository } from '../../../shared/domain/repository/repository-interface';
import { SearchParams, SearchParamsConstructorProps } from '../../../shared/domain/repository/search-params';
import { SearchResult } from '../../../shared/domain/repository/search-result';
import { OnlineOrder, OnlineOrderId, OrderStatus } from '../online-order.aggregate';

// Filtro agora inclui store_id como obrigatório para isolamento multi-tenant
export type OnlineOrderFilter = {
  store_id?: string;
  client_id?: string;
  status?: OrderStatus;
  delivery_date_from?: Date;
  delivery_date_to?: Date;
  total_min?: number;
  total_max?: number;
};

export class OnlineOrderSearchParams extends SearchParams<OnlineOrderFilter> {
  static create(props: SearchParamsConstructorProps<OnlineOrderFilter>): OnlineOrderSearchParams {
    // store_id é obrigatório
    if (!props.filter?.store_id) {
      throw new Error('store_id is required for online order search to ensure multi-tenant isolation');
    }
    return new OnlineOrderSearchParams(props);
  }

  get filter(): OnlineOrderFilter | null {
    return this._filter;
  }

  protected set filter(value: OnlineOrderFilter | null) {
    const _value =
      !value || (value as unknown) === '' || typeof value !== 'object'
        ? null
        : value;

    if (!_value || !_value.store_id) {
      throw new Error('store_id is required for online order filter to ensure multi-tenant isolation');
    }

    const filter = {
      store_id: `${_value.store_id}`,
      ...(_value && _value.client_id && { client_id: `${_value.client_id}` }),
      ...(_value && _value.status && { status: _value.status }),
      ...(_value && _value.delivery_date_from && { delivery_date_from: _value.delivery_date_from }),
      ...(_value && _value.delivery_date_to && { delivery_date_to: _value.delivery_date_to }),
      ...(_value && _value.total_min !== undefined && { total_min: _value.total_min }),
      ...(_value && _value.total_max !== undefined && { total_max: _value.total_max }),
    };

    this._filter = Object.keys(filter).length === 0 ? null : filter;
  }
}

export class OnlineOrderSearchResult extends SearchResult<OnlineOrder> {}

export interface IOnlineOrderRepository extends ISearchableRepository<
  OnlineOrder,
  OnlineOrderId,
  OnlineOrderFilter,
  OnlineOrderSearchParams,
  OnlineOrderSearchResult
> {
  // Métodos específicos do domínio de e-commerce
  findByClientId(storeId: string, clientId: string): Promise<OnlineOrder[]>;
  findByStatus(storeId: string, status: OrderStatus): Promise<OnlineOrder[]>;
  findPendingOrders(storeId: string): Promise<OnlineOrder[]>;
  findOrdersForDelivery(storeId: string): Promise<OnlineOrder[]>;
  findOrdersByDateRange(storeId: string, startDate: Date, endDate: Date): Promise<OnlineOrder[]>;
  findHighValueOrders(storeId: string, minValue: number): Promise<OnlineOrder[]>;
  findRecentOrders(storeId: string, days: number): Promise<OnlineOrder[]>;
  
  // Métodos de agregação
  countByStatus(storeId: string): Promise<{ status: OrderStatus; count: number }[]>;
  getTotalSalesValue(storeId: string, startDate?: Date, endDate?: Date): Promise<number>;
  getAverageOrderValue(storeId: string): Promise<number>;
  
  // Métodos de verificação
  existsByClientAndDate(storeId: string, clientId: string, date: Date): Promise<boolean>;
  
  // Métodos multi-tenant
  findByStoreId(storeId: string): Promise<OnlineOrder[]>;
  countByStoreId(storeId: string): Promise<number>;
}