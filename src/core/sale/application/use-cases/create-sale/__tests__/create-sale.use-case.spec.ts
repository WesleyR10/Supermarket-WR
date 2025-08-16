import 'reflect-metadata';
import { CreateSaleUseCase } from '../create-sale.use-case';
import { CreateSaleInput } from '../create-sale.input';
import { SaleInMemoryRepository } from '../../../../infra/db/in-memory/sale-in-memory.repository';
import { Sale, SaleStatus, PaymentMethod } from '../../../../domain/sale.aggregate';
import { EntityValidationError } from '../../../../../shared/domain/validators/validation.error';
import { SaleOutputMapper } from '../../common/sale-output';

describe('CreateSaleUseCase Unit Tests', () => {
  let useCase: CreateSaleUseCase;
  let repository: SaleInMemoryRepository;

  beforeEach(() => {
    repository = new SaleInMemoryRepository();
    useCase = new CreateSaleUseCase(repository);
  });

  describe('successful creation', () => {
    it('should create a sale successfully with basic data', async () => {
      const input = new CreateSaleInput({
        store_id: 'store-123',
        cashier_id: 'cashier-456',
        register_number: 1,
        payment_method: PaymentMethod.CASH,
        items: [
          {
            product_id: 'product-001',
            quantity: 2,
            unit_price: 10.50,
            discount_percentage: 0
          }
        ]
      });

      const output = await useCase.execute(input);

      expect(output.id).toBeDefined();
      expect(output.store_id).toBe('store-123');
      expect(output.cashier_id).toBe('cashier-456');
      expect(output.register_number).toBe(1);
      expect(output.payment_method).toBe('cash');
      expect(output.sale_status).toBe(SaleStatus.PENDING);
      expect(output.customer_id).toBeNull();
      expect(output.items).toHaveLength(1);
      expect(output.created_at).toBeInstanceOf(Date);
      expect(output.updated_at).toBeInstanceOf(Date);
    });

    it('should create a sale with customer and multiple items', async () => {
      const input = new CreateSaleInput({
        customer_id: 'customer-789',
        store_id: 'store-123',
        cashier_id: 'cashier-456',
        register_number: 2,
        payment_method: PaymentMethod.CREDIT_CARD,
        items: [
          {
            product_id: 'product-001',
            quantity: 1,
            unit_price: 15.99,
            discount_percentage: 0
          },
          {
            product_id: 'product-002',
            quantity: 2,
            unit_price: 8.50,
            discount_percentage: 0
          }
        ]
      });

      const output = await useCase.execute(input);

      expect(output.customer_id).toBe('customer-789');
      expect(output.payment_method).toBe('credit_card');
      expect(output.items).toHaveLength(2);
    });

    it('should create a sale with optional fields', async () => {
      const input = new CreateSaleInput({
        store_id: 'store-123',
        cashier_id: 'cashier-456',
        register_number: 1,
        payment_method: PaymentMethod.PIX,
        discount_amount: 5.00,
        tax_rate: 10,
        items: [
          {
            product_id: 'product-001',
            quantity: 1,
            unit_price: 50.00,
            discount_percentage: 0
          }
        ]
      });

      const output = await useCase.execute(input);

      expect(output.payment_method).toBe('pix');
      expect(output.discount_amount).toBe(5.00);
      expect(output.tax_rate).toBe(10);
    });
  });

  describe('input validation', () => {
    it('should throw EntityValidationError when store_id is empty', async () => {
      const input = new CreateSaleInput({
        store_id: '',
        cashier_id: 'cashier-456',
        register_number: 1,
        payment_method: PaymentMethod.CASH,
        items: [
          {
            product_id: 'product-001',
            quantity: 1,
            unit_price: 10.00,
            discount_percentage: 0
          }
        ]
      });

      await expect(useCase.execute(input)).rejects.toThrow(EntityValidationError);
    });

    it('should throw EntityValidationError when cashier_id is empty', async () => {
      const input = new CreateSaleInput({
        store_id: 'store-123',
        cashier_id: '',
        register_number: 1,
        payment_method: PaymentMethod.CASH,
        items: [
          {
            product_id: 'product-001',
            quantity: 1,
            unit_price: 10.00,
            discount_percentage: 0
          }
        ]
      });

      await expect(useCase.execute(input)).rejects.toThrow(EntityValidationError);
    });

    it('should throw EntityValidationError when register_number is invalid', async () => {
      const input = new CreateSaleInput({
        store_id: 'store-123',
        cashier_id: 'cashier-456',
        register_number: 0,
        payment_method: PaymentMethod.CASH,
        items: [
          {
            product_id: 'product-001',
            quantity: 1,
            unit_price: 10.00,
            discount_percentage: 0
          }
        ]
      });

      await expect(useCase.execute(input)).rejects.toThrow(EntityValidationError);
    });

    it('should throw EntityValidationError when items array is empty', async () => {
      const input = new CreateSaleInput({
        store_id: 'store-123',
        cashier_id: 'cashier-456',
        register_number: 1,
        payment_method: PaymentMethod.CASH,
        items: []
      });

      await expect(useCase.execute(input)).rejects.toThrow(EntityValidationError);
    });
  });

  describe('item validation', () => {
    it('should throw EntityValidationError when item product_id is empty', async () => {
      const input = new CreateSaleInput({
        store_id: 'store-123',
        cashier_id: 'cashier-456',
        register_number: 1,
        payment_method: PaymentMethod.CASH,
        items: [
          {
            product_id: '',
            quantity: 1,
            unit_price: 10.00,
            discount_percentage: 0
          }
        ]
      });

      await expect(useCase.execute(input)).rejects.toThrow(EntityValidationError);
    });
  });



  describe('multi-tenant validation', () => {
    it('should validate store_id consistency', async () => {
      const input = new CreateSaleInput({
        store_id: 'store-123',
        cashier_id: 'cashier-456',
        register_number: 1,
        payment_method: PaymentMethod.CASH,
        items: [
          {
            product_id: 'product-001',
            quantity: 1,
            unit_price: 10.00,
            discount_percentage: 0
          }
        ]
      });

      const output = await useCase.execute(input);
      expect(output.store_id).toBe('store-123');
    });
  });

  describe('repository integration', () => {
    it('should save sale to repository', async () => {
      const input = new CreateSaleInput({
        store_id: 'store-123',
        cashier_id: 'cashier-456',
        register_number: 1,
        payment_method: PaymentMethod.CASH,
        items: [
          {
            product_id: 'product-001',
            quantity: 1,
            unit_price: 10.00,
            discount_percentage: 0
          }
        ]
      });

      const output = await useCase.execute(input);

      expect(repository.items).toHaveLength(1);
      const savedSale = repository.items[0];
      expect(savedSale.sale_id.id).toBe(output.id);
      expect(savedSale.store_id).toBe('store-123');
      expect(savedSale.cashier_id).toBe('cashier-456');
      expect(savedSale.sale_status).toBe(SaleStatus.PENDING);
    });

    it('should use SaleOutputMapper for response', async () => {
      const input = new CreateSaleInput({
        store_id: 'store-123',
        cashier_id: 'cashier-456',
        register_number: 1,
        payment_method: PaymentMethod.CASH,
        items: [
          {
            product_id: 'product-001',
            quantity: 1,
            unit_price: 10.00,
            discount_percentage: 0
          }
        ]
      });

      const spyMapper = jest.spyOn(SaleOutputMapper, 'toOutput');
      const output = await useCase.execute(input);

      expect(spyMapper).toHaveBeenCalled();
      expect(output).toHaveProperty('subtotal_with_discount');
      expect(output).toHaveProperty('final_total');
    });
  });

});