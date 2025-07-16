import { CancelSaleUseCase } from '../cancel-sale.use-case';
import { CancelSaleInput } from '../cancel-sale.input';
import { SaleInMemoryRepository } from '../../../../infra/db/in-memory/sale-in-memory.repository';
import { Sale, SaleStatus, PaymentMethod } from '../../../../domain/sale.aggregate';
import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';
import { EntityValidationError } from '../../../../../shared/domain/validators/validation.error';
import { InvalidUuidError } from '../../../../../shared/domain/value-objects/uuid.vo';

describe('CancelSaleUseCase Unit Tests', () => {
  let useCase: CancelSaleUseCase;
  let repository: SaleInMemoryRepository;
  let sale: Sale;

  beforeEach(() => {
    repository = new SaleInMemoryRepository();
    useCase = new CancelSaleUseCase(repository);
    
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
    it('should cancel sale successfully', async () => {
      const input = new CancelSaleInput({
        sale_id: sale.sale_id.id,
        reason: 'Customer request'
      });

      const output = await useCase.execute(input);

      expect(output.sale_status).toBe(SaleStatus.CANCELLED);
      expect(output.id).toBe(sale.sale_id.id);
    });

    it('should throw InvalidUuidError when sale_id is invalid', async () => {
      const input = new CancelSaleInput({
        sale_id: 'invalid-uuid',
        reason: 'Test'
      });

      await expect(useCase.execute(input)).rejects.toThrow(InvalidUuidError);
    });

    it('should throw NotFoundError when sale not found', async () => {
      const validUuid = '550e8400-e29b-41d4-a716-446655440000';
      const input = new CancelSaleInput({
        sale_id: validUuid,
        reason: 'Test'
      });

      await expect(useCase.execute(input)).rejects.toThrow(NotFoundError);
    });

    it('should throw EntityValidationError when sale is not pending', async () => {
      sale.completeSale();
      await repository.update(sale);

      const input = new CancelSaleInput({
        sale_id: sale.sale_id.id,
        reason: 'Test'
      });

      await expect(useCase.execute(input)).rejects.toThrow(EntityValidationError);
    });

    // Testes de integração com repositório
    describe('repository integration', () => {
      it('should update sale status in repository', async () => {
        const input = new CancelSaleInput({
          sale_id: sale.sale_id.id,
          reason: 'Customer request'
        });

        await useCase.execute(input);

        const updatedSale = await repository.findById(sale.sale_id);
        expect(updatedSale!.sale_status).toBe(SaleStatus.CANCELLED);
      });
    });

    // Cenários específicos do supermercado
    describe('supermarket specific scenarios', () => {
      it('should handle manager cancellation', async () => {
        const input = new CancelSaleInput({
          sale_id: sale.sale_id.id,
          reason: 'Manager authorization - pricing error'
        });

        const output = await useCase.execute(input);

        expect(output.sale_status).toBe(SaleStatus.CANCELLED);
      });

      it('should handle system error cancellation', async () => {
        const input = new CancelSaleInput({
          sale_id: sale.sale_id.id,
          reason: 'System error - payment processing failed'
        });

        const output = await useCase.execute(input);

        expect(output.sale_status).toBe(SaleStatus.CANCELLED);
      });

      it('should handle customer request cancellation', async () => {
        const input = new CancelSaleInput({
          sale_id: sale.sale_id.id,
          reason: 'Customer changed mind'
        });

        const output = await useCase.execute(input);

        expect(output.sale_status).toBe(SaleStatus.CANCELLED);
      });
    });
  });
});