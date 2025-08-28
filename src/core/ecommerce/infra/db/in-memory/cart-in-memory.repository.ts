import { InMemorySearchableRepository } from '../../../../shared/infra/db/in-memory/in-memory.repository';
import { Cart, CartId, CartStatus } from '../../../domain/cart.aggregate';
import {
  CartFilter,
  CartSearchParams,
  CartSearchResult,
  ICartRepository,
} from '../../../domain/repositories/cart.repository.interface';
import { Uuid } from '../../../../shared/domain/value-objects/uuid.vo';

export class CartInMemoryRepository
  extends InMemorySearchableRepository<
    Cart,
    CartId,
    CartFilter,
    CartSearchParams,
    CartSearchResult
  >
  implements ICartRepository
{
  sortableFields: string[] = ['created_at', 'updated_at', 'expires_at'];

  async findByClientAndStore(client_id: Uuid, store_id: string): Promise<Cart | null> {
    const cart = this.items.find(
      (item) => 
        item.client_id.equals(client_id) && 
        item.store_id === store_id
    );
    return cart || null;
  }

  async findActiveByClient(client_id: Uuid, store_id: string): Promise<Cart | null> {
    const cart = this.items.find(
      (item) => 
        item.client_id.equals(client_id) && 
        item.store_id === store_id &&
        item.status === CartStatus.ACTIVE
    );
    return cart || null;
  }

  async findExpiredCarts(expiry_date: Date, limit?: number): Promise<Cart[]> {
    const expiredCarts = this.items.filter(
      (item) => 
        item.expires_at < expiry_date &&
        item.status === CartStatus.ACTIVE
    );
    
    return limit ? expiredCarts.slice(0, limit) : expiredCarts;
  }

  async countByStatus(store_id: string, status: CartStatus): Promise<number> {
    return this.items.filter(
      (item) => 
        item.store_id === store_id &&
        item.status === status
    ).length;
  }

  protected async applyFilter(
    items: Cart[],
    filter: CartFilter | null,
  ): Promise<Cart[]> {
    if (!filter) {
      return items;
    }

    return items.filter((item) => {
      const matchesStoreId = filter.store_id ? item.store_id === filter.store_id : true;
      const matchesClientId = filter.client_id ? item.client_id.equals(filter.client_id) : true;
      const matchesStatus = filter.status ? item.status === filter.status : true;
      const matchesExpiresBefore = filter.expires_before ? item.expires_at <= filter.expires_before : true;
      const matchesExpiresAfter = filter.expires_after ? item.expires_at >= filter.expires_after : true;

      return matchesStoreId && matchesClientId && matchesStatus && matchesExpiresBefore && matchesExpiresAfter;
    });
  }

  protected applySort(
    items: Cart[],
    sort: string | null,
    sort_dir: string | null,
  ): Cart[] {
    return !sort
      ? super.applySort(items, 'created_at', 'desc')
      : super.applySort(items, sort, sort_dir);
  }

  getEntity(): new (...args: any[]) => Cart {
    return Cart;
  }


}