import { InMemorySearchableRepository } from '../../../../shared/infra/db/in-memory/in-memory.repository';
import { Store, StoreId, StoreStatus } from '../../../domain/store.aggregate';
import {
  IStoreRepository,
  StoreFilter,
  StoreSearchParams,
  StoreSearchResult,
} from '../../../domain/repositories/store.repository.interface';

export class StoreInMemoryRepository
  extends InMemorySearchableRepository<
    Store,
    StoreId,
    StoreFilter,
    StoreSearchParams,
    StoreSearchResult
  >
  implements IStoreRepository
{
  sortableFields: string[] = [
    'name',
    'cnpj',
    'status',
    'created_at',
    'updated_at',
    'plan_type',
  ];

  // Métodos específicos do domínio Store
  async findByCnpj(cnpj: string): Promise<Store | null> {
    const item = this.items.find(item => item.cnpj === cnpj);
    return item || null;
  }

  async findActiveStores(): Promise<Store[]> {
    return this.items.filter(item => item.status === StoreStatus.ACTIVE);
  }

  async findByStatus(status: StoreStatus): Promise<Store[]> {
    return this.items.filter(item => item.status === status);
  }

  async findByPlanType(planType: 'BASIC' | 'PREMIUM' | 'ENTERPRISE'): Promise<Store[]> {
    return this.items.filter(item => item.subscription.plan_type === planType);
  }

  async findTrialStores(): Promise<Store[]> {
    return this.items.filter(item => item.subscription.is_trial === true);
  }

  async findExpiredSubscriptions(): Promise<Store[]> {
    const now = new Date();
    return this.items.filter(item => item.subscription.end_date < now);
  }

  async findStoresWithOverduePayment(): Promise<Store[]> {
    return this.items.filter(item => item.subscription.payment_status === 'OVERDUE');
  }

  async findStoresByLocation(city: string, state?: string): Promise<Store[]> {
    return this.items.filter(item => {
      // Assumindo que a localização está nas configurações ou em outro campo
      // Por enquanto, retornando array vazio pois não temos campo de localização definido
      return false;
    });
  }

  protected async applyFilter(
    items: Store[],
    filter: StoreFilter | null,
  ): Promise<Store[]> {
    if (!filter) {
      return items;
    }

    return items.filter(item => {
      if (filter.name && !item.name.toLowerCase().includes(filter.name.toLowerCase())) {
        return false;
      }

      if (filter.cnpj && !item.cnpj.includes(filter.cnpj)) {
        return false;
      }

      if (filter.status && item.status !== filter.status) {
        return false;
      }

      if (filter.plan_type && item.subscription.plan_type !== filter.plan_type) {
        return false;
      }

      if (filter.is_trial !== undefined && item.subscription.is_trial !== filter.is_trial) {
        return false;
      }

      return true;
    });
  }

  getEntity(): new (...args: any[]) => Store {
    return Store;
  }

  protected applySort(
    items: Store[],
    sort: string | null,
    sort_dir: string | null,
  ): Store[] {
    return sort && this.sortableFields.includes(sort)
      ? super.applySort(items, sort, sort_dir)
      : super.applySort(items, 'created_at', 'desc');
  }
}