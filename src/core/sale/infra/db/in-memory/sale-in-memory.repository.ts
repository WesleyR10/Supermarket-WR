import { InMemorySearchableRepository } from '../../../../shared/infra/db/in-memory/in-memory.repository';
import { Sale, SaleId, SaleStatus } from '../../../domain/sale.aggregate';
import { ISaleRepository, SaleFilter, SaleSearchParams, SaleSearchResult } from '../../../domain/repositories/sale.repository.interface';

export class SaleInMemoryRepository
  extends InMemorySearchableRepository<
    Sale,
    SaleId,
    SaleFilter,
    SaleSearchParams,
    SaleSearchResult
  >
  implements ISaleRepository
{
  sortableFields: string[] = [
    'total_amount',
    'sale_date',
    'created_at',
    'register_number',
    'customer_id',
    'cashier_id'
  ];

  async findByCustomerId(customerId: string): Promise<Sale[]> {
    return this.items.filter(item => item.customer_id === customerId);
  }

  async findByStoreId(storeId: string): Promise<Sale[]> {
    return this.items.filter(item => item.store_id === storeId);
  }

  async findByCashierId(cashierId: string): Promise<Sale[]> {
    return this.items.filter(item => item.cashier_id === cashierId);
  }

  async findByStatus(status: SaleStatus): Promise<Sale[]> {
    return this.items.filter(item => item.sale_status === status);
  }

  async findByRegisterNumber(storeId: string, registerNumber: number): Promise<Sale[]> {
    return this.items.filter(item => 
      item.store_id === storeId && item.register_number === registerNumber
    );
  }

  async findByDateRange(dateFrom: Date, dateTo: Date): Promise<Sale[]> {
    return this.items.filter(item => 
      item.sale_date >= dateFrom && item.sale_date <= dateTo
    );
  }

  async findDailySales(storeId: string, date: Date): Promise<Sale[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return this.items.filter(item => 
      item.store_id === storeId &&
      item.sale_date >= startOfDay &&
      item.sale_date <= endOfDay
    );
  }

  async findPendingSales(storeId: string): Promise<Sale[]> {
    return this.items.filter(item => 
      item.store_id === storeId && item.sale_status === SaleStatus.PENDING
    );
  }

  async getTotalSalesByPeriod(storeId: string, dateFrom: Date, dateTo: Date): Promise<number> {
    const sales = await this.findByDateRange(dateFrom, dateTo);
    const storeSales = sales.filter(sale => sale.store_id === storeId);
    return storeSales.reduce((total, sale) => total + sale.total_amount, 0);
  }

  async getAverageSaleValue(storeId: string, dateFrom: Date, dateTo: Date): Promise<number> {
    const sales = await this.findByDateRange(dateFrom, dateTo);
    const storeSales = sales.filter(sale => sale.store_id === storeId);
    if (storeSales.length === 0) return 0;
    const total = storeSales.reduce((sum, sale) => sum + sale.total_amount, 0);
    return total / storeSales.length;
  }

  protected async applyFilter(items: Sale[], filter: SaleFilter | null): Promise<Sale[]> {
    if (!filter) return items;

    return items.filter(item => {
      return (
        (!filter.customer_id || item.customer_id === filter.customer_id) &&
        (!filter.store_id || item.store_id === filter.store_id) &&
        (!filter.cashier_id || item.cashier_id === filter.cashier_id) &&
        (!filter.status || item.sale_status === filter.status) &&
        (!filter.payment_method || item.payment_method === filter.payment_method) &&
        (!filter.register_number || item.register_number === filter.register_number) &&
        (!filter.date_from || item.sale_date >= filter.date_from) &&
        (!filter.date_to || item.sale_date <= filter.date_to) &&
        (!filter.total_min || item.total_amount >= filter.total_min) &&
        (!filter.total_max || item.total_amount <= filter.total_max)
      );
    });
  }

  getEntity(): new (...args: any[]) => Sale {
    return Sale;
  }
}