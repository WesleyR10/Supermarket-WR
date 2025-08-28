import { ConvertCartToOrderUseCase } from '../convert-cart-to-order.use-case';
import { ConvertCartToOrderInput } from '../convert-cart-to-order.input';
import { CartInMemoryRepository } from '../../../../infra/db/in-memory/cart-in-memory.repository';
import { OnlineOrderInMemoryRepository } from '../../../../infra/db/in-memory/online-order-in-memory.repository';
import { Cart, CartStatus } from '../../../../domain/cart.aggregate';
import { OnlineOrder } from '../../../../domain/online-order.aggregate';
import { ClientId } from '../../../../../client/domain/client.aggregate';
import { Uuid } from '../../../../../shared/domain/value-objects/uuid.vo';
import { PaymentMethodType } from '../../../../../shared/domain/value-objects/payment-method.vo';
import { IStockValidationService } from '../../../../domain/services/stock-validation.service.interface';
import { EntityValidationError } from '../../../../../shared/domain/validators/validation.error';
import { CartFakeBuilder } from '../../../../domain/fake-builders/cart-fake.builder';
import { Quantity } from '../../../../../shared/domain/value-objects/quantity.vo';
import { Price } from '../../../../../shared/domain/value-objects/price.vo';

describe('ConvertCartToOrderUseCase', () => {
  let useCase: ConvertCartToOrderUseCase;
  let cartRepository: CartInMemoryRepository;
  let onlineOrderRepository: OnlineOrderInMemoryRepository;
  let stockValidationService: jest.Mocked<IStockValidationService>;

  beforeEach(() => {
    cartRepository = new CartInMemoryRepository();
    onlineOrderRepository = new OnlineOrderInMemoryRepository();
    
    stockValidationService = {
      validateStockAvailability: jest.fn().mockResolvedValue({
        is_valid: true,
        errors: [],
        warnings: [],
        available_items: []
      }),
      reserveStock: jest.fn(),
      confirmStockReservation: jest.fn(),
      cancelStockReservation: jest.fn(),
      getProductStock: jest.fn(),
      getMultipleProductsStock: jest.fn(),
      isProductAvailableForOnlineSale: jest.fn(),
      getLowStockProducts: jest.fn(),
      getProductsNearExpiration: jest.fn(),
      getMaxAvailableQuantityForOnlineSale: jest.fn(),
    } as jest.Mocked<IStockValidationService>;

    useCase = new ConvertCartToOrderUseCase(
      cartRepository,
      onlineOrderRepository,
      stockValidationService
    );
  });

  describe('execute', () => {
    it('should successfully convert cart to order', async () => {
      const clientId = new ClientId();
      const cart = CartFakeBuilder.aCart()
        .withClientId(new Uuid(clientId.id))
        .withStoreId('store-123')
        .withActiveStatus()
        .build();
      
      // Add item to cart
      cart.addItem({
        product_id: new Uuid(),
        product_name: 'Test Product',
        quantity: new Quantity(2),
        unit_price: new Price(10.50),
      });

      await cartRepository.insert(cart);

      const input = new ConvertCartToOrderInput({
        cart_id: cart.cart_id.id,
        client_id: clientId.id,
        delivery_address: {
          street: 'Test Street',
          number: '123',
          neighborhood: 'Test Neighborhood',
          city: 'Test City',
          state: 'TS',
          zip_code: '12345-678',
        },
        payment_methods: [{
        type: PaymentMethodType.CREDIT_CARD,
        card_number: '1234567890123456',
        card_holder_name: 'Test User',
        card_expiry_date: '12/25',
        card_cvv: '123',
      }],
      });

      const result = await useCase.execute(input);

      expect(result).toBeDefined();
      expect(result.client_id).toBe(clientId.id);
      expect(result.items.length).toBeGreaterThan(0);
      expect(result.items[0].product_id).toBe(cart.items[0].product_id.id);
      expect(result.items[0].quantity).toBe(cart.items[0].quantity.value);
      expect(result.items[0].unit_price).toBe(cart.items[0].unit_price.value);
      expect(result.payment_method?.type).toBe(PaymentMethodType.CREDIT_CARD);
      
      // Verify cart status was updated to CONVERTED
      const updatedCart = await cartRepository.findById(cart.cart_id);
      expect(updatedCart).toBeDefined();
      expect(updatedCart!.status).toBe(CartStatus.CONVERTED);
    });

    it('should throw error when cart is not found', async () => {
      const input = new ConvertCartToOrderInput({
        cart_id: new Uuid().id,
        client_id: new ClientId().id,
        delivery_address: {
          street: 'Test Street',
          number: '123',
          neighborhood: 'Test Neighborhood',
          city: 'Test City',
          state: 'TS',
          zip_code: '12345-678',
        },
        payment_methods: [{
          type: PaymentMethodType.CREDIT_CARD,
          card_number: '1234567890123456',
          card_holder_name: 'Test User',
          card_expiry_date: '12/25',
          card_cvv: '123',
        }],
      });

      await expect(useCase.execute(input)).rejects.toThrow('Cart Not Found');
    });

    it('should throw error when cart is empty', async () => {
    const clientId = new ClientId();
    const cart = CartFakeBuilder.aCart()
      .withClientId(new Uuid(clientId.id))
      .withStoreId('store-123')
      .withActiveStatus()
      .withEmptyCart()
      .build();

    await cartRepository.insert(cart);

    const input = new ConvertCartToOrderInput({
       cart_id: cart.cart_id.id,
       client_id: clientId.id,
       delivery_address: {
         street: 'Test Street',
         number: '123',
         neighborhood: 'Test Neighborhood',
         city: 'Test City',
         state: 'TS',
         zip_code: '12345-678'
       },
       payment_methods: [{
         type: PaymentMethodType.CREDIT_CARD,
         card_number: '1234567890123456',
         card_holder_name: 'Test User',
         card_expiry_date: '12/25',
         card_cvv: '123'
       }]
     });

      await expect(useCase.execute(input)).rejects.toThrow('Carrinho não pode estar vazio para ser convertido em pedido');
  });

  it('should validate input data and return errors for invalid data', () => {
     const input = new ConvertCartToOrderInput({
       cart_id: '', // Invalid empty cart_id
       client_id: '', // Invalid empty client_id
       delivery_address: {
         street: '', // Invalid empty street
         number: '',
         neighborhood: '',
         city: '',
         state: '',
         zip_code: '',
       },
       payment_methods: [], // Invalid empty payment methods
     });

     const errors = input.validate();
     expect(errors.length).toBeGreaterThan(0);
     expect(errors).toContain('cart_id é obrigatório');
     expect(errors).toContain('client_id é obrigatório');
     expect(errors).toContain('payment_methods é obrigatório');
   });
  });
});