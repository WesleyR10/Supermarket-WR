import { UpdateSaleUseCase } from '../update-sale.use-case';
import { UpdateSaleInput } from '../update-sale.input';
import { SaleInMemoryRepository } from '../../../../infra/db/in-memory/sale-in-memory.repository';
import { Sale, PaymentMethod, SaleStatus } from '../../../../domain/sale.aggregate';
import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';
import { EntityValidationError } from '../../../../../shared/domain/validators/validation.error';
import { InvalidUuidError } from '../../../../../shared/domain/value-objects/uuid.vo';

describe('UpdateSaleUseCase Unit Tests', () => {
  let useCase: UpdateSaleUseCase;
  let repository: SaleInMemoryRepository;
  let sale: Sale;

  beforeEach(() => {
    repository = new SaleInMemoryRepository();
    useCase = new UpdateSaleUseCase(repository);

    sale = Sale.create({
      store_id: 'store-123',
      cashier_id: 'cashier-456',
      register_number: 1,
      payment_method: PaymentMethod.CASH,
      tax_rate: 18, // para validar cálculo de final_total
      items: [
        { product_id: 'p1', quantity: 2, unit_price: 10.0, discount_percentage: 0 },
        { product_id: 'p2', quantity: 1, unit_price: 20.0, discount_percentage: 0 },
      ],
    });

    repository.items.push(sale);
  });

  it('should update basic fields of a pending sale', async () => {
    const input = new UpdateSaleInput({
      id: sale.sale_id.id,
      store_id: 'store-123',
      customer_id: 'cust-1',
      cashier_id: 'cashier-789',
      register_number: 2,
      payment_method: PaymentMethod.CREDIT_CARD,
      discount_amount: 5.0,
    });

    const output = await useCase.execute(input);

    expect(output.customer_id).toBe('cust-1');
    expect(output.cashier_id).toBe('cashier-789');
    expect(output.register_number).toBe(2);
    // payment_method no output é o valor do enum (minúsculo)
    expect(output.payment_method).toBe('credit_card');
    expect(output.discount_amount).toBe(5.0);

    // Totais devem considerar desconto e imposto
    const expectedSubtotalWithDiscount = sale.getSubtotalWithDiscount();
    const expectedFinalTotal = sale.getFinalTotal();
    expect(output.subtotal_with_discount).toBe(expectedSubtotalWithDiscount);
    expect(output.final_total).toBe(expectedFinalTotal);
  });

  it('should add a new item when product does not exist', async () => {
    const input = new UpdateSaleInput({
      id: sale.sale_id.id,
      store_id: 'store-123',
      items: [
        { product_id: 'p3', quantity: 3, unit_price: 5.0, discount_percentage: 10 },
      ],
    });

    const output = await useCase.execute(input);

    expect(output.items).toHaveLength(3);
    const added = output.items.find((i) => i.product_id === 'p3')!;
    expect(added).toMatchObject({ quantity: 3, unit_price: 5.0, discount_percentage: 10 });
    // total_price = 3*5 * (1 - 0.10) = 13.5
    expect(added.total_price).toBe(13.5);
  });

  it('should update quantity of an existing item', async () => {
    const input = new UpdateSaleInput({
      id: sale.sale_id.id,
      store_id: 'store-123',
      items: [{ product_id: 'p1', quantity: 5 }],
    });

    const output = await useCase.execute(input);

    const updated = output.items.find((i) => i.product_id === 'p1')!;
    expect(updated.quantity).toBe(5);
    expect(updated.total_price).toBe(50); // 5 * 10
  });

  it('should update unit_price and discount_percentage and force totals recalculation (without quantity patch)', async () => {
    const input = new UpdateSaleInput({
      id: sale.sale_id.id,
      store_id: 'store-123',
      items: [{ product_id: 'p2', unit_price: 25.0, discount_percentage: 20 }],
    });

    const output = await useCase.execute(input);

    const updated = output.items.find((i) => i.product_id === 'p2')!;
    // quantidade permanece 1, novo preço 25 com 20% de desconto => 20
    expect(updated.quantity).toBe(1);
    expect(updated.unit_price).toBe(25.0);
    expect(updated.discount_percentage).toBe(20);
    expect(updated.total_price).toBe(20.0);

    // Verifica se totais da venda foram recalculados (usa tax_rate 18%)
    // p1 (2*10)=20 + p2 (1*25 com 20% = 20) => total_amount = 40
    expect(output.total_amount).toBeCloseTo(40.0, 2);
    expect(output.final_total).toBeCloseTo(output.subtotal_with_discount + output.tax_amount, 2);
  });

  it('should throw InvalidUuidError when id is invalid', async () => {
    const input = new UpdateSaleInput({ id: 'invalid-uuid', store_id: 'store-123' });
    await expect(useCase.execute(input)).rejects.toThrow(InvalidUuidError);
  });

  it('should throw NotFoundError when sale does not exist', async () => {
    const validId = '550e8400-e29b-41d4-a716-446655440000';
    const input = new UpdateSaleInput({ id: validId, store_id: 'store-123' });
    await expect(useCase.execute(input)).rejects.toThrow(NotFoundError);
  });

  it('should throw EntityValidationError when updating a non-pending sale', async () => {
    sale.completeSale();
    await repository.update(sale);

    const input = new UpdateSaleInput({ id: sale.sale_id.id, store_id: 'store-123', cashier_id: 'any' });
    await expect(useCase.execute(input)).rejects.toThrow(EntityValidationError);
  });

  it('should throw EntityValidationError when store_id does not match sale.store_id', async () => {
    const input = new UpdateSaleInput({ id: sale.sale_id.id, store_id: 'another-store' });
    await expect(useCase.execute(input)).rejects.toThrow(EntityValidationError);
  });
});