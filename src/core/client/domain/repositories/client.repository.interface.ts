import { ISearchableRepository } from '../../../shared/domain/repository/repository-interface';
import { Client, ClientId, CustomerType, LoyaltyLevel } from '../client.aggregate';
import { SearchParams } from '../../../shared/domain/repository/search-params';
import { SearchResult } from '../../../shared/domain/repository/search-result';

export type ClientFilter = string;

export class ClientSearchParams extends SearchParams<ClientFilter> {}

export class ClientSearchResult extends SearchResult<Client> {}

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