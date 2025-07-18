import { InMemorySearchableRepository } from '../../../../shared/infra/db/in-memory/in-memory.repository';
import { Client, ClientId, CustomerType, LoyaltyLevel } from '../../../domain/client.aggregate';
import {
  IClientRepository,
  ClientFilter,
  ClientSearchParams,
  ClientSearchResult,
} from '../../../domain/repositories/client.repository.interface';

export class ClientInMemoryRepository
  extends InMemorySearchableRepository<
    Client,
    ClientId,
    ClientFilter,
    ClientSearchParams,
    ClientSearchResult
  >
  implements IClientRepository
{
  sortableFields: string[] = [
    'user_id',
    'stores_id',
    'loyalty_points',
    'loyalty_level',
    'customer_type',
    'avg_monthly_spending',
    'total_purchases',
    'last_purchase_date',
    'created_at',
    'is_active',
  ];

  protected async applyFilter(
    items: Client[],
    filter: ClientFilter | null,
  ): Promise<Client[]> {
    if (!filter) {
      return items;
    }

    return items.filter((item) => {
      return (
        item.user_id.toLowerCase().includes(filter.toLowerCase()) ||
        item.stores_id.toLowerCase().includes(filter.toLowerCase()) ||
        (item.loyalty_card_number &&
          item.loyalty_card_number.toLowerCase().includes(filter.toLowerCase())) ||
        (item.notes &&
          item.notes.toLowerCase().includes(filter.toLowerCase())) ||
        (item.registration_source &&
          item.registration_source.toLowerCase().includes(filter.toLowerCase()))
      );
    });
  }

  getEntity(): new (...args: any[]) => Client {
    return Client;
  }

  protected applySort(
    items: Client[],
    sort: string | null,
    sort_dir: 'asc' | 'desc' | null,
  ): Client[] {
    return !sort
      ? super.applySort(items, 'created_at', 'desc')
      : super.applySort(items, sort, sort_dir);
  }

  // Métodos específicos para supermercado
  async findActiveClients(): Promise<Client[]> {
    return this.items.filter((client) => client.is_active);
  }

  async findByStoreId(storeId: string): Promise<Client[]> {
    return this.items.filter((client) => client.stores_id === storeId);
  }

  async findByUserId(userId: string): Promise<Client[]> {
    return this.items.filter((client) => client.user_id === userId);
  }

  async findByUserIdAndStoreId(userId: string, storeId: string): Promise<Client | null> {
    const client = this.items.find(
      (client) => client.user_id === userId && client.stores_id === storeId
    );
    return client || null;
  }

  async findByLoyaltyLevel(loyaltyLevel: LoyaltyLevel): Promise<Client[]> {
    return this.items.filter((client) => client.loyalty_level === loyaltyLevel);
  }

  async findByCustomerType(customerType: CustomerType): Promise<Client[]> {
    return this.items.filter((client) => client.customer_type === customerType);
  }

  async findVipClients(): Promise<Client[]> {
    return this.items.filter((client) => client.isVipClient());
  }

  async findHighValueClients(): Promise<Client[]> {
    return this.items.filter((client) => client.isHighValueClient());
  }

  async findAtRiskClients(): Promise<Client[]> {
    return this.items.filter((client) => client.isAtRiskClient());
  }

  async findClientsWithCreditLimit(): Promise<Client[]> {
    return this.items.filter((client) => client.credit_limit !== null && client.credit_limit > 0);
  }

  async findByLoyaltyCardNumber(cardNumber: string): Promise<Client | null> {
    const client = this.items.find(
      (client) => client.loyalty_card_number === cardNumber
    );
    return client || null;
  }

  async findClientsForPromotions(): Promise<Client[]> {
    return this.items.filter(
      (client) => client.is_active && client.allows_promotions
    );
  }

  async findClientsBySpendingRange(
    minSpending: number,
    maxSpending: number
  ): Promise<Client[]> {
    return this.items.filter(
      (client) =>
        client.avg_monthly_spending !== null &&
        client.avg_monthly_spending >= minSpending &&
        client.avg_monthly_spending <= maxSpending
    );
  }
}