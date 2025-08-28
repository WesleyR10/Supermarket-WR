import { InMemorySearchableRepository } from '../../../../shared/infra/db/in-memory/in-memory.repository';
import { OnlineOrder, OnlineOrderId, OrderStatus } from '../../../domain/online-order.aggregate';
import { IOnlineOrderRepository, OnlineOrderFilter, OnlineOrderSearchParams, OnlineOrderSearchResult } from '../../../domain/repositories/online-order.repository.interface';

export class OnlineOrderInMemoryRepository
  extends InMemorySearchableRepository<
    OnlineOrder,
    OnlineOrderId,
    OnlineOrderFilter,
    OnlineOrderSearchParams,
    OnlineOrderSearchResult
  >
  implements IOnlineOrderRepository
{
  sortableFields: string[] = ['created_at', 'total', 'status', 'estimated_delivery'];

  // Métodos específicos do domínio e-commerce com isolamento por store_id
  async findByClientId(storeId: string, clientId: string): Promise<OnlineOrder[]> {
    return this.items.filter(item => 
      item.client_id.id === clientId && item.store_id === storeId
    );
  }

  async findByStatus(storeId: string, status: OrderStatus): Promise<OnlineOrder[]> {
    return this.items.filter(item => 
      item.status === status && item.store_id === storeId
    );
  }

  async findPendingOrders(storeId: string): Promise<OnlineOrder[]> {
    return this.items.filter(item => 
      item.store_id === storeId && item.status === OrderStatus.PENDING
    );
  }

  async findOrdersByDateRange(storeId: string, startDate: Date, endDate: Date): Promise<OnlineOrder[]> {
    return this.items.filter(item => 
      item.store_id === storeId &&
      item.created_at >= startDate &&
      item.created_at <= endDate
    );
  }

  async findHighValueOrders(storeId: string, minValue: number): Promise<OnlineOrder[]> {
    return this.items.filter(item => 
      item.store_id === storeId && item.total.value >= minValue
    );
  }

  async findOrdersForDelivery(storeId: string): Promise<OnlineOrder[]> {
    return this.items.filter(item => 
      item.store_id === storeId && item.status === OrderStatus.OUT_FOR_DELIVERY
    );
  }

  async findRecentOrders(storeId: string, days: number): Promise<OnlineOrder[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return this.items.filter(item => 
      item.store_id === storeId && item.created_at >= cutoffDate
    );
  }

  // Métodos de agregação
  async countByStatus(storeId: string): Promise<{ status: OrderStatus; count: number; }[]> {
    const statusCounts = new Map<OrderStatus, number>();
    
    // Inicializar todos os status com 0
    Object.values(OrderStatus).forEach(status => {
      statusCounts.set(status, 0);
    });
    
    // Contar pedidos por status
    this.items
      .filter(item => item.store_id === storeId)
      .forEach(item => {
        const currentCount = statusCounts.get(item.status) || 0;
        statusCounts.set(item.status, currentCount + 1);
      });
    
    return Array.from(statusCounts.entries()).map(([status, count]) => ({
      status,
      count
    }));
  }

  async getTotalSalesValue(storeId: string, startDate?: Date, endDate?: Date): Promise<number> {
    let filteredItems = this.items.filter(item => 
      item.store_id === storeId && item.status === OrderStatus.DELIVERED
    );
    
    if (startDate) {
      filteredItems = filteredItems.filter(item => item.created_at >= startDate);
    }
    
    if (endDate) {
      filteredItems = filteredItems.filter(item => item.created_at <= endDate);
    }
    
    return filteredItems.reduce((total, item) => total + item.total.value, 0);
  }

  async getAverageOrderValue(storeId: string): Promise<number> {
    const completedOrders = this.items.filter(item => 
      item.store_id === storeId && item.status === OrderStatus.DELIVERED
    );
    
    if (completedOrders.length === 0) return 0;
    
    const total = completedOrders.reduce((sum, item) => sum + item.total.value, 0);
    return total / completedOrders.length;
  }

  // Métodos de verificação
  async hasOrdersForClient(storeId: string, clientId: string): Promise<boolean> {
    return this.items.some(item => 
      item.store_id === storeId && item.client_id.id === clientId
    );
  }

  async existsByClientAndDate(storeId: string, clientId: string, date: Date): Promise<boolean> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return this.items.some(item => 
      item.store_id === storeId && 
      item.client_id.id === clientId &&
      item.created_at >= startOfDay &&
      item.created_at <= endOfDay
    );
  }

  async canCancelOrder(orderId: OnlineOrderId): Promise<boolean> {
    const order = await this.findById(orderId);
    return order ? [OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(order.status) : false;
  }

  // Métodos multi-tenant
  async findByStoreId(storeId: string): Promise<OnlineOrder[]> {
    return this.items.filter(item => item.store_id === storeId);
  }

  async countByStoreId(storeId: string): Promise<number> {
    return this.items.filter(item => item.store_id === storeId).length;
  }

  protected async applyFilter(
    items: OnlineOrder[],
    filter: OnlineOrderFilter | null,
  ): Promise<OnlineOrder[]> {
    if (!filter) {
      return items;
    }

    return items.filter((item) => {
      // Filtro obrigatório por store_id para isolamento multi-tenant
      if (filter.store_id && item.store_id !== filter.store_id) {
        return false;
      }

      // Filtro por client_id
      if (filter.client_id && item.client_id.id !== filter.client_id) {
        return false;
      }

      // Filtro por status
      if (filter.status && item.status !== filter.status) {
        return false;
      }

      // Filtro por data de entrega (início)
       if (filter.delivery_date_from && item.estimated_delivery && item.estimated_delivery < filter.delivery_date_from) {
         return false;
       }

       // Filtro por data de entrega (fim)
       if (filter.delivery_date_to && item.estimated_delivery && item.estimated_delivery > filter.delivery_date_to) {
         return false;
       }

       // Filtro por valor mínimo
       if (filter.total_min !== undefined && item.total.value < filter.total_min) {
         return false;
       }

       // Filtro por valor máximo
       if (filter.total_max !== undefined && item.total.value > filter.total_max) {
         return false;
       }

      return true;
    });
  }

  protected applySort(
    items: OnlineOrder[],
    sort: string | null,
    sort_dir: string | null,
  ): OnlineOrder[] {
    if (!sort || !this.sortableFields.includes(sort)) {
      return items;
    }

    const sortedItems = [...items];
    return sortedItems.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sort) {
        case 'created_at':
          aValue = a.created_at;
          bValue = b.created_at;
          break;
        case 'total':
           aValue = a.total.value;
           bValue = b.total.value;
           break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'estimated_delivery':
           aValue = a.estimated_delivery ?? new Date(0);
           bValue = b.estimated_delivery ?? new Date(0);
           break;
        default:
          aValue = a[sort as keyof OnlineOrder];
          bValue = b[sort as keyof OnlineOrder];
      }

      if (aValue < bValue) {
        return sort_dir === 'desc' ? 1 : -1;
      }

      if (aValue > bValue) {
        return sort_dir === 'desc' ? -1 : 1;
      }

      // Critério secundário: sempre ordenar por data de criação (mais recente primeiro)
      if (sort !== 'created_at') {
        const dateComparison = b.created_at.getTime() - a.created_at.getTime();
        if (dateComparison !== 0) {
          return dateComparison;
        }
      }

      return 0;
    });
  }

  getEntity(): new (...args: any[]) => OnlineOrder {
    return OnlineOrder;
  }
}
