import { ISearchableRepository } from '../../../shared/domain/repository/repository-interface';
import { Sale, SaleId, SaleStatus, PaymentMethod } from '../sale.aggregate';
import { SearchParams, SearchParamsConstructorProps } from '../../../shared/domain/repository/search-params';
import { SearchResult } from '../../../shared/domain/repository/search-result';

export type SaleFilter = {
  store_id?: string;
  customer_id?: string;
  cashier_id?: string;
  status?: SaleStatus;
  payment_method?: PaymentMethod;
  register_number?: number;
  date_from?: Date;
  date_to?: Date;
  total_min?: number;
  total_max?: number;
};

export class SaleSearchParams extends SearchParams<SaleFilter> {
  static create(props: SearchParamsConstructorProps<SaleFilter>): SaleSearchParams {
    // store_id é obrigatório para isolamento multi-tenant
    if (!props.filter?.store_id) {
      throw new Error('store_id is required for sale search to ensure multi-tenant isolation');
    }
    return new SaleSearchParams(props);
  }

  get filter(): SaleFilter | null {
    return this._filter;
  }

  protected set filter(value: SaleFilter | null) {
    const _value =
      !value || (value as unknown) === '' || typeof value !== 'object'
        ? null
        : value;

    if (!_value || !_value.store_id) {
      throw new Error('store_id is required for sale filter to ensure multi-tenant isolation');
    }

    const filter = {
      store_id: `${_value.store_id}`,
      ...(_value && _value.customer_id && { customer_id: `${_value.customer_id}` }),
      ...(_value && _value.cashier_id && { cashier_id: `${_value.cashier_id}` }),
      ...(_value && _value.status && { status: _value.status }),
      ...(_value && _value.payment_method && { payment_method: _value.payment_method }),
      ...(_value && _value.register_number !== undefined && { register_number: _value.register_number }),
      ...(_value && _value.date_from && { date_from: _value.date_from }),
      ...(_value && _value.date_to && { date_to: _value.date_to }),
      ...(_value && _value.total_min !== undefined && { total_min: _value.total_min }),
      ...(_value && _value.total_max !== undefined && { total_max: _value.total_max }),
    };

    this._filter = Object.keys(filter).length === 0 ? null : filter;
  }
}

export class SaleSearchResult extends SearchResult<Sale> {
  constructor(props: SearchResult<Sale>) {
    super(props);
  }
}

export interface ISaleRepository extends ISearchableRepository<
  Sale,
  SaleId,
  SaleFilter,
  SaleSearchParams,
  SaleSearchResult
> {
  // Métodos específicos para supermercado
  findByCustomerId(customerId: string): Promise<Sale[]>; // Retorna todas as compras de um cliente
  findByStoreId(storeId: string): Promise<Sale[]>; // Retorna todas as compras de um supermercado
  findByCashierId(cashierId: string): Promise<Sale[]>; // Retorna todas as compras de um caixa
  findByStatus(status: SaleStatus): Promise<Sale[]>; // Retorna todas as compras de um status
  findByRegisterNumber(storeId: string, registerNumber: number): Promise<Sale[]>; // Retorna todas as compras de um número de registro
  findByDateRange(dateFrom: Date, dateTo: Date): Promise<Sale[]>; // Retorna todas as compras de um período de tempo
  findDailySales(storeId: string, date: Date): Promise<Sale[]>; // Retorna todas as compras de um dia
  findPendingSales(storeId: string): Promise<Sale[]>; // Retorna todas as compras pendentes de um supermercado
  getTotalSalesByPeriod(storeId: string, dateFrom: Date, dateTo: Date): Promise<number>; // Retorna o total de vendas de um período de tempo
  getAverageSaleValue(storeId: string, dateFrom: Date, dateTo: Date): Promise<number>; // Retorna o valor médio de vendas de um período de tempo
}