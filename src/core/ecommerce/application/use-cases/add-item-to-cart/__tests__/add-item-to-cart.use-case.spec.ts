import { AddItemToCartUseCase } from '../add-item-to-cart.use-case';
import { AddItemToCartInput } from '../add-item-to-cart.input';
import { CartInMemoryRepository } from '../../../../infra/db/in-memory/cart-in-memory.repository';
import { CartStatus } from '../../../../domain/cart.aggregate';
import { Uuid } from '../../../../../shared/domain/value-objects/uuid.vo';
import { Quantity } from '../../../../../shared/domain/value-objects/quantity.vo';
import { Price } from '../../../../../shared/domain/value-objects/price.vo';
import { CartFakeBuilder } from '../../../../domain/fake-builders/cart-fake.builder';
import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';
import { MockStockValidationService } from '../../../../infra/services/stock-validation.service.mock';
import { MockProductValidationService } from '../../../../infra/services/product-validation.service.mock';

describe('AddItemToCartUseCase Unit Tests', () => {
  let useCase: AddItemToCartUseCase;
  let repository: CartInMemoryRepository;
  let stockValidationService: MockStockValidationService;
  let productValidationService: MockProductValidationService;

  beforeEach(() => {
    repository = new CartInMemoryRepository();
    stockValidationService = new MockStockValidationService();
    productValidationService = new MockProductValidationService();
    useCase = new AddItemToCartUseCase(repository, stockValidationService, productValidationService);
  });

  describe('execute', () => {
    it('should add item to empty cart', async () => {
      const cart = CartFakeBuilder.aCart().withEmptyCart().build();
      await repository.insert(cart);

      const productId = new Uuid();
      
      // Configurar produto no mock
      productValidationService.setProductData(productId.id, {
        product_id: productId.id,
        name: 'Test Product',
        unit_price: 25.50,
        is_active: true,
        category_id: 'cat-1',
        barcode: '123456789'
      });

      // Configurar estoque no mock
      stockValidationService.setStockData(cart.store_id, productId.id, 100);
      
      const input = new AddItemToCartInput({
        cart_id: cart.cart_id.id,
        product_id: productId.id,
        product_name: 'Test Product',
        quantity: 2,
        unit_price: 25.50
      });

      const output = await useCase.execute(input);

      expect(output.items).toHaveLength(1);
      expect(output.items[0].product_id).toBe(productId.id);
      expect(output.items[0].product_name).toBe('Test Product');
      expect(output.items[0].quantity).toBe(2);
      expect(output.items[0].unit_price).toBe(25.50);
      expect(output.items[0].subtotal).toBe(51.00); // 2 * 25.50
      expect(output.subtotal).toBe(51.00);

      const updatedCart = await repository.findById(cart.cart_id);
      expect(updatedCart?.items).toHaveLength(1);
    });

    it('should add item with product validation and use product info when not provided', async () => {
      const cart = CartFakeBuilder.aCart().withEmptyCart().build();
      await repository.insert(cart);

      const productId = new Uuid();

      // Configurar produto no mock
      productValidationService.setProductData(productId.id, {
        product_id: productId.id,
        name: 'Produto Teste',
        unit_price: 10.50,
        is_active: true,
        category_id: 'cat-1',
        barcode: '123456789'
      });

      // Configurar estoque no mock
      stockValidationService.setStockData(cart.store_id, productId.id, 100);

      const input = new AddItemToCartInput({
        cart_id: cart.cart_id.id,
        product_id: productId.id, // Produto válido no mock
        quantity: 2
      });

      const output = await useCase.execute(input);

      expect(output.items).toHaveLength(1);
      expect(output.items[0].product_id).toBe(productId.id);
      expect(output.items[0].product_name).toBe('Produto Teste'); // Nome do mock
      expect(output.items[0].unit_price).toBe(10.50); // Preço do mock
      expect(output.items[0].quantity).toBe(2);
    });

    it('should throw error when product does not exist', async () => {
      const cart = CartFakeBuilder.aCart().withEmptyCart().build();
      await repository.insert(cart);

      const productId = new Uuid();
      // Não configurar produto no mock para simular produto inexistente

      const input = new AddItemToCartInput({
        cart_id: cart.cart_id.id,
        product_id: productId.id,
        quantity: 1
      });

      await expect(useCase.execute(input)).rejects.toThrow(`Produto ${productId.id} não encontrado`);
    });

    it('should throw error when product is inactive', async () => {
      const cart = CartFakeBuilder.aCart().withEmptyCart().build();
      await repository.insert(cart);

      const productId = new Uuid();
      // Configurar produto inativo no mock
      productValidationService.setProductData(productId.id, {
        product_id: productId.id,
        name: 'Produto Inativo',
        unit_price: 10.00,
        is_active: false, // Produto inativo
        category_id: 'cat-1',
        barcode: '123456789'
      });

      const input = new AddItemToCartInput({
        cart_id: cart.cart_id.id,
        product_id: productId.id, // Produto inativo no mock
        quantity: 1
      });

      await expect(useCase.execute(input)).rejects.toThrow(`Produto ${productId.id} está inativo`);
    });

    it('should throw error when insufficient stock', async () => {
      const cart = CartFakeBuilder.aCart().withEmptyCart().build();
      await repository.insert(cart);

      const productId = new Uuid();
      // Configurar produto no mock
      productValidationService.setProductData(productId.id, {
        product_id: productId.id,
        name: 'Produto Teste',
        unit_price: 10.50,
        is_active: true,
        category_id: 'cat-1',
        barcode: '123456789'
      });

      // Configurar estoque limitado no mock
      stockValidationService.setStockData(cart.store_id, productId.id, 100);

      const input = new AddItemToCartInput({
        cart_id: cart.cart_id.id,
        product_id: productId.id,
        quantity: 150 // Mais que o estoque disponível (100)
      });

      await expect(useCase.execute(input)).rejects.toThrow('Estoque insuficiente');
    });

    it('should add multiple different items to cart', async () => {
      const cart = CartFakeBuilder.aCart().withEmptyCart().build();
      await repository.insert(cart);

      const productId1 = new Uuid();
      const productId2 = new Uuid();

      // Configurar produtos no mock
      productValidationService.setProductData(productId1.id, {
        product_id: productId1.id,
        name: 'Product 1',
        unit_price: 10.00,
        is_active: true,
        category_id: 'cat-1',
        barcode: '123456789'
      });

      productValidationService.setProductData(productId2.id, {
        product_id: productId2.id,
        name: 'Product 2',
        unit_price: 15.50,
        is_active: true,
        category_id: 'cat-1',
        barcode: '123456790'
      });

      // Configurar estoque no mock
      stockValidationService.setStockData(cart.store_id, productId1.id, 100);
      stockValidationService.setStockData(cart.store_id, productId2.id, 100);

      // Add first item
      const input1 = new AddItemToCartInput({
        cart_id: cart.cart_id.id,
        product_id: productId1.id,
        product_name: 'Product 1',
        quantity: 2,
        unit_price: 10.00
      });
      await useCase.execute(input1);

      // Add second item
      const input2 = new AddItemToCartInput({
        cart_id: cart.cart_id.id,
        product_id: productId2.id,
        product_name: 'Product 2',
        quantity: 1,
        unit_price: 15.50
      });
      const output = await useCase.execute(input2);

      expect(output.items).toHaveLength(2);
      expect(output.subtotal).toBe(35.50); // (2 * 10.00) + (1 * 15.50)
    });

    it('should update quantity when adding existing item', async () => {
      const cart = CartFakeBuilder.aCart().withEmptyCart().build();
      const productId = new Uuid();
      
      // Configurar produto no mock
      productValidationService.setProductData(productId.id, {
        product_id: productId.id,
        name: 'Test Product',
        unit_price: 10.00,
        is_active: true,
        category_id: 'cat-1',
        barcode: '123456789'
      });

      // Configurar estoque no mock
      stockValidationService.setStockData(cart.store_id, productId.id, 100);
      
      // Add initial item
      cart.addItem({
        product_id: productId,
        product_name: 'Test Product',
        quantity: new Quantity(2),
        unit_price: new Price(10.00)
      });
      
      await repository.insert(cart);

      // Add same item again
      const input = new AddItemToCartInput({
        cart_id: cart.cart_id.id,
        product_id: productId.id,
        product_name: 'Test Product',
        quantity: 3,
        unit_price: 10.00
      });

      const output = await useCase.execute(input);

      expect(output.items).toHaveLength(1);
      expect(output.items[0].quantity).toBe(5); // 2 + 3
      expect(output.items[0].subtotal).toBe(50.00); // 5 * 10.00
      expect(output.subtotal).toBe(50.00);
    });

    it('should throw NotFoundError when cart does not exist', async () => {
      const productId = new Uuid();
      
      // Configurar produto no mock
      productValidationService.setProductData(productId.id, {
        product_id: productId.id,
        name: 'Test Product',
        unit_price: 10.00,
        is_active: true,
        category_id: 'cat-1',
        barcode: '123456789'
      });

      const input = new AddItemToCartInput({
        cart_id: new Uuid().id,
        product_id: productId.id,
        product_name: 'Test Product',
        quantity: 1,
        unit_price: 10.00
      });

      await expect(useCase.execute(input)).rejects.toThrow(NotFoundError);
    });

    it('should throw error for invalid product_id format', async () => {
      const cart = CartFakeBuilder.aCart().withEmptyCart().build();
      await repository.insert(cart);

      const input = new AddItemToCartInput({
        cart_id: cart.cart_id.id,
        product_id: 'invalid-uuid-format',
        product_name: 'Test Product',
        quantity: 1,
        unit_price: 10.00
      });

      await expect(useCase.execute(input)).rejects.toThrow();
    });

    it('should throw error for invalid quantity', async () => {
      const cart = CartFakeBuilder.aCart().withEmptyCart().build();
      await repository.insert(cart);

      const productId = new Uuid();
      
      // Configurar produto no mock
      productValidationService.setProductData(productId.id, {
        product_id: productId.id,
        name: 'Test Product',
        unit_price: 10.00,
        is_active: true,
        category_id: 'cat-1',
        barcode: '123456789'
      });

      // Configurar estoque no mock
      stockValidationService.setStockData(cart.store_id, productId.id, 100);

      const input = new AddItemToCartInput({
        cart_id: cart.cart_id.id,
        product_id: productId.id,
        product_name: 'Test Product',
        quantity: 0, // Invalid quantity
        unit_price: 10.00
      });

      await expect(useCase.execute(input)).rejects.toThrow();
    });

    it('should throw error for invalid unit_price', async () => {
      const cart = CartFakeBuilder.aCart().withEmptyCart().build();
      await repository.insert(cart);

      const productId = new Uuid();
      
      // Configurar produto no mock
      productValidationService.setProductData(productId.id, {
        product_id: productId.id,
        name: 'Test Product',
        unit_price: 10.00,
        is_active: true,
        category_id: 'cat-1',
        barcode: '123456789'
      });

      // Configurar estoque no mock
      stockValidationService.setStockData(cart.store_id, productId.id, 100);

      const input = new AddItemToCartInput({
        cart_id: cart.cart_id.id,
        product_id: productId.id,
        product_name: 'Test Product',
        quantity: 1,
        unit_price: -5.00 // Invalid price
      });

      await expect(useCase.execute(input)).rejects.toThrow();
    });

    it('should use product name from service when empty product_name is provided', async () => {
      const cart = CartFakeBuilder.aCart().withEmptyCart().build();
      await repository.insert(cart);

      const productId = new Uuid();
      
      // Configurar produto no mock
      productValidationService.setProductData(productId.id, {
        product_id: productId.id,
        name: 'Product From Service',
        unit_price: 10.00,
        is_active: true,
        category_id: 'cat-1',
        barcode: '123456789'
      });

      // Configurar estoque no mock
      stockValidationService.setStockData(cart.store_id, productId.id, 100);

      const input = new AddItemToCartInput({
        cart_id: cart.cart_id.id,
        product_id: productId.id,
        product_name: '', // Empty name should use service data
        quantity: 1,
        unit_price: 10.00
      });

      const output = await useCase.execute(input);
      
      expect(output.items[0].product_name).toBe('Product From Service');
    });

    it('should handle large quantities and prices', async () => {
      const cart = CartFakeBuilder.aCart().withEmptyCart().build();
      await repository.insert(cart);

      const productId = new Uuid();
      
      // Configurar produto no mock
      productValidationService.setProductData(productId.id, {
        product_id: productId.id,
        name: 'Expensive Product',
        unit_price: 999.99,
        is_active: true,
        category_id: 'cat-1',
        barcode: '123456789'
      });

      // Configurar estoque no mock
      stockValidationService.setStockData(cart.store_id, productId.id, 1000);

      const input = new AddItemToCartInput({
        cart_id: cart.cart_id.id,
        product_id: productId.id,
        product_name: 'Expensive Product',
        quantity: 100,
        unit_price: 999.99
      });

      const output = await useCase.execute(input);

      expect(output.items[0].quantity).toBe(100);
      expect(output.items[0].unit_price).toBe(999.99);
      expect(output.items[0].subtotal).toBe(99999.00); // 100 * 999.99
      expect(output.subtotal).toBe(99999.00);
    });

    it('should maintain cart status and other properties', async () => {
      const cart = CartFakeBuilder.aCart()
        .withEmptyCart()
        .withActiveStatus()
        .build();
      await repository.insert(cart);

      const productId = new Uuid();
      
      // Configurar produto no mock
      productValidationService.setProductData(productId.id, {
        product_id: productId.id,
        name: 'Test Product',
        unit_price: 10.00,
        is_active: true,
        category_id: 'cat-1',
        barcode: '123456789'
      });

      // Configurar estoque no mock
      stockValidationService.setStockData(cart.store_id, productId.id, 100);

      const input = new AddItemToCartInput({
        cart_id: cart.cart_id.id,
        product_id: productId.id,
        product_name: 'Test Product',
        quantity: 1,
        unit_price: 10.00
      });

      const output = await useCase.execute(input);

      expect(output.cart_id).toBe(cart.cart_id.id);
      expect(output.client_id).toBe(cart.client_id.id);
      expect(output.store_id).toBe(cart.store_id);
      expect(output.status).toBe(CartStatus.ACTIVE);
      expect(output.expires_at).toEqual(cart.expires_at);
    });
  });
});