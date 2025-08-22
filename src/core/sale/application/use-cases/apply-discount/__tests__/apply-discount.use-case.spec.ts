import { ApplyDiscountUseCase } from '../apply-discount.use-case';
import { ApplyDiscountInput } from '../apply-discount.input';
import { SaleInMemoryRepository } from '../../../../infra/db/in-memory/sale-in-memory.repository';
import { Sale, PaymentMethod } from '../../../../domain/sale.aggregate';
import { EntityValidationError } from '../../../../../shared/domain/validators/validation.error';

describe('ApplyDiscountUseCase Unit Tests', () => {
  let useCase: ApplyDiscountUseCase;
  let repository: SaleInMemoryRepository;
  let sale: Sale;

  beforeEach(() => {
    repository = new SaleInMemoryRepository();
    useCase = new ApplyDiscountUseCase(repository);
    
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
    it('should not apply discount when discount amount is R$ 0.00', async () => {
      const input = new ApplyDiscountInput({
        sale_id: sale.sale_id.id,
        reason: 'No discount applied - testing base values',
        store_id: 'store-123'
      });

      const output = await useCase.execute(input);

      expect(output.total_amount).toBe(20.00);
      expect(output.discount_amount).toBe(0.00);
      expect(output.subtotal_with_discount).toBe(20.00); // Mesmo valor do total_amount
      expect(output.final_total).toBe(20.00); // Sem imposto na venda base
    });
    
    it('should apply percentage discount successfully', async () => {
      const input = new ApplyDiscountInput({
        sale_id: sale.sale_id.id,
        store_id: 'store-123',
        discount_percentage: 15,
        reason: 'Customer loyalty discount'
      });

      const output = await useCase.execute(input);

      expect(output.total_amount).toBe(20.00); // Total original
      expect(output.discount_amount).toBe(3.00); // 15% de 
      expect(output.subtotal_with_discount).toBe(17.00); // 20 - 3 = 17
      expect(output.final_total).toBe(17.00); // 17 + 0 (sem impostos) = 17
    });

    it('should apply amount discount successfully', async () => {
      const input = new ApplyDiscountInput({
        sale_id: sale.sale_id.id,
        store_id: 'store-123',
        discount_amount: 5.00,
        reason: 'Manager authorization'
      });

      const output = await useCase.execute(input);

      expect(output.total_amount).toBe(20.00); // Total original
      expect(output.discount_amount).toBe(5.00);
      expect(output.subtotal_with_discount).toBe(15.00); // 20 - 5 = 15
      expect(output.final_total).toBe(15.00); // 15 + 0 (sem impostos) = 15
    });

    it('should throw error when sale is not pending', async () => {
      sale.completeSale();
      await repository.update(sale);

      const input = new ApplyDiscountInput({
        sale_id: sale.sale_id.id,
        store_id: 'store-123',
        discount_percentage: 10
      });

      await expect(useCase.execute(input)).rejects.toThrow(EntityValidationError);
    });

    it('should throw error when both discount types provided', async () => {
      const input = new ApplyDiscountInput({
        sale_id: sale.sale_id.id,
        store_id: 'store-123',
        discount_percentage: 10,
        discount_amount: 5.00
      });

      await expect(useCase.execute(input)).rejects.toThrow(EntityValidationError);
    });

    // Cenários específicos do supermercado
    describe('real supermarket scenarios', () => {
      it('should apply discount to a real shopping cart with multiple items', async () => {
        // ✅ Criar uma venda com múltiplos produtos E taxa de imposto
        const realSale = Sale.create({
          store_id: 'store-123',
          cashier_id: 'cashier-456',
          register_number: 1,
          payment_method: PaymentMethod.CREDIT_CARD,
          tax_rate: 18.5, // ✅ ICMS brasileiro
          items: [
            {
              product_id: 'arroz-5kg',
              quantity: 2,
              unit_price: 25.90, // 2x Arroz 5kg
              discount_percentage: 0
            },
            {
              product_id: 'feijao-1kg',
              quantity: 3,
              unit_price: 8.50, // 3x Feijão 1kg
              discount_percentage: 0
            },
            {
              product_id: 'leite-1l',
              quantity: 4,
              unit_price: 4.20, // 4x Leite 1L
              discount_percentage: 0
            },
            {
              product_id: 'pao-frances',
              quantity: 1,
              unit_price: 12.00, // 1x Pão francês
              discount_percentage: 0
            }
          ]
        });
        
        repository.items = [realSale];
        
        // Total: (25.90*2) + (8.50*3) + (4.20*4) + (12.00*1) = 51.80 + 25.50 + 16.80 + 12.00 = 106.10
        expect(realSale.total_amount).toBe(106.10);
        
        // Aplicar desconto de funcionário (10%)
        const input = new ApplyDiscountInput({
          sale_id: realSale.sale_id.id,
          store_id: 'store-123',
          discount_percentage: 10,
          reason: 'Employee discount'
        });
    
        const output = await useCase.execute(input);
    
        expect(output.total_amount).toBe(106.10); // Total original
        expect(output.discount_amount).toBe(10.61); // 10% de 106.10
        expect(output.subtotal_with_discount).toBe(95.49); // 106.10 - 10.61
        expect(output.tax_rate).toBe(18.5); // Taxa configurada
        expect(output.tax_amount).toBe(17.67); // ✅ 18.5% de 95.49 = 17.6657 ≈ 17.67
        expect(output.final_total).toBe(113.16); // 95.49 + 17.67
      });
    
      it('should apply fixed discount to bulk purchase', async () => {
        // ✅ Compra em grande quantidade com desconto fixo E taxa de imposto
        const bulkSale = Sale.create({
          store_id: 'store-123',
          cashier_id: 'cashier-456',
          register_number: 1,
          payment_method: PaymentMethod.CASH,
          tax_rate: 18.5, // ✅ ICMS brasileiro
          items: [
            {
              product_id: 'detergente',
              quantity: 12,
              unit_price: 3.50, // 12x Detergente
              discount_percentage: 0
            }
          ]
        });
        
        repository.items = [bulkSale];
        
        // Aplicar desconto fixo de R$ 7,00
        const input = new ApplyDiscountInput({
          sale_id: bulkSale.sale_id.id,
          store_id: 'store-123',
          discount_amount: 7.00,
          reason: 'Bulk purchase promotion - Buy 12 pay 10'
        });
    
        const output = await useCase.execute(input);
    
        expect(output.total_amount).toBe(42.00); // 12 * 3.50
        expect(output.discount_amount).toBe(7.00);
        expect(output.subtotal_with_discount).toBe(35.00); // 42 - 7
        expect(output.tax_rate).toBe(18.5); // Taxa configurada
        expect(output.tax_amount).toBe(6.48); // ✅ 18.5% de 35.00 = 6.4753 ≈ 6.48
        expect(output.final_total).toBe(41.48); // 35 + 6.475 = 41.4753 ≈ 41.48
      });
    });
  });
});