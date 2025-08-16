import 'reflect-metadata';
import { Sale, PaymentMethod } from '../../../domain/sale.aggregate';
import { SaleOutputMapper } from './sale-output';

describe('SaleOutputMapper Unit Tests', () => {
  it('should convert a sale in output', () => {
    const sale = Sale.create({
      store_id: 'store-789',
      customer_id: 'customer-456',
      cashier_id: 'cashier-123',
      register_number: 1,
      payment_method: PaymentMethod.CREDIT_CARD,
      items: [
        {
          product_id: 'product-001',
          quantity: 2,
          unit_price: 10.50,
          discount_percentage: 0
        },
        {
          product_id: 'product-002',
          quantity: 1,
          unit_price: 25.99,
          discount_percentage: 5
        }
      ],
      discount_amount: 0
    });
    
    const spyToJSON = jest.spyOn(sale, 'toJSON');
    const output = SaleOutputMapper.toOutput(sale);
    
    expect(spyToJSON).toHaveBeenCalled();
    expect(output).toStrictEqual({
      id: sale.sale_id.id,
      customer_id: 'customer-456',
      store_id: 'store-789',
      cashier_id: 'cashier-123',
      total_amount: sale.total_amount,
      discount_amount: 0,
      tax_amount: sale.tax_amount,
      tax_rate: 0,
      subtotal_with_discount: sale.getSubtotalWithDiscount(),
      final_total: sale.getFinalTotal(),
      payment_method: 'credit_card', // Enum em minúsculo
      sale_status: sale.sale_status,
      register_number: 1,
      sale_date: sale.sale_date,
      created_at: sale.created_at,
      updated_at: sale.updated_at,
      items: [
        {
          product_id: 'product-001',
          quantity: 2,
          unit_price: 10.50,
          discount_percentage: 0,
          total_price: 21.00
        },
        {
          product_id: 'product-002',
          quantity: 1,
          unit_price: 25.99,
          discount_percentage: 5,
          total_price: 24.6905 // Valor preciso calculado
        }
      ]
    });
  });

  it('should convert a sale without customer in output', () => {
    const sale = Sale.create({
      store_id: 'store-456',
      cashier_id: 'cashier-789',
      register_number: 2,
      payment_method: PaymentMethod.CASH,
      items: [
        {
          product_id: 'product-003',
          quantity: 3,
          unit_price: 15.49,
          discount_percentage: 10
        }
      ],
      discount_amount: 0
    });
    
    const spyToJSON = jest.spyOn(sale, 'toJSON');
    const output = SaleOutputMapper.toOutput(sale);
    
    expect(spyToJSON).toHaveBeenCalled();
    expect(output).toStrictEqual({
      id: sale.sale_id.id,
      customer_id: null,
      store_id: 'store-456',
      cashier_id: 'cashier-789',
      total_amount: sale.total_amount,
      discount_amount: 0,
      tax_amount: sale.tax_amount,
      tax_rate: 0,
      subtotal_with_discount: sale.getSubtotalWithDiscount(),
      final_total: sale.getFinalTotal(),
      payment_method: 'cash', // Enum em minúsculo
      sale_status: sale.sale_status,
      register_number: 2,
      sale_date: sale.sale_date,
      created_at: sale.created_at,
      updated_at: sale.updated_at,
      items: [
        {
          product_id: 'product-003',
          quantity: 3,
          unit_price: 15.49,
          discount_percentage: 10,
          total_price: 41.823 // Valor preciso calculado
        }
      ]
    });
  });

  it('should convert a sale with multiple items in output', () => {
    const sale = Sale.create({
      store_id: 'store-main',
      customer_id: 'customer-vip',
      cashier_id: 'cashier-senior',
      register_number: 3,
      payment_method: PaymentMethod.PIX,
      items: [
        {
          product_id: 'product-004',
          quantity: 5,
          unit_price: 8.99,
          discount_percentage: 0
        },
        {
          product_id: 'product-005',
          quantity: 2,
          unit_price: 12.50,
          discount_percentage: 0
        },
        {
          product_id: 'product-006',
          quantity: 1,
          unit_price: 45.00,
          discount_percentage: 0
        }
      ],
      discount_amount: 10.00
    });
    
    const spyToJSON = jest.spyOn(sale, 'toJSON');
    const output = SaleOutputMapper.toOutput(sale);
    
    expect(spyToJSON).toHaveBeenCalled();
    expect(output).toStrictEqual({
      id: sale.sale_id.id,
      customer_id: 'customer-vip',
      store_id: 'store-main',
      cashier_id: 'cashier-senior',
      total_amount: sale.total_amount,
      discount_amount: 10.00,
      tax_amount: sale.tax_amount,
      tax_rate: 0,
      subtotal_with_discount: sale.getSubtotalWithDiscount(),
      final_total: sale.getFinalTotal(),
      payment_method: 'pix', // Enum em minúsculo
      sale_status: sale.sale_status,
      register_number: 3,
      sale_date: sale.sale_date,
      created_at: sale.created_at,
      updated_at: sale.updated_at,
      items: [
        {
          product_id: 'product-004',
          quantity: 5,
          unit_price: 8.99,
          discount_percentage: 0,
          total_price: 44.95
        },
        {
          product_id: 'product-005',
          quantity: 2,
          unit_price: 12.50,
          discount_percentage: 0,
          total_price: 25.00
        },
        {
          product_id: 'product-006',
          quantity: 1,
          unit_price: 45.00,
          discount_percentage: 0,
          total_price: 45.00
        }
      ]
    });
  });

  it('should convert a sale with change amount in output', () => {
    const sale = Sale.create({
      store_id: 'store-123',
      customer_id: 'customer-123',
      cashier_id: 'cashier-123',
      register_number: 1,
      payment_method: PaymentMethod.CASH,
      items: [
        {
          product_id: 'product-001',
          quantity: 1,
          unit_price: 10.00,
          discount_percentage: 0
        }
      ],
      discount_amount: 0
    });
    
    // Simular cálculo de troco
    sale.calculateChange(15.00); // Recebido R$ 15,00 para total de R$ 10,00
    
    const spyToJSON = jest.spyOn(sale, 'toJSON');
    const output = SaleOutputMapper.toOutput(sale);
    
    expect(spyToJSON).toHaveBeenCalled();
    expect(output).toStrictEqual({
      id: sale.sale_id.id,
      customer_id: 'customer-123',
      store_id: 'store-123',
      cashier_id: 'cashier-123',
      total_amount: sale.total_amount,
      discount_amount: 0,
      tax_amount: sale.tax_amount,
      tax_rate: 0,
      subtotal_with_discount: sale.getSubtotalWithDiscount(),
      final_total: sale.getFinalTotal(),
      payment_method: 'cash',
      sale_status: sale.sale_status,
      register_number: 1,
      sale_date: sale.sale_date,
      created_at: sale.created_at,
      updated_at: sale.updated_at,
      received_amount: 15.00,
      change_amount: 5.00,
      items: [
        {
          product_id: 'product-001',
          quantity: 1,
          unit_price: 10.00,
          discount_percentage: 0,
          total_price: 10.00
        }
      ]
    });
  });

  it('should convert a sale with received amount but no change in output', () => {
    const sale = Sale.create({
      store_id: 'store-456',
      cashier_id: 'cashier-456',
      register_number: 2,
      payment_method: PaymentMethod.CASH,
      items: [
        {
          product_id: 'product-002',
          quantity: 2,
          unit_price: 7.50,
          discount_percentage: 0
        }
      ],
      discount_amount: 0
    });
    
    // Simular pagamento exato (sem troco)
    sale.calculateChange(15.00); // Recebido R$ 15,00 para total de R$ 15,00
    
    const spyToJSON = jest.spyOn(sale, 'toJSON');
    const output = SaleOutputMapper.toOutput(sale);
    
    expect(spyToJSON).toHaveBeenCalled();
    expect(output).toStrictEqual({
      id: sale.sale_id.id,
      customer_id: null,
      store_id: 'store-456',
      cashier_id: 'cashier-456',
      total_amount: sale.total_amount,
      discount_amount: 0,
      tax_amount: sale.tax_amount,
      tax_rate: 0,
      subtotal_with_discount: sale.getSubtotalWithDiscount(),
      final_total: sale.getFinalTotal(),
      payment_method: 'cash',
      sale_status: sale.sale_status,
      register_number: 2,
      sale_date: sale.sale_date,
      created_at: sale.created_at,
      updated_at: sale.updated_at,
      received_amount: 15.00,
      items: [
        {
          product_id: 'product-002',
          quantity: 2,
          unit_price: 7.50,
          discount_percentage: 0,
          total_price: 15.00
        }
      ]
    });
  });

  it('should convert a sale without received amount and change in output', () => {
    const sale = Sale.create({
      store_id: 'store-789',
      cashier_id: 'cashier-789',
      register_number: 3,
      payment_method: PaymentMethod.CREDIT_CARD,
      items: [
        {
          product_id: 'product-003',
          quantity: 1,
          unit_price: 20.00,
          discount_percentage: 0
        }
      ],
      discount_amount: 0
    });
    
    // Não chamar calculateChange - simular pagamento por cartão
    
    const spyToJSON = jest.spyOn(sale, 'toJSON');
    const output = SaleOutputMapper.toOutput(sale);
    
    expect(spyToJSON).toHaveBeenCalled();
    expect(output).toStrictEqual({
      id: sale.sale_id.id,
      customer_id: null,
      store_id: 'store-789',
      cashier_id: 'cashier-789',
      total_amount: sale.total_amount,
      discount_amount: 0,
      tax_amount: sale.tax_amount,
      tax_rate: 0,
      subtotal_with_discount: sale.getSubtotalWithDiscount(),
      final_total: sale.getFinalTotal(),
      payment_method: 'credit_card',
      sale_status: sale.sale_status,
      register_number: 3,
      sale_date: sale.sale_date,
      created_at: sale.created_at,
      updated_at: sale.updated_at,
      items: [
        {
          product_id: 'product-003',
          quantity: 1,
          unit_price: 20.00,
          discount_percentage: 0,
          total_price: 20.00
        }
      ]
    });
  });
});