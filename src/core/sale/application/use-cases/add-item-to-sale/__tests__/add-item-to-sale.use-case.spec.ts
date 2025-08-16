import { AddItemToSaleUseCase } from '../add-item-to-sale.use-case';
import { AddItemToSaleInput } from '../add-item-to-sale.input';
import { SaleInMemoryRepository } from '../../../../infra/db/in-memory/sale-in-memory.repository';
import { Sale, PaymentMethod } from '../../../../domain/sale.aggregate';
import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';
import { EntityValidationError } from '../../../../../shared/domain/validators/validation.error';
import { InvalidUuidError } from '@core/shared/domain/value-objects/uuid.vo';

describe('AddItemToSaleUseCase Unit Tests', () => {
  let useCase: AddItemToSaleUseCase;
  let repository: SaleInMemoryRepository;
  let sale: Sale;

  beforeEach(() => {
    repository = new SaleInMemoryRepository();
    useCase = new AddItemToSaleUseCase(repository);
    
    // ✅ Usar o método create do aggregate para criar uma venda válida
    sale = Sale.create({
      store_id: 'store-123',
      cashier_id: 'cashier-456',
      register_number: 1,
      payment_method: PaymentMethod.CASH,
      items: []
    });
    repository.items.push(sale);
  });

  describe('execute method', () => {
    it('should add item to sale successfully', async () => {
      const input = new AddItemToSaleInput({
        sale_id: sale.sale_id.id,
        store_id: 'store-123',
        product_id: 'product-123',
        quantity: 2,
        unit_price: 10.50,
        discount_percentage: 5
      });

      const output = await useCase.execute(input);

      expect(output.items).toHaveLength(1);
      expect(output.items[0]).toMatchObject({
        product_id: 'product-123',
        quantity: 2,
        unit_price: 10.50,
        discount_percentage: 5,
        total_price: 19.95 // (2 * 10.50) * 0.95
      });
      expect(output.total_amount).toBe(19.95);
    });

    it('should add item without discount', async () => {
      const input = new AddItemToSaleInput({
        sale_id: sale.sale_id.id,
        store_id: 'store-123',
        product_id: 'product-456',
        quantity: 1,
        unit_price: 25.00
      });

      const output = await useCase.execute(input);

      expect(output.items).toHaveLength(1);
      expect(output.items[0]).toMatchObject({
        product_id: 'product-456',
        quantity: 1,
        unit_price: 25.00,
        discount_percentage: 0,
        total_price: 25.00
      });
    });

    it('should throw InvalidUuidError when sale_id is invalid', async () => {
      const input = new AddItemToSaleInput({
        sale_id: 'invalid-uuid',
        store_id: 'store-123',
        product_id: 'product-123',
        quantity: 1,
        unit_price: 10.00
      });

      await expect(useCase.execute(input)).rejects.toThrow(InvalidUuidError);
    });

    it('should throw NotFoundError when sale not found', async () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      const input = new AddItemToSaleInput({
        sale_id: validUuid,
        store_id: 'store-123',
        product_id: 'product-123',
        quantity: 1,
        unit_price: 10.00
      });

      await expect(useCase.execute(input)).rejects.toThrow(NotFoundError);
    });

    it('should throw EntityValidationError when sale is not pending', async () => {
      sale.completeSale();
      await repository.update(sale);

      const input = new AddItemToSaleInput({
        sale_id: sale.sale_id.id,
        store_id: 'store-123',
        product_id: 'product-123',
        quantity: 1,
        unit_price: 10.00
      });

      await expect(useCase.execute(input)).rejects.toThrow(EntityValidationError);
    });

    // Testes de integração com repositório
    describe('repository integration', () => {
      it('should update sale in repository', async () => {
        const input = new AddItemToSaleInput({
          sale_id: sale.sale_id.id,
          store_id: 'store-123',
          product_id: 'product-123',
          quantity: 1,
          unit_price: 100.00
        });

        await useCase.execute(input);

        const updatedSale = await repository.findById(sale.sale_id);
        expect(updatedSale!.items).toHaveLength(1);
        expect(updatedSale!.items[0].product_id).toBe('product-123');
      });
    });

    // Cenários específicos do supermercado
    describe('supermarket specific scenarios', () => {
      it('should handle multiple items correctly', async () => {
        const input1 = new AddItemToSaleInput({
          sale_id: sale.sale_id.id,
          store_id: 'store-123',
          product_id: 'product-123',
          quantity: 2,
          unit_price: 5.00
        });

        const input2 = new AddItemToSaleInput({
          sale_id: sale.sale_id.id,
          store_id: 'store-123',
          product_id: 'product-456',
          quantity: 1,
          unit_price: 15.00
        });

        await useCase.execute(input1);
        const output = await useCase.execute(input2);

        expect(output.items).toHaveLength(2);
        expect(output.total_amount).toBe(25.00); // (2*5) + (1*15)
      });

      it('should handle fractional quantities for weighted products', async () => {
        const input = new AddItemToSaleInput({
          sale_id: sale.sale_id.id,
          store_id: 'store-123',
          product_id: 'product-weight',
          quantity: 1.5, // 1.5kg
          unit_price: 12.00 // por kg
        });

        const output = await useCase.execute(input);

        expect(output.items[0].quantity).toBe(1.5);
        expect(output.items[0].total_price).toBe(18.00); // 1.5 * 12
      });

      it('should recalculate totals including tax', async () => {
        const saleRepository = repository.items[0];
        saleRepository.tax_rate = 18; // 18% ICMS

        const input = new AddItemToSaleInput({
          sale_id: sale.sale_id.id,
          store_id: 'store-123',
          product_id: 'product-123',
          quantity: 1,
          unit_price: 100.00
        });

        const output = await useCase.execute(input);

        expect(output.total_amount).toBe(100.00);
        expect(output.tax_amount).toBe(18); // 18% ICMS
        expect(output.final_total).toBe(118); // total + tax
      });
    });
  });

  it('should throw EntityValidationError when input.store_id differs from sale.store_id', async () => {
    const input = new AddItemToSaleInput({
      sale_id: sale.sale_id.id,
      store_id: 'another-store',
      product_id: 'product-xyz',
      quantity: 1,
      unit_price: 10.00
    });

    await expect(useCase.execute(input)).rejects.toThrow(EntityValidationError);
  });
});