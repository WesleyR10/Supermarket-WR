import { ISearchableRepository } from '../../../shared/domain/repository/repository-interface';
import { Sale, SaleId, SaleStatus, PaymentMethod } from '../sale.aggregate';
import { SearchParams } from '../../../shared/domain/repository/search-params';
import { SearchResult } from '../../../shared/domain/repository/search-result';

export type SaleFilter = {
  customer_id?: string;
  store_id?: string;
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
  constructor(props: SearchParams<SaleFilter>) {
    super(props);
  }
}

export class SaleSearchResult extends SearchResult<Sale> {}

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