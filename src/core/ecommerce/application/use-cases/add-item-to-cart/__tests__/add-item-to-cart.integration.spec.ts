import { AddItemToCartUseCase } from '../add-item-to-cart.use-case';
import { AddItemToCartInput } from '../add-item-to-cart.input';
import { CartInMemoryRepository } from '../../../../infra/db/in-memory/cart-in-memory.repository';
import { StockValidationService } from '../../../../infra/services/stock-validation.service';
import { ProductValidationService } from '../../../../infra/services/product-validation.service';
import { ProductInMemoryRepository } from '../../../../../product/infra/db/in-memory/product-in-memory.repository';
import { InventoryInMemoryRepository } from '../../../../../inventory/infra/db/in-memory/inventory-in-memory.repository';
import { CartFakeBuilder } from '../../../../domain/fake-builders/cart-fake.builder';
import { Product } from '../../../../../product/domain/product.aggregate';
import { Inventory } from '../../../../../inventory/domain/inventory.aggregate';
import { Uuid } from '../../../../../shared/domain/value-objects/uuid.vo';

describe('AddItemToCartUseCase Integration Tests', () => {
  let useCase: AddItemToCartUseCase;
  let cartRepository: CartInMemoryRepository;
  let productRepository: ProductInMemoryRepository;
  let inventoryRepository: InventoryInMemoryRepository;
  let stockValidationService: StockValidationService;
  let productValidationService: ProductValidationService;
  
  const storeId = 'store-123';
  
  beforeEach(() => {
    cartRepository = new CartInMemoryRepository();
    productRepository = new ProductInMemoryRepository();
    inventoryRepository = new InventoryInMemoryRepository();
    
    stockValidationService = new StockValidationService(inventoryRepository);
    productValidationService = new ProductValidationService(productRepository);
    
    useCase = new AddItemToCartUseCase(
      cartRepository,
      stockValidationService,
      productValidationService
    );
  });
  
  describe('Real integration with Product and Inventory modules', () => {
    it('should successfully add item to cart with real product and inventory validation', async () => {
      // Criar carrinho
      const cart = CartFakeBuilder.aCart()
        .withStoreId(storeId)
        .withEmptyCart()
        .build();
      await cartRepository.insert(cart);
      
      // Criar produto no repositório
      const product = Product.create({
        store_id: storeId,
        category_id: 'category-123',
        name: 'Coca-Cola 2L',
        barcode: '7894900011517',
        price: 5.99,
        brand: 'Coca-Cola'
      });
      await productRepository.insert(product);
      
      // Criar inventário para o produto
      const inventory = Inventory.create({
        store_id: storeId,
        product_id: product.product_id.id,
        quantity: 50,
        min_stock: 5,
        max_stock: 200,
        unit_cost: 3.50,
        location: 'A1-B2',
        supplier_id: 'supplier-123'
      });
      await inventoryRepository.insert(inventory);
      
      // Executar use case
      const input = new AddItemToCartInput({
        cart_id: cart.cart_id.id,
        product_id: product.product_id.id,
        product_name: 'Coca-Cola 2L',
        quantity: 2,
        unit_price: 5.99
      });
      
      const result = await useCase.execute(input);
      
      // Verificar resultado
      expect(result.items).toHaveLength(1);
      expect(result.items[0].product_id).toBe(product.product_id.id);
      expect(result.items[0].product_name).toBe('Coca-Cola 2L');
      expect(result.items[0].quantity).toBe(2);
      expect(result.items[0].unit_price).toBe(5.99);
      expect(result.subtotal).toBe(11.98);
    });
    
    it('should fail when product does not exist', async () => {
      // Criar carrinho
      const cart = CartFakeBuilder.aCart()
        .withStoreId(storeId)
        .withEmptyCart()
        .build();
      await cartRepository.insert(cart);
      
      const nonExistentProductId = new Uuid().id;
      
      // Executar use case
      const input = new AddItemToCartInput({
        cart_id: cart.cart_id.id,
        product_id: nonExistentProductId,
        product_name: 'Non-existent Product',
        quantity: 1,
        unit_price: 10.00
      });
      
      await expect(useCase.execute(input))
        .rejects
        .toThrow('Product validation failed');
    });
    
    it('should fail when product is inactive', async () => {
      // Criar carrinho
      const cart = CartFakeBuilder.aCart()
        .withStoreId(storeId)
        .withEmptyCart()
        .build();
      await cartRepository.insert(cart);
      
      // Criar produto inativo
      const product = Product.create({
        store_id: storeId,
        category_id: 'category-123',
        name: 'Produto Inativo',
        barcode: '1111111111111',
        price: 10.00
      });
      product.deactivate();
      await productRepository.insert(product);
      
      // Executar use case
      const input = new AddItemToCartInput({
        cart_id: cart.cart_id.id,
        product_id: product.product_id.id,
        product_name: 'Produto Inativo',
        quantity: 1,
        unit_price: 10.00
      });
      
      await expect(useCase.execute(input))
        .rejects
        .toThrow('Product validation failed');
    });
    
    it('should fail when insufficient stock', async () => {
      // Criar carrinho
      const cart = CartFakeBuilder.aCart()
        .withStoreId(storeId)
        .withEmptyCart()
        .build();
      await cartRepository.insert(cart);
      
      // Criar produto
      const product = Product.create({
        store_id: storeId,
        category_id: 'category-123',
        name: 'Produto com Pouco Estoque',
        barcode: '2222222222222',
        price: 15.00
      });
      await productRepository.insert(product);
      
      // Criar inventário com pouco estoque
      const inventory = Inventory.create({
        store_id: storeId,
        product_id: product.product_id.id,
        quantity: 2, // Apenas 2 unidades
        min_stock: 1,
        max_stock: 100,
        unit_cost: 10.00,
        location: 'A1-B3',
        supplier_id: 'supplier-123'
      });
      await inventoryRepository.insert(inventory);
      
      // Tentar adicionar 5 unidades (mais que o disponível)
      const input = new AddItemToCartInput({
        cart_id: cart.cart_id.id,
        product_id: product.product_id.id,
        product_name: 'Produto com Pouco Estoque',
        quantity: 5,
        unit_price: 15.00
      });
      
      await expect(useCase.execute(input))
        .rejects
        .toThrow('Estoque insuficiente');
    });
    
    it('should fail when product belongs to different store (multi-tenant)', async () => {
      const otherStoreId = 'store-456';
      
      // Criar carrinho na loja 123
      const cart = CartFakeBuilder.aCart()
        .withStoreId(storeId)
        .withEmptyCart()
        .build();
      await cartRepository.insert(cart);
      
      // Criar produto na loja 456
      const product = Product.create({
        store_id: otherStoreId,
        category_id: 'category-123',
        name: 'Produto de Outra Loja',
        barcode: '3333333333333',
        price: 20.00
      });
      await productRepository.insert(product);
      
      // Criar inventário na loja 456
      const inventory = Inventory.create({
        store_id: otherStoreId,
        product_id: product.product_id.id,
        quantity: 10,
        min_stock: 2,
        max_stock: 50,
        unit_cost: 15.00,
        location: 'A1-B4',
        supplier_id: 'supplier-123'
      });
      await inventoryRepository.insert(inventory);
      
      // Tentar adicionar produto de outra loja ao carrinho
      const input = new AddItemToCartInput({
        cart_id: cart.cart_id.id,
        product_id: product.product_id.id,
        product_name: 'Produto de Outra Loja',
        quantity: 1,
        unit_price: 20.00
      });
      
      await expect(useCase.execute(input))
        .rejects
        .toThrow('Product validation failed');
    });
    
    it('should handle multiple inventory items for same product (FIFO)', async () => {
      // Criar carrinho
      const cart = CartFakeBuilder.aCart()
        .withStoreId(storeId)
        .withEmptyCart()
        .build();
      await cartRepository.insert(cart);
      
      // Criar produto
      const product = Product.create({
        store_id: storeId,
        category_id: 'category-123',
        name: 'Produto com Múltiplos Lotes',
        barcode: '4444444444444',
        price: 8.50
      });
      await productRepository.insert(product);
      
      // Criar múltiplos inventários para o mesmo produto
      const inventory1 = Inventory.create({
        store_id: storeId,
        product_id: product.product_id.id,
        quantity: 10,
        min_stock: 2,
        max_stock: 50,
        unit_cost: 5.00,
        location: 'A1-B5',
        supplier_id: 'supplier-123'
      });
      
      const inventory2 = Inventory.create({
        store_id: storeId,
        product_id: product.product_id.id,
        quantity: 15,
        min_stock: 3,
        max_stock: 75,
        unit_cost: 6.00,
        location: 'A1-B6',
        supplier_id: 'supplier-456'
      });
      
      await inventoryRepository.insert(inventory1);
      await inventoryRepository.insert(inventory2);
      
      // Executar use case
      const input = new AddItemToCartInput({
        cart_id: cart.cart_id.id,
        product_id: product.product_id.id,
        product_name: 'Produto com Múltiplos Lotes',
        quantity: 20, // Quantidade que requer ambos os lotes
        unit_price: 8.50
      });
      
      const result = await useCase.execute(input);
      
      // Verificar que o item foi adicionado com sucesso
      expect(result.items).toHaveLength(1);
      expect(result.items[0].quantity).toBe(20);
      expect(result.subtotal).toBe(170.00); // 20 * 8.50
    });
  });
});