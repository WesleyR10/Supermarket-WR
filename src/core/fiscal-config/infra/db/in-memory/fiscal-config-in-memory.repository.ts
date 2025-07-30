import { InMemorySearchableRepository } from '../../../../shared/infra/db/in-memory/in-memory.repository';
import { FiscalConfig, FiscalConfigId, FiscalConfigType } from '../../../domain/fiscal-config.aggregate';
import {
  IFiscalConfigRepository,
  FiscalConfigFilter,
  FiscalConfigSearchParams,
  FiscalConfigSearchResult,
} from '../../../domain/repositories/fiscal-config.repository.interface';

export class FiscalConfigInMemoryRepository
  extends InMemorySearchableRepository<
    FiscalConfig,
    FiscalConfigId,
    FiscalConfigFilter,
    FiscalConfigSearchParams,
    FiscalConfigSearchResult
  >
  implements IFiscalConfigRepository
{
  sortableFields: string[] = [
    'config_name',
    'config_type',
    'created_at',
    'updated_at',
    'is_active',
    'priority'
  ];

  // Métodos específicos do domínio FiscalConfig
  async findByStoreId(storeId: string): Promise<FiscalConfig[]> {
    return this.items.filter(item => item.store_id === storeId);
  }

  async findActiveByStoreId(storeId: string): Promise<FiscalConfig[]> {
    return this.items.filter(item => 
      item.store_id === storeId && item.is_active
    );
  }

  async findByStoreAndType(
    storeId: string, 
    configType: FiscalConfigType
  ): Promise<FiscalConfig[]> {
    return this.items.filter(item => 
      item.store_id === storeId && item.config_type === configType
    );
  }

  async findApplicableConfigs(
    storeId: string, 
    productData: {
      ncm_code?: string;
      category_id?: string;
      value?: number;
    }
  ): Promise<FiscalConfig[]> {
    return this.items.filter(item => {
      if (item.store_id !== storeId || !item.is_active) {
        return false;
      }

      // Usar o método appliesTo da própria entidade
      return item.appliesTo(productData);
    });
  }

  async findByStoreAndName(
    storeId: string, 
    configName: string
  ): Promise<FiscalConfig | null> {
    const item = this.items.find(item => 
      item.store_id === storeId && item.config_name === configName
    );
    return item || null;
  }

  protected async applyFilter(
    items: FiscalConfig[],
    filter: FiscalConfigFilter | null,
  ): Promise<FiscalConfig[]> {
    if (!filter) {
      return items;
    }

    return items.filter((item) => {
      // Filtro por store_id
      if (filter.store_id && item.store_id !== filter.store_id) {
        return false;
      }

      // Filtro por config_type
      if (filter.config_type && item.config_type !== filter.config_type) {
        return false;
      }

      // Filtro por is_active
      if (typeof filter.is_active === 'boolean' && item.is_active !== filter.is_active) {
        return false;
      }

      // Filtro por config_name (busca parcial, case insensitive)
      if (filter.config_name && !item.config_name.toLowerCase().includes(filter.config_name.toLowerCase())) {
        return false;
      }

      return true;
    });
  }

  protected applySort(
    items: FiscalConfig[],
    sort: string | null,
    sort_dir: string | null,
  ): FiscalConfig[] {
    if (!sort || !this.sortableFields.includes(sort)) {
      return items;
    }

    const sortedItems = [...items];
    return sortedItems.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sort) {
        case 'config_name':
          aValue = a.config_name;
          bValue = b.config_name;
          break;
        case 'config_type':
          aValue = a.config_type;
          bValue = b.config_type;
          break;
        case 'created_at':
          aValue = a.created_at;
          bValue = b.created_at;
          break;
        case 'updated_at':
          aValue = a.updated_at;
          bValue = b.updated_at;
          break;
        case 'is_active':
          aValue = a.is_active ? 1 : 0;
          bValue = b.is_active ? 1 : 0;
          break;
        case 'priority':
          aValue = a.priority;
          bValue = b.priority;
          break;
        default:
          aValue = a[sort as keyof FiscalConfig];
          bValue = b[sort as keyof FiscalConfig];
      }

      if (aValue < bValue) {
        return sort_dir === 'desc' ? 1 : -1;
      }
      if (aValue > bValue) {
        return sort_dir === 'desc' ? -1 : 1;
      }
      return 0;
    });
  }

  getEntity(): new (...args: any[]) => FiscalConfig {
    return FiscalConfig;
  }
}