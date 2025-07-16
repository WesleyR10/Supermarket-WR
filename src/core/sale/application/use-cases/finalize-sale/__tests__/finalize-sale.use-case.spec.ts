import { FinalizeSaleUseCase } from '../finalize-sale.use-case';
import { FinalizeSaleInput } from '../finalize-sale.input';
import { SaleInMemoryRepository } from '../../../../infra/db/in-memory/sale-in-memory.repository';
import { Sale, SaleStatus, PaymentMethod } from '../../../../domain/sale.aggregate';
import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';
import { EntityValidationError } from '../../../../../shared/domain/validators/validation.error';
import { InvalidUuidError } from '../../../../../shared/domain/value-objects/uuid.vo';

describe('FinalizeSaleUseCase Unit Tests', () => {
  let useCase: FinalizeSaleUseCase;
  let repository: SaleInMemoryRepository;
  let sale: Sale;

  beforeEach(() => {
    repository = new SaleInMemoryRepository();
    useCase = new FinalizeSaleUseCase(repository);
    
    // Criar uma venda pendente com itens
    sale = Sale.create({
      store_id: 'store-123',
      cashier_id: 'cashier-456',
      register_number: 1,
      payment_method: PaymentMethod.CASH,
      items: [
        {
          product_id: 'product-123',
          quantity: 2,
          unit_price: 10.00,
          discount_percentage: 0
        }
      ]
    });
    repository.items.push(sale);
  });

  describe('execute method', () => {
    it('should finalize sale successfully', async () => {
      const input = new FinalizeSaleInput({
        sale_id: sale.sale_id.id,
        payment_method: PaymentMethod.CREDIT_CARD
      });

      const output = await useCase.execute(input);

      expect(output.sale_status).toBe(SaleStatus.COMPLETED);
      expect(output.payment_method).toBe(PaymentMethod.CREDIT_CARD);
      expect(output.total_amount).toBe(20.00);
    });

    it('should finalize sale with change calculation', async () => {
      const input = new FinalizeSaleInput({
        sale_id: sale.sale_id.id,
        payment_method: PaymentMethod.CASH,
        received_amount: 25.00
      });

      const output = await useCase.execute(input);

      expect(output.sale_status).toBe(SaleStatus.COMPLETED);
      expect(output.change_amount).toBe(5.00); // 25 - 20
    });

    it('should finalize sale without change when exact amount', async () => {
      const input = new FinalizeSaleInput({
        sale_id: sale.sale_id.id,
        payment_method: PaymentMethod.CASH,
        received_amount: 20.00
      });

      const output = await useCase.execute(input);

      expect(output.change_amount).toBeUndefined();
    });

    it('should throw InvalidUuidError when sale_id is invalid', async () => {
      const input = new FinalizeSaleInput({
        sale_id: 'invalid-uuid'
      });

      await expect(useCase.execute(input)).rejects.toThrow(InvalidUuidError);
    });

    it('should throw NotFoundError when sale not found', async () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      const input = new FinalizeSaleInput({
        sale_id: validUuid
      });

      await expect(useCase.execute(input)).rejects.toThrow(NotFoundError);
    });

    it('should throw EntityValidationError when sale is not pending', async () => {
      sale.completeSale();
      await repository.update(sale);

      const input = new FinalizeSaleInput({
        sale_id: sale.sale_id.id
      });

      await expect(useCase.execute(input)).rejects.toThrow(EntityValidationError);
    });

    it('should throw EntityValidationError when sale has no items', async () => {
      const emptySale = Sale.create({
        store_id: 'store-123',
        cashier_id: 'cashier-456',
        register_number: 1,
        payment_method: PaymentMethod.CASH,
        items: []
      });
      repository.items.push(emptySale);

      const input = new FinalizeSaleInput({
        sale_id: emptySale.sale_id.id
      });

      await expect(useCase.execute(input)).rejects.toThrow(EntityValidationError);
    });

    // Cenários específicos do supermercado
    describe('supermarket specific scenarios', () => {
      it('should handle different payment methods', async () => {
        const paymentMethods = [
          PaymentMethod.CASH,
          PaymentMethod.CREDIT_CARD,
          PaymentMethod.DEBIT_CARD,
          PaymentMethod.PIX
        ];

        for (const method of paymentMethods) {
          const testSale = Sale.create({
            store_id: 'store-123',
            cashier_id: 'cashier-456',
            register_number: 1,
            payment_method: PaymentMethod.CASH,
            items: [{
              product_id: 'product-123',
              quantity: 1,
              unit_price: 10.00,
              discount_percentage: 0
            }]
          });
          repository.items.push(testSale);

          const input = new FinalizeSaleInput({
            sale_id: testSale.sale_id.id,
            payment_method: method
          });

          const output = await useCase.execute(input);
          expect(output.payment_method).toBe(method);
        }
      });

      it('should handle sales with discounts', async () => {
        sale.applyDiscount(2.00); // Aplicar desconto de R$ 2,00
        await repository.update(sale);
      
        const input = new FinalizeSaleInput({
          sale_id: sale.sale_id.id,
          payment_method: PaymentMethod.CASH,
          received_amount: 25.00
        });
      
        const output = await useCase.execute(input);
      
        expect(output.discount_amount).toBe(2.00);
        expect(output.total_amount).toBe(20.00); // Subtotal dos itens (sem desconto)
        expect(output.subtotal_with_discount).toBe(18.00); // 20 - 2
        expect(output.change_amount).toBe(7.00); // 25 - getFinalTotal()
      });
    });
  });
});