import { Cart, CartId, CartStatus, CartItem } from '../cart.aggregate';
import { Uuid } from '../../../shared/domain/value-objects/uuid.vo';
import { Quantity } from '../../../shared/domain/value-objects/quantity.vo';
import { Price } from '../../../shared/domain/value-objects/price.vo';
import { Money } from '../../../shared/domain/value-objects/money.vo';
import { CartFakeBuilder } from '../fake-builders/cart-fake.builder';
import { CartItemFakeBuilder } from '../fake-builders/cart-item-fake.builder';

describe('Cart Aggregate Unit Tests', () => {
  describe('CartId', () => {
    it('should create a valid CartId', () => {
      const cartId = new CartId();
      expect(cartId).toBeInstanceOf(CartId);
      expect(cartId.id).toBeDefined();
    });

    it('should create CartId with provided value', () => {
      const uuid = new Uuid().id;
      const cartId = new CartId(uuid);
      expect(cartId.id).toBe(uuid);
    });
  });

  describe('CartItem', () => {
    it('should create a valid CartItem', () => {
      const productId = new Uuid();
      const productName = 'Test Product';
      const quantity = new Quantity(2);
      const unitPrice = new Price(10.50);
      const subtotal = new Money(21.00);

      const cartItem = CartItemFakeBuilder.aCartItem()
        .withProductId(productId)
        .withProductName(productName)
        .withQuantity(quantity)
        .withUnitPrice(unitPrice)
        .withSubtotal(subtotal)
        .build();

      expect(cartItem.product_id).toBe(productId);
      expect(cartItem.product_name).toBe(productName);
      expect(cartItem.quantity).toBe(quantity);
      expect(cartItem.unit_price).toBe(unitPrice);
      expect(cartItem.subtotal).toBe(subtotal);
    });

    it('should create CartItem with calculated subtotal', () => {
      const productId = new Uuid();
      const quantity = new Quantity(3);
      const unitPrice = new Price(15.75);

      const cartItem = CartItemFakeBuilder.aCartItem()
        .withProductId(productId)
        .withProductName('Test Product')
        .withQuantity(quantity)
        .withUnitPrice(unitPrice)
        .build();

      expect(cartItem.subtotal.value).toBe(47.25); // 3 * 15.75
    });

    it('should update CartItem quantity and recalculate subtotal', () => {
      const cartItem = CartItemFakeBuilder.aCartItem()
        .withProductId(new Uuid())
        .withProductName('Test Product')
        .withQuantity(new Quantity(2))
        .withUnitPrice(new Price(10.00))
        .build();
      const newQuantity = new Quantity(5);
      const expectedSubtotal = newQuantity.value * cartItem.unit_price.value;

      const updatedCartItem = cartItem.updateQuantity(newQuantity);

      expect(updatedCartItem.quantity).toStrictEqual(newQuantity);
      expect(updatedCartItem.subtotal.value).toBe(expectedSubtotal);
    });
  });

  describe('Cart Aggregate', () => {
    describe('Cart Creation', () => {
      it('should create a valid Cart', () => {
        const clientId = new Uuid();
        const storeId = 'store-123';
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        const cart = CartFakeBuilder.aCart()
          .withClientId(clientId)
          .withStoreId(storeId)
          .withExpiresAt(expiresAt)
          .withActiveStatus()
          .withItems([])
          .build();

        expect(cart.cart_id).toBeInstanceOf(CartId);
        expect(cart.client_id).toStrictEqual(clientId);
        expect(cart.store_id).toBe(storeId);
        expect(cart.items).toEqual([]);
        expect(cart.status).toBe(CartStatus.ACTIVE);
        expect(cart.subtotal.value).toBe(0);
        expect(cart.expires_at).toBe(expiresAt);
        expect(cart.created_at).toBeInstanceOf(Date);
        expect(cart.updated_at).toBeInstanceOf(Date);
      });

      it('should create Cart with default expiration date', () => {
        const cart = CartFakeBuilder.aCart()
          .withClientId(new Uuid())
          .withStoreId('store-123')
          .withActiveStatus()
          .build();

        const expectedDate = new Date();
        expectedDate.setDate(expectedDate.getDate() + 7);
        
        expect(cart.expires_at.getDate()).toBe(expectedDate.getDate());
      });
    });

    describe('Item Management', () => {
      let cart: Cart;
      let productId: Uuid;
      let quantity: Quantity;
      let unitPrice: Price;

      beforeEach(() => {
        cart = CartFakeBuilder.aCart()
          .withClientId(new Uuid())
          .withStoreId('store-123')
          .withActiveStatus()
          .withEmptyCart()
          .build();
        productId = new Uuid();
        quantity = new Quantity(2);
        unitPrice = new Price(25.50);
      });

      it('should add item to cart', () => {
        cart.addItem({
          product_id: productId,
          product_name: 'Test Product',
          quantity,
          unit_price: unitPrice
        });

        expect(cart.items).toHaveLength(1);
        expect(cart.items[0].product_id).toBe(productId);
        expect(cart.items[0].quantity).toBe(quantity);
        expect(cart.subtotal.value).toBe(51.00); // 2 * 25.50
      });

      it('should update quantity when adding existing item', () => {
        // Add item first time
        cart.addItem({
          product_id: productId,
          product_name: 'Test Product',
          quantity,
          unit_price: unitPrice
        });

        // Add same item again
        const additionalQuantity = new Quantity(3);
        cart.addItem({
          product_id: productId,
          product_name: 'Test Product',
          quantity: additionalQuantity,
          unit_price: unitPrice
        });

        expect(cart.items).toHaveLength(1);
        expect(cart.items[0].quantity.value).toBe(5); // 2 + 3
        expect(cart.subtotal.value).toBe(127.50); // 5 * 25.50
      });

      it('should remove item from cart', () => {
        cart.addItem({
          product_id: productId,
          product_name: 'Test Product',
          quantity,
          unit_price: unitPrice
        });

        cart.removeItem(productId);

        expect(cart.items).toHaveLength(0);
        expect(cart.subtotal.value).toBe(0);
      });

      it('should update item quantity', () => {
        cart.addItem({
          product_id: productId,
          product_name: 'Test Product',
          quantity,
          unit_price: unitPrice
        });

        const newQuantity = new Quantity(4);
        cart.updateItemQuantity(productId, newQuantity);

        expect(cart.items[0].quantity).toBe(newQuantity);
        expect(cart.subtotal.value).toBe(102.00); // 4 * 25.50
      });

      it('should clear all items', () => {
        cart.addItem({
          product_id: productId,
          product_name: 'Test Product 1',
          quantity,
          unit_price: unitPrice
        });

        cart.addItem({
          product_id: new Uuid(),
          product_name: 'Test Product 2',
          quantity: new Quantity(1),
          unit_price: new Price(10.00)
        });

        cart.clear();

        expect(cart.items).toHaveLength(0);
        expect(cart.subtotal.value).toBe(0);
      });
    });

    describe('Status Management', () => {
      let cart: Cart;

      beforeEach(() => {
        cart = CartFakeBuilder.aCart()
          .withClientId(new Uuid())
          .withStoreId(new Uuid().id)
          .withActiveStatus()
          .withEmptyCart()
          .build();
      });

      it('should mark cart as abandoned', () => {
        cart.markAsAbandoned();
        expect(cart.status).toBe(CartStatus.ABANDONED);
      });

      it('should mark cart as converted', () => {
        cart.addItem({
          product_id: new Uuid(),
          product_name: 'Test Product',
          quantity: new Quantity(1),
          unit_price: new Price(10.00)
        });
        cart.markAsConverted();
        expect(cart.status).toBe(CartStatus.CONVERTED);
      });

      it('should mark cart as expired', () => {
        cart.markAsExpired();
        expect(cart.status).toBe(CartStatus.EXPIRED);
      });
    });

    describe('Query Methods', () => {
      it('should check if cart is empty', () => {
        const emptyCart = CartFakeBuilder.aCart()
          .withClientId(new Uuid())
          .withStoreId(new Uuid().id)
          .withActiveStatus()
          .withEmptyCart()
          .build();
        const cartWithItems = CartFakeBuilder.aCart()
          .withClientId(new Uuid())
          .withStoreId(new Uuid().id)
          .withActiveStatus()
          .withEmptyCart()
          .build();
        cartWithItems.addItem({
          product_id: new Uuid(),
          product_name: 'Test Product 1',
          quantity: new Quantity(1),
          unit_price: new Price(10.00)
        });
        cartWithItems.addItem({
          product_id: new Uuid(),
          product_name: 'Test Product 2',
          quantity: new Quantity(2),
          unit_price: new Price(15.00)
        });

        expect(emptyCart.isEmpty()).toBe(true);
        expect(cartWithItems.isEmpty()).toBe(false);
      });

      it('should check if cart is expired', () => {
        const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
        const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day from now

        const expiredCart = CartFakeBuilder.aCart()
          .withClientId(new Uuid())
          .withStoreId(new Uuid().id)
          .withExpiresAt(pastDate)
          .withActiveStatus()
          .build();
        const activeCart = CartFakeBuilder.aCart()
          .withClientId(new Uuid())
          .withStoreId(new Uuid().id)
          .withExpiresAt(futureDate)
          .withActiveStatus()
          .build();

        expect(expiredCart.isExpired()).toBe(true);
        expect(activeCart.isExpired()).toBe(false);
      });

      it('should get item count', () => {
        const cart = CartFakeBuilder.aCart()
          .withClientId(new Uuid())
          .withStoreId('store-123')
          .withActiveStatus()
          .withEmptyCart()
          .build();
        
        const item1 = CartItemFakeBuilder.aCartItem()
          .withProductId(new Uuid())
          .withProductName('Test Product 1')
          .withQuantity(new Quantity(1))
          .withUnitPrice(new Price(10.00))
          .build();
        const item2 = CartItemFakeBuilder.aCartItem()
          .withProductId(new Uuid())
          .withProductName('Test Product 2')
          .withQuantity(new Quantity(2))
          .withUnitPrice(new Price(15.00))
          .build();
        const item3 = CartItemFakeBuilder.aCartItem()
          .withProductId(new Uuid())
          .withProductName('Test Product 3')
          .withQuantity(new Quantity(1))
          .withUnitPrice(new Price(20.00))
          .build();
        cart.addItem(item1);
        cart.addItem(item2);
        cart.addItem(item3);
        expect(cart.getUniqueItemsCount()).toBe(3);
      });

      it('should find item by product id', () => {
        const cart = CartFakeBuilder.aCart()
          .withClientId(new Uuid())
          .withStoreId(new Uuid().id)
          .withActiveStatus()
          .withEmptyCart()
          .build();
        const productId = new Uuid();
        
        cart.addItem({
          product_id: productId,
          product_name: 'Test Product',
          quantity: new Quantity(1),
          unit_price: new Price(10.00)
        });

        const foundItem = cart.getItem(productId);
        expect(foundItem).toBeDefined();
        expect(foundItem?.product_id).toBe(productId);

        const notFoundItem = cart.getItem(new Uuid());
        expect(notFoundItem).toBeNull();
      });
    });

    describe('Validation', () => {
      it('should validate cart with valid data', () => {
        const cart = Cart.create({
          client_id: new Uuid().id,
          store_id: new Uuid().id
        });
        expect(cart.notification.hasErrors()).toBe(false);
      });

      it('should invalidate cart with invalid client_id', () => {
        expect(() => {
          Cart.create({
            client_id: null as any,
            store_id: new Uuid().id
          });
        }).toThrow();
      });

      it('should invalidate cart with empty store_id', () => {
        expect(() => {
          Cart.create({
            client_id: 'client-123',
            store_id: ''
          });
        }).toThrow();
      });
    });

    describe('Events', () => {
      it('should register CartCreatedEvent when cart is created', () => {
        const cart = Cart.create({
          client_id: new Uuid().id,
          store_id: new Uuid().id
        });

        const events = cart.getUncommittedEvents();
        expect(events).toHaveLength(1);
        expect(events[0].constructor.name).toBe('CartCreatedEvent');
      });

      it('should register CartItemAddedEvent when item is added', () => {
        const cart = Cart.create({
          client_id: new Uuid().id,
          store_id: new Uuid().id
        });
        cart.clearEvents(); // Clear creation event

        cart.addItem({
          product_id: new Uuid(),
          product_name: 'Test Product',
          quantity: new Quantity(1),
          unit_price: new Price(10.00)
        });

        const events = cart.getUncommittedEvents();
        expect(events).toHaveLength(2); // CartUpdatedEvent + CartItemAddedEvent
        expect(events.some(e => e.constructor.name === 'CartItemAddedEvent')).toBe(true);
      });

      it('should register CartItemRemovedEvent when item is removed', () => {
        const cart = Cart.create({
          client_id: new Uuid().id,
          store_id: new Uuid().id
        });
        
        const item = CartItem.create({
          product_id: new Uuid(),
          product_name: 'Test Product',
          quantity: new Quantity(1),
          unit_price: new Price(10.00)
        });
        cart.addItem(item);
        const productId = cart.items[0].product_id;
        cart.clearEvents(); // Clear previous events

        cart.removeItem(productId);

        const events = cart.getUncommittedEvents();
        expect(events).toHaveLength(2); // CartUpdatedEvent + CartItemRemovedEvent
        expect(events.some(e => e.constructor.name === 'CartItemRemovedEvent')).toBe(true);
      });

      it('should register CartClearedEvent when cart is cleared', () => {
        const cart = Cart.create({
          client_id: new Uuid().id,
          store_id: new Uuid().id
        });
        
        const item1 = CartItem.create({
          product_id: new Uuid(),
          product_name: 'Test Product 1',
          quantity: new Quantity(1),
          unit_price: new Price(10.00)
        });
        const item2 = CartItem.create({
          product_id: new Uuid(),
          product_name: 'Test Product 2',
          quantity: new Quantity(2),
          unit_price: new Price(15.00)
        });
        cart.addItem(item1);
        cart.addItem(item2);
        cart.clearEvents(); // Clear previous events

        cart.clear();

        const events = cart.getUncommittedEvents();
        expect(events).toHaveLength(2); // CartUpdatedEvent + CartClearedEvent
        expect(events.some(e => e.constructor.name === 'CartClearedEvent')).toBe(true);
      });
    });
  });
});