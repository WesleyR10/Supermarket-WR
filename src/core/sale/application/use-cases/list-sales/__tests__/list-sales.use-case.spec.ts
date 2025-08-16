import { Sale, SaleStatus, PaymentMethod } from '../../../../domain/sale.aggregate';
import { SaleInMemoryRepository } from '../../../../infra/db/in-memory/sale-in-memory.repository';
import { ListSalesUseCase } from '../list-sales.use-case';

describe('ListSalesUseCase Unit Tests', () => {
  let useCase: ListSalesUseCase;
  let repository: SaleInMemoryRepository;

  beforeEach(() => {
    repository = new SaleInMemoryRepository();
    useCase = new ListSalesUseCase(repository);
  });

  it('should return empty list when no sales exist', async () => {
    const output = await useCase.execute({ filter: { store_id: 'store-1' } });

    expect(output).toStrictEqual({
      items: [],
      total: 0,
      current_page: 1,
      per_page: 15,
      last_page: 0,
    });
  });

  it('should return paginated sales filtered by store', async () => {
    const sales = [
      Sale.fake().aSale().withStoreId('store-1').build() as Sale,
      Sale.fake().aSale().withStoreId('store-1').build() as Sale,
      Sale.fake().aSale().withStoreId('store-2').build() as Sale,
    ];

    for (const sale of sales) {
      await repository.insert(sale);
    }

    const output = await useCase.execute({
      page: 1,
      per_page: 2,
      filter: { store_id: 'store-1' },
    });

    expect(output.items).toHaveLength(2);
    expect(output.total).toBe(2);
    expect(output.current_page).toBe(1);
    expect(output.per_page).toBe(2);
    expect(output.last_page).toBe(1);
  });

  it('should map sale output with computed fields', async () => {
    const sale = Sale.fake().aSale().withStoreId('store-1').build() as Sale;
    await repository.insert(sale);

    const output = await useCase.execute({ filter: { store_id: 'store-1' } });
    const first = output.items[0];

    expect(first.subtotal_with_discount).toBe(sale.getSubtotalWithDiscount());
    expect(first.final_total).toBe(sale.getFinalTotal());
    expect(first.id).toBe(sale.sale_id.id);
  });

  // Filtros adicionais
  it('should filter by customer_id within store', async () => {
    const sales = [
      Sale.fake().aSale().withStoreId('store-1').withCustomerId('customer-1').build() as Sale,
      Sale.fake().aSale().withStoreId('store-1').withCustomerId('customer-2').build() as Sale,
      Sale.fake().aSale().withStoreId('store-2').withCustomerId('customer-1').build() as Sale,
    ];

    for (const sale of sales) await repository.insert(sale);

    const output = await useCase.execute({ filter: { store_id: 'store-1', customer_id: 'customer-1' } });

    expect(output.items).toHaveLength(1);
    expect(output.items[0].customer_id).toBe('customer-1');
  });

  it('should filter by cashier_id within store', async () => {
    const sales = [
      Sale.fake().aSale().withStoreId('store-1').withCashierId('cashier-1').build() as Sale,
      Sale.fake().aSale().withStoreId('store-1').withCashierId('cashier-2').build() as Sale,
      Sale.fake().aSale().withStoreId('store-2').withCashierId('cashier-1').build() as Sale,
    ];

    for (const sale of sales) await repository.insert(sale);

    const output = await useCase.execute({ filter: { store_id: 'store-1', cashier_id: 'cashier-1' } });

    expect(output.items).toHaveLength(1);
    expect(output.items[0].cashier_id).toBe('cashier-1');
  });

  it('should filter by sale status', async () => {
    const sales = [
      Sale.fake().aSale().withStoreId('store-1').withSaleStatus(SaleStatus.COMPLETED).build() as Sale,
      Sale.fake().aSale().withStoreId('store-1').withSaleStatus(SaleStatus.PENDING).build() as Sale,
    ];

    for (const sale of sales) await repository.insert(sale);

    const output = await useCase.execute({ filter: { store_id: 'store-1', status: SaleStatus.PENDING } });

    expect(output.items).toHaveLength(1);
    expect(output.items[0].sale_status).toBe(SaleStatus.PENDING);
  });

  it('should filter by payment method', async () => {
    const sales = [
      Sale.fake().aSale().withStoreId('store-1').withPaymentMethod(PaymentMethod.CASH).build() as Sale,
      Sale.fake().aSale().withStoreId('store-1').withPaymentMethod(PaymentMethod.CREDIT_CARD).build() as Sale,
    ];

    for (const sale of sales) await repository.insert(sale);

    const output = await useCase.execute({ filter: { store_id: 'store-1', payment_method: PaymentMethod.CASH } });

    expect(output.items).toHaveLength(1);
    expect(output.items[0].payment_method).toBe(PaymentMethod.CASH);
  });

  it('should filter by register_number', async () => {
    const sales = [
      Sale.fake().aSale().withStoreId('store-1').withRegisterNumber(1).withTotalAmount(100).build() as Sale,
      Sale.fake().aSale().withStoreId('store-1').withRegisterNumber(2).withTotalAmount(120).build() as Sale,
    ];

    for (const sale of sales) await repository.insert(sale);

    const output = await useCase.execute({ filter: { store_id: 'store-1', register_number: 2 } });

    expect(output.items).toHaveLength(1);
    expect(output.items[0].register_number).toBe(2);
  });

  it('should filter by sale_date range', async () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sales = [
      Sale.fake().aSale().withStoreId('store-1').withSaleDate(yesterday).withTotalAmount(100).build() as Sale,
      Sale.fake().aSale().withStoreId('store-1').withSaleDate(today).withTotalAmount(100).build() as Sale,
      Sale.fake().aSale().withStoreId('store-1').withSaleDate(tomorrow).withTotalAmount(100).build() as Sale,
    ];

    for (const sale of sales) await repository.insert(sale);

    const startOfToday = new Date(today); startOfToday.setHours(0,0,0,0);
    const endOfToday = new Date(today); endOfToday.setHours(23,59,59,999);

    const output = await useCase.execute({ filter: { store_id: 'store-1', date_from: startOfToday, date_to: endOfToday } });

    expect(output.items).toHaveLength(1);
    expect(new Date(output.items[0].sale_date).getDate()).toBe(today.getDate());
  });

  it('should filter by total amount range', async () => {
    const sales = [
      Sale.fake().aSale().withStoreId('store-1').withTotalAmount(50).build() as Sale,
      Sale.fake().aSale().withStoreId('store-1').withTotalAmount(100).build() as Sale,
      Sale.fake().aSale().withStoreId('store-1').withTotalAmount(200).build() as Sale,
    ];

    for (const sale of sales) await repository.insert(sale);

    const output = await useCase.execute({ filter: { store_id: 'store-1', total_min: 60, total_max: 150 } });

    expect(output.items).toHaveLength(1);
    expect(output.items[0].total_amount).toBe(100);
  });

  // Ordenação
  it('should sort by total_amount desc within store', async () => {
    const sales = [
      Sale.fake().aSale().withStoreId('store-1').withTotalAmount(100).build() as Sale,
      Sale.fake().aSale().withStoreId('store-1').withTotalAmount(50).build() as Sale,
      Sale.fake().aSale().withStoreId('store-1').withTotalAmount(200).build() as Sale,
    ];

    for (const sale of sales) await repository.insert(sale);

    const output = await useCase.execute({ filter: { store_id: 'store-1' }, sort: 'total_amount', sort_dir: 'desc' });

    const totals = output.items.map(i => i.total_amount);
    expect(totals).toEqual([200, 100, 50]);
  });

  it('should sort by sale_date asc within store', async () => {
    const d1 = new Date('2024-01-01T10:00:00Z');
    const d2 = new Date('2024-01-02T10:00:00Z');
    const d3 = new Date('2024-01-03T10:00:00Z');

    const sales = [
      Sale.fake().aSale().withStoreId('store-1').withSaleDate(d2).withTotalAmount(100).build() as Sale,
      Sale.fake().aSale().withStoreId('store-1').withSaleDate(d3).withTotalAmount(100).build() as Sale,
      Sale.fake().aSale().withStoreId('store-1').withSaleDate(d1).withTotalAmount(100).build() as Sale,
    ];

    for (const sale of sales) await repository.insert(sale);

    const output = await useCase.execute({ filter: { store_id: 'store-1' }, sort: 'sale_date', sort_dir: 'asc' });

    const dates = output.items.map(i => new Date(i.sale_date).toISOString());
    expect(dates).toEqual([d1.toISOString(), d2.toISOString(), d3.toISOString()]);
  });

  it('should sort by register_number asc within store', async () => {
    const sales = [
      Sale.fake().aSale().withStoreId('store-1').withRegisterNumber(3).withTotalAmount(110).build() as Sale,
      Sale.fake().aSale().withStoreId('store-1').withRegisterNumber(1).withTotalAmount(120).build() as Sale,
      Sale.fake().aSale().withStoreId('store-1').withRegisterNumber(2).withTotalAmount(130).build() as Sale,
    ];

    for (const sale of sales) await repository.insert(sale);

    const output = await useCase.execute({ filter: { store_id: 'store-1' }, sort: 'register_number', sort_dir: 'asc' });

    const regs = output.items.map(i => i.register_number);
    expect(regs).toEqual([1, 2, 3]);
  });
});