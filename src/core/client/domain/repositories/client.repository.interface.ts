import { ISearchableRepository } from '../../../shared/domain/repository/repository-interface';
import { Client, ClientId, CustomerType, LoyaltyLevel } from '../client.aggregate';
import { SearchParams, SearchParamsConstructorProps } from '../../../shared/domain/repository/search-params';
import { SearchResult } from '../../../shared/domain/repository/search-result';

export type ClientFilter = {
  store_id?: string;
  filter?: string;
  customer_type?: CustomerType;
  loyalty_level?: LoyaltyLevel;
  is_active?: boolean;
};

export class ClientSearchParams extends SearchParams<ClientFilter> {
  static create(props: SearchParamsConstructorProps<ClientFilter>): ClientSearchParams {
    // store_id é obrigatório para isolamento multi-tenant
    if (!props.filter?.store_id) {
      throw new Error('store_id is required for client search to ensure multi-tenant isolation');
    }
    return new ClientSearchParams(props);
  }

  get filter(): ClientFilter | null {
    return this._filter;
  }

  protected set filter(value: ClientFilter | null) {
    const _value =
      !value || (value as unknown) === '' || typeof value !== 'object'
        ? null
        : value;

    if (!_value || !_value.store_id) {
      throw new Error('store_id is required for client filter to ensure multi-tenant isolation');
    }

    const filter = {
      store_id: `${_value.store_id}`,
      ...(_value && _value.filter && { filter: `${_value.filter}` }),
      ...(_value && _value.customer_type && { customer_type: _value.customer_type }),
      ...(_value && _value.loyalty_level && { loyalty_level: _value.loyalty_level }),
      ...(_value && _value.is_active !== undefined && { is_active: _value.is_active }),
    };

    this._filter = Object.keys(filter).length === 0 ? null : filter;
  }
}

export class ClientSearchResult extends SearchResult<Client> {
  constructor(props: SearchResult<Client>) {
    super(props);
  }
}

export interface IClientRepository extends ISearchableRepository<
  Client,
  ClientId,
  ClientFilter,
  ClientSearchParams,
  ClientSearchResult
> {
  // Métodos específicos para supermercado
  findActiveClients(): Promise<Client[]>; // Busca todos os clientes ativos
  findByStoreId(storeId: string): Promise<Client[]>; // Busca todos os clientes por loja
  findByUserId(userId: string): Promise<Client[]>; // Busca um cliente por usuário
  findByUserIdAndStoreId(userId: string, storeId: string): Promise<Client | null>; // Busca um cliente por usuário e loja
  findByLoyaltyLevel(loyaltyLevel: LoyaltyLevel): Promise<Client[]>; // Busca todos os clientes por nível de fidelidade
  findByCustomerType(customerType: CustomerType): Promise<Client[]>; // Busca todos os clientes por tipo de cliente
  findVipClients(): Promise<Client[]>; // Busca todos os clientes VIP
  findHighValueClients(): Promise<Client[]>; // Busca todos os clientes de alto valor
  findAtRiskClients(): Promise<Client[]>; // Busca todos os clientes em risco
  findClientsWithCreditLimit(): Promise<Client[]>; // Busca todos os clientes com limite de crédito
  findByLoyaltyCardNumber(cardNumber: string): Promise<Client | null>; // Busca um cliente por número de cartão de fidelidade
  findClientsForPromotions(): Promise<Client[]>; // Busca todos os clientes para promoções
  findClientsBySpendingRange(minSpending: number, maxSpending: number): Promise<Client[]>; // Busca todos os clientes por faixa de gastos
}