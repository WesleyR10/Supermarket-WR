import { Sale, PaymentMethod, SaleStatus, SaleItem } from '../sale.aggregate';

// Helpers: custom matcher is loaded via setupFilesAfterEnv (expect-helpers.ts)

describe('Sale Aggregate', () => {
  const makeItem = (product_id: string, quantity: number, unit_price: number, discount_percentage = 0): SaleItem =>
    new SaleItem({ product_id, quantity, unit_price, discount_percentage });

  it('should create a sale with calculated totals and default tax_rate 0', () => {
    const items = [
      { product_id: 'p1', quantity: 2, unit_price: 10, discount_percentage: 0 }, // 20
      { product_id: 'p2', quantity: 1, unit_price: 5, discount_percentage: 0 }, // 5
    ];

    const sale = Sale.create({
      cashier_id: 'cashier-1',
      store_id: 'store-1',
      register_number: 1,
      items,
      payment_method: PaymentMethod.CASH,
      // no discount, no tax_rate -> defaults
    });

    expect(sale.sale_status).toBe(SaleStatus.PENDING);
    expect(sale.total_amount).toBe(25);
    expect(sale.discount_amount).toBe(0);
    expect(sale.tax_rate).toBe(0);
    expect(sale.tax_amount).toBe(0);
    expect(sale.getSubtotalWithDiscount()).toBe(25);
    expect(sale.getFinalTotal()).toBe(25);
  });

  it('should create a sale with discount and tax_rate applied with Money rounding', () => {
    const items = [
      { product_id: 'p1', quantity: 1, unit_price: 19.99, discount_percentage: 0 }, // 19.99
      { product_id: 'p2', quantity: 2, unit_price: 5.05, discount_percentage: 0 },  // 10.10
    ];

    const sale = Sale.create({
      cashier_id: 'cashier-2',
      store_id: 'store-2',
      register_number: 2,
      items,
      payment_method: PaymentMethod.CREDIT_CARD,
      discount_amount: 3.11, // expect Money rounding
      tax_rate: 10, // 10%
    });

    // total items = 19.99 + 10.10 = 30.09
    expect(sale.total_amount).toBeCloseTo(30.09, 2);
    expect(sale.discount_amount).toBe(3.11);
    // tax base = 30.09 - 3.11 = 26.98 => 10% => 2.698 -> Money -> 2.70
    expect(sale.tax_amount).toBe(2.7);
    expect(sale.getSubtotalWithDiscount()).toBe(26.98);
    // final = 30.09 - 3.11 + 2.70 = 29.68
    expect(sale.getFinalTotal()).toBe(29.68);
  });

  it('should add, remove and update items recalculating totals and taxes', () => {
    const sale = Sale.create({
      cashier_id: 'cashier-3',
      store_id: 'store-3',
      register_number: 3,
      items: [{ product_id: 'p1', quantity: 1, unit_price: 10 }], // total 10
      payment_method: PaymentMethod.PIX,
      tax_rate: 15, // to verify tax recalculation
    });

    expect(sale.total_amount).toBe(10);
    expect(sale.tax_amount).toBe(1.5); // 10 * 15%

    // add item p2 => + (2 * 7.50) = +15 => subtotal 25
    sale.addItem({ product_id: 'p2', quantity: 2, unit_price: 7.5 });
    expect(sale.total_amount).toBe(25);
    // tax base = 25 - discount(0) = 25; 15% = 3.75
    expect(sale.tax_amount).toBe(3.75);

    // update quantity of p1 to 3 => p1 total 30 => subtotal becomes 45
    sale.updateItemQuantity('p1', 3);
    expect(sale.total_amount).toBe(45);
    expect(sale.tax_amount).toBe(6.75); // 45 * 15%

    // remove p2 => back to only p1 (3 * 10) = 30
    sale.removeItem('p2');
    expect(sale.total_amount).toBe(30);
    expect(sale.tax_amount).toBe(4.5); // 30 * 15%
  });

  it('should validate and apply discount with bounds and recalculate taxes', () => {
    const sale = Sale.create({
      cashier_id: 'cashier-4',
      store_id: 'store-4',
      register_number: 4,
      items: [ { product_id: 'p1', quantity: 2, unit_price: 12.5 } ], // total 25
      payment_method: PaymentMethod.DEBIT_CARD,
      tax_rate: 8,
    });

    // invalid: negative
    sale.applyDiscount(-1);
    // @ts-ignore - custom matcher from setup
    expect(sale.notification).notificationContainsErrorMessages([
      { discount_amount: ['Discount amount must be positive'] },
    ]);

    // invalid: greater than total
    sale.applyDiscount(30);
    // @ts-ignore - custom matcher from setup
    expect(sale.notification).notificationContainsErrorMessages([
      { discount_amount: [
        'Discount amount must be positive',
        'Discount amount cannot exceed total amount',
      ] },
    ]);

    // valid
    sale.applyDiscount(5.005); // expect Money rounding => 5.01
    expect(sale.discount_amount).toBe(5.01);
    // tax base = 25 - 5.01 = 19.99; 8% => 1.5992 => Money => 1.6
    expect(sale.tax_amount).toBe(1.6);
    expect(sale.getSubtotalWithDiscount()).toBe(19.99);
    expect(sale.getFinalTotal()).toBeCloseTo(21.59, 2); // 25 - 5.01 + 1.6
  });

  it('should validate items on update operations (quantity, unit_price, discount range)', () => {
    const sale = Sale.create({
      cashier_id: 'cashier-5',
      store_id: 'store-5',
      register_number: 5,
      items: [ { product_id: 'p1', quantity: 1, unit_price: 1 } ],
      payment_method: PaymentMethod.CASH,
    });

    // Force invalid items and trigger validation via update
    sale.updateItemQuantity('p1', 0); // <= 0 invalid
    // @ts-ignore - custom matcher from setup
    expect(sale.notification).notificationContainsErrorMessages([
      { items: ['quantity must be greater than 0'] },
    ]);

    // Directly mutate and validate to cover other item rules
    const item = sale.items.find(i => i.product_id === 'p1')!;
    item.updateUnitPrice(0); // invalid unit_price
    item.updateDiscountPercentage(150); // invalid discount
    sale.validate(['items']);
    // @ts-ignore - custom matcher from setup
    expect(sale.notification).notificationContainsErrorMessages([
      { items: [
        'quantity must be greater than 0',
        'unit_price must be greater than 0',
        'discount_percentage must be between 0 and 100',
      ] },
    ]);
  });

  it('should handle status transitions with validations', () => {
    const sale = Sale.create({
      cashier_id: 'cashier-6',
      store_id: 'store-6',
      register_number: 6,
      items: [ { product_id: 'p1', quantity: 1, unit_price: 10 } ],
      payment_method: PaymentMethod.PIX,
    });

    // From pending -> completed
    sale.completeSale();
    expect(sale.sale_status).toBe(SaleStatus.COMPLETED);

    // Cannot complete again
    sale.completeSale();
    // @ts-ignore - custom matcher from setup
    expect(sale.notification).notificationContainsErrorMessages([
      { sale_status: ['Sale can only be completed from pending status'] },
    ]);

    // Cannot cancel from completed
    sale.cancelSale();
    // @ts-ignore - custom matcher from setup
    expect(sale.notification).notificationContainsErrorMessages([
      { sale_status: [
        'Sale can only be completed from pending status',
        'Sale can only be cancelled from pending status',
      ] },
    ]);

    // Refund allowed from completed
    sale.refundSale();
    expect(sale.sale_status).toBe(SaleStatus.REFUNDED);

    // Cannot refund again (not completed anymore)
    sale.refundSale();
    // @ts-ignore - custom matcher from setup
    expect(sale.notification).notificationContainsErrorMessages([
      { sale_status: [
        'Sale can only be completed from pending status',
        'Sale can only be cancelled from pending status',
        'Sale can only be refunded from completed status',
      ] },
    ]);
  });

  it('should set payment method and validate enum', () => {
    const sale = Sale.create({
      cashier_id: 'cashier-7',
      store_id: 'store-7',
      register_number: 7,
      items: [ { product_id: 'p1', quantity: 1, unit_price: 10 } ],
      payment_method: PaymentMethod.CASH,
    });

    sale.setPaymentMethod(PaymentMethod.DEBIT_CARD);
    expect(sale.payment_method).toBe(PaymentMethod.DEBIT_CARD);
  });
});