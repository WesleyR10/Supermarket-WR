import { EntityValidationError } from '../../../../../shared/domain/validators/validation.error';
import { OnlineOrderInMemoryRepository } from '../../../../infra/db/in-memory/online-order-in-memory.repository';
import { CreateOnlineOrderUseCase } from '../create-online-order.use-case';
import { CreateOnlineOrderInput } from '../create-online-order.input';
import { MockStockValidationService } from '../../../../domain/services/stock-validation.service.mock';
import { Uuid } from '../../../../../shared/domain/value-objects/uuid.vo';
import { Quantity } from '../../../../../shared/domain/value-objects/quantity.vo';

describe('CreateOnlineOrderUseCase Unit Tests', () => {
  let useCase: CreateOnlineOrderUseCase;
  let repository: OnlineOrderInMemoryRepository;
  let stockValidationService: MockStockValidationService;
  let validInput: CreateOnlineOrderInput;

  beforeEach(() => {
    repository = new OnlineOrderInMemoryRepository();
    stockValidationService = new MockStockValidationService();
    useCase = new CreateOnlineOrderUseCase(repository, stockValidationService);
    
    validInput = new CreateOnlineOrderInput({
      store_id: '123e4567-e89b-12d3-a456-426614174000',
      client_id: '123e4567-e89b-12d3-a456-426614174010',
      items: [
        {
          product_id: '123e4567-e89b-12d3-a456-426614174001', // Produto com estoque
          product_name: 'Produto Teste',
          quantity: 2,
          unit_price: 10.50
        }
      ],
      delivery_address: {
        street: 'Rua Teste',
        number: '123',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zip_code: '01000-000'
      },
      delivery_fee: 5.00
    });
  });

  describe('execute', () => {

    it('should create an online order successfully with stock validation', async () => {
      const output = await useCase.execute(validInput);

      expect(output).toBeDefined();
      expect(output.order_id).toBeDefined();
      expect(output.store_id).toBe(validInput.store_id);
      expect(output.client_id).toBe(validInput.client_id);
      expect(output.items).toHaveLength(1);
      expect(output.items[0].product_id).toBe(validInput.items[0].product_id);
      expect(output.items[0].quantity).toBe(validInput.items[0].quantity);
      expect(output.delivery_fee).toBe(validInput.delivery_fee);
      expect(output.status).toBe('PENDING');

      // Verifica se foi persistido
      const savedOrder = await repository.findById(new Uuid(output.order_id));
      expect(savedOrder).toBeDefined();
    });

    it('should create an online order without stock validation service', async () => {
      const useCaseWithoutStock = new CreateOnlineOrderUseCase(repository);
      
      const output = await useCaseWithoutStock.execute(validInput);

      expect(output).toBeDefined();
      expect(output.order_id).toBeDefined();
      expect(output.status).toBe('PENDING');
    });

    it('should throw EntityValidationError when stock is insufficient', async () => {
      const inputWithInsufficientStock = new CreateOnlineOrderInput({
        ...validInput,
        items: [
          {
            product_id: '123e4567-e89b-12d3-a456-426614174001',
            product_name: 'Produto Teste',
            quantity: 200, // Quantidade maior que o estoque disponível (100)
            unit_price: 10.50
          }
        ]
      });

      await expect(useCase.execute(inputWithInsufficientStock))
        .rejects
        .toThrow(EntityValidationError);
    });

    it('should throw EntityValidationError when product is not found in stock', async () => {
      const inputWithUnknownProduct = new CreateOnlineOrderInput({
        ...validInput,
        items: [
          {
            product_id: '123e4567-e89b-12d3-a456-426614174999', // Produto não existe
            product_name: 'Produto Inexistente',
            quantity: 1,
            unit_price: 10.50
          }
        ]
      });

      await expect(useCase.execute(inputWithUnknownProduct))
        .rejects
        .toThrow(EntityValidationError);
    });

    it('should throw EntityValidationError when product is out of stock', async () => {
      const inputWithOutOfStockProduct = new CreateOnlineOrderInput({
        ...validInput,
        items: [
          {
            product_id: '123e4567-e89b-12d3-a456-426614174004', // Produto sem estoque
            product_name: 'Produto Sem Estoque',
            quantity: 1,
            unit_price: 10.50
          }
        ]
      });

      await expect(useCase.execute(inputWithOutOfStockProduct))
        .rejects
        .toThrow(EntityValidationError);
    });

    it('should log warnings for low stock products', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const inputWithLowStockProduct = new CreateOnlineOrderInput({
        ...validInput,
        items: [
          {
            product_id: '123e4567-e89b-12d3-a456-426614174003', // Produto com baixo estoque
            product_name: 'Produto Baixo Estoque',
            quantity: 1,
            unit_price: 10.50
          }
        ]
      });

      await useCase.execute(inputWithLowStockProduct);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[CreateOnlineOrder] Avisos de estoque:',
        expect.arrayContaining([expect.stringContaining('estoque baixo')])
      );

      consoleSpy.mockRestore();
    });

    it('should handle multiple items with mixed stock availability', async () => {
      const inputWithMixedStock = new CreateOnlineOrderInput({
        ...validInput,
        items: [
          {
            product_id: '123e4567-e89b-12d3-a456-426614174001', // Produto com estoque
            product_name: 'Produto Com Estoque',
            quantity: 5,
            unit_price: 10.50
          },
          {
            product_id: '123e4567-e89b-12d3-a456-426614174004', // Produto sem estoque
            product_name: 'Produto Sem Estoque',
            quantity: 1,
            unit_price: 15.00
          }
        ]
      });

      await expect(useCase.execute(inputWithMixedStock))
        .rejects
        .toThrow(EntityValidationError);
    });

    it('should throw EntityValidationError for invalid input data', async () => {
      const invalidInput = new CreateOnlineOrderInput({
        ...validInput,
        store_id: 'invalid-uuid'
      });

      await expect(useCase.execute(invalidInput))
        .rejects
        .toThrow(EntityValidationError);
    });

    it('should create order with estimated delivery date', async () => {
      const inputWithDeliveryDate = new CreateOnlineOrderInput({
        ...validInput,
        estimated_delivery: '2024-12-31T10:00:00Z'
      });

      const output = await useCase.execute(inputWithDeliveryDate);

      expect(output.estimated_delivery).toBeDefined();
      expect(new Date(output.estimated_delivery!)).toEqual(new Date('2024-12-31T10:00:00Z'));
    });

    it('should create order with payment method', async () => {
      const inputWithPayment = new CreateOnlineOrderInput({
        ...validInput,
        payment_method: {
          type: 'credit_card',
          details: { last_four: '1234' }
        }
      });

      const output = await useCase.execute(inputWithPayment);

      expect(output.payment_method).toBeDefined();
      expect(output.payment_method!.type).toBe('CREDIT_CARD');
    });

    it('should create order with notes', async () => {
      const inputWithNotes = new CreateOnlineOrderInput({
        ...validInput,
        notes: 'Entregar na portaria'
      });

      const output = await useCase.execute(inputWithNotes);

      expect(output.notes).toBe('Entregar na portaria');
    });
  });

  describe('stock validation integration', () => {
    it('should validate stock for all items before creating order', async () => {
      const validateStockSpy = jest.spyOn(stockValidationService, 'validateStockAvailability');
      
      await useCase.execute(validInput);

      expect(validateStockSpy).toHaveBeenCalledWith(
        validInput.store_id,
        expect.arrayContaining([
          expect.objectContaining({
            product_id: expect.any(Uuid),
            quantity: expect.any(Quantity)
          })
        ])
      );
    });

    it('should convert input items to proper value objects for stock validation', async () => {
      const validateStockSpy = jest.spyOn(stockValidationService, 'validateStockAvailability');
      
      await useCase.execute(validInput);

      const [storeId, items] = validateStockSpy.mock.calls[0];
      
      expect(storeId).toBe(validInput.store_id);
      expect(items).toHaveLength(1);
      expect(items[0].product_id).toBeInstanceOf(Uuid);
      expect(items[0].product_id.id).toBe(validInput.items[0].product_id);
      expect(items[0].quantity).toBeInstanceOf(Quantity);
      expect(items[0].quantity.value).toBe(validInput.items[0].quantity);
    });
  });
});