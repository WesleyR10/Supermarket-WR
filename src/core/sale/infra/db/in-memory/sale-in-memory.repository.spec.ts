import { Sale, SaleStatus, PaymentMethod } from '../../../domain/sale.aggregate';
import { SaleInMemoryRepository } from './sale-in-memory.repository';
import { SaleSearchParams } from '../../../domain/repositories/sale.repository.interface';

describe('SaleInMemoryRepository', () => {
  let repository: SaleInMemoryRepository;

  beforeEach(() => {
    repository = new SaleInMemoryRepository();
  });

  describe('Basic repository operations', () => {
    it('should insert a sale', async () => {
      const sale = Sale.fake().aSale().build() as Sale;
      await repository.insert(sale);
      expect(repository.items).toHaveLength(1);
      expect(repository.items[0]).toBe(sale);
    });

    it('should find sale by id', async () => {
      const sale = Sale.fake().aSale().build() as Sale;
      await repository.insert(sale);
      
      const found = await repository.findById(sale.sale_id);
      expect(found).toBe(sale);
    });

    it('should update a sale', async () => {
      const sale = Sale.fake().aSale().build() as Sale;
      await repository.insert(sale);
      
      sale.completeSale();
      await repository.update(sale);
      
      const found = await repository.findById(sale.sale_id);
      expect(found?.sale_status).toBe(SaleStatus.COMPLETED);
    });

    it('should delete a sale', async () => {
      const sale = Sale.fake().aSale().build() as Sale;
      await repository.insert(sale);
      
      await repository.delete(sale.sale_id);
      
      const found = await repository.findById(sale.sale_id);
      expect(found).toBeNull();
    });
  });

  describe('Domain-specific methods', () => {
    beforeEach(async () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const sales = [
        // Define register_number explícito para evitar colisões com 1
        Sale.fake().aSale().withStoreId('store-1').withCustomerId('customer-1').withCashierId('cashier-1').withSaleStatus(SaleStatus.COMPLETED).withSaleDate(today).withTotalAmount(100).withRegisterNumber(10).build() as Sale,
        Sale.fake().aSale().withStoreId('store-1').withCustomerId('customer-2').withCashierId('cashier-1').withSaleStatus(SaleStatus.PENDING).withSaleDate(today).withTotalAmount(50).withRegisterNumber(11).build() as Sale,
        Sale.fake().aSale().withStoreId('store-2').withCustomerId('customer-1').withCashierId('cashier-2').withSaleStatus(SaleStatus.COMPLETED).withSaleDate(yesterday).withTotalAmount(75).withRegisterNumber(12).build() as Sale,
        // Somente esta venda terá register_number = 1 na store-1
        Sale.fake().aSale().withStoreId('store-1').withRegisterNumber(1).withSaleDate(today).withTotalAmount(200).build() as Sale,
      ];
      
      for (const sale of sales) {
        await repository.insert(sale);
      }
    });

    it('should find sales by customer id', async () => {
      const sales = await repository.findByCustomerId('customer-1');
      expect(sales).toHaveLength(2);
      sales.forEach(sale => {
        expect(sale.customer_id).toBe('customer-1');
      });
    });

    it('should find sales by store id', async () => {
      const sales = await repository.findByStoreId('store-1');
      expect(sales).toHaveLength(3);
      sales.forEach(sale => {
        expect(sale.store_id).toBe('store-1');
      });
    });

    it('should find sales by cashier id', async () => {
      const sales = await repository.findByCashierId('cashier-1');
      expect(sales).toHaveLength(2);
      sales.forEach(sale => {
        expect(sale.cashier_id).toBe('cashier-1');
      });
    });

    it('should find sales by status', async () => {
      const sales = await repository.findByStatus(SaleStatus.PENDING);
      expect(sales).toHaveLength(1);
      expect(sales[0].sale_status).toBe(SaleStatus.PENDING);
    });

    it('should find sales by register number', async () => {
      const sales = await repository.findByRegisterNumber('store-1', 1);
      expect(sales).toHaveLength(1);
      expect(sales[0].register_number).toBe(1);
    });

    it('should find daily sales', async () => {
      const today = new Date();
      const sales = await repository.findDailySales('store-1', today);
      expect(sales).toHaveLength(3); // Todas as vendas de hoje da store-1
    });

    it('should find pending sales', async () => {
      const sales = await repository.findPendingSales('store-1');
      expect(sales).toHaveLength(1);
      expect(sales[0].sale_status).toBe(SaleStatus.PENDING);
    });

    it('should calculate total sales by period', async () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const total = await repository.getTotalSalesByPeriod('store-1', yesterday, today);
      expect(total).toBe(350); // 100 + 50 + 200
    });

    it('should calculate average sale value', async () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const average = await repository.getAverageSaleValue('store-1', yesterday, today);
      expect(average).toBeCloseTo(116.67, 2); // (100 + 50 + 200) / 3
    });
  });

  describe('Search functionality', () => {
    beforeEach(async () => {
      const sales = [
        Sale.fake().aSale().withStoreId('store-1').withTotalAmount(100).withPaymentMethod(PaymentMethod.CREDIT_CARD).build() as Sale,
        Sale.fake().aSale().withStoreId('store-1').withTotalAmount(50).withPaymentMethod(PaymentMethod.CASH).build() as Sale,
        Sale.fake().aSale().withStoreId('store-2').withTotalAmount(75).withPaymentMethod(PaymentMethod.DEBIT_CARD).build() as Sale,
      ];
      
      for (const sale of sales) {
        await repository.insert(sale);
      }
    });

    it('should search with store filter', async () => {
      const searchParams = new SaleSearchParams({
        page: 1,
        per_page: 10,
        sort: null,
        sort_dir: null,
        filter: { store_id: 'store-1' }
      });
      
      const result = await repository.search(searchParams);
      expect(result.items).toHaveLength(2);
      result.items.forEach(item => {
        expect(item.store_id).toBe('store-1');
      });
    });

    it('should search with total amount range', async () => {
      const searchParams = new SaleSearchParams({
        page: 1,
        per_page: 10,
        sort: null,
        sort_dir: null,
        filter: { store_id: 'store-1', total_min: 50, total_max: 100 }
      });
      
      const result = await repository.search(searchParams);
      expect(result.items).toHaveLength(2);
      result.items.forEach(item => {
        expect(item.total_amount).toBeGreaterThanOrEqual(50);
        expect(item.total_amount).toBeLessThanOrEqual(100);
      });
    });

    it('should sort by total amount', async () => {
      const searchParams = new SaleSearchParams({
        page: 1,
        per_page: 10,
        sort: 'total_amount',
        sort_dir: 'desc',
        filter: { store_id: 'store-1' }
      });
      
      const result = await repository.search(searchParams);
      expect(result.items[0].total_amount).toBeGreaterThanOrEqual(result.items[1].total_amount);
    });
  });
});