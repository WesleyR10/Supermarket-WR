import { CreateCartUseCase } from '../create-cart.use-case';
import { CreateCartInput } from '../create-cart.input';
import { CartInMemoryRepository } from '../../../../infra/db/in-memory/cart-in-memory.repository';
import { Cart, CartStatus } from '../../../../domain/cart.aggregate';
import { Uuid } from '../../../../../shared/domain/value-objects/uuid.vo';
import { CartFakeBuilder } from '../../../../domain/fake-builders/cart-fake.builder';

describe('CreateCartUseCase Unit Tests', () => {
  let useCase: CreateCartUseCase;
  let repository: CartInMemoryRepository;

  beforeEach(() => {
    repository = new CartInMemoryRepository();
    useCase = new CreateCartUseCase(repository);
  });

  describe('execute', () => {
    it('should create a new cart when no active cart exists', async () => {
      const clientId = new Uuid();
      const storeId = 'store-123';
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const input = new CreateCartInput({
        client_id: clientId.id,
        store_id: storeId,
        expires_at: expiresAt.toISOString()
      });

      const output = await useCase.execute(input);

      expect(output.client_id).toBe(clientId.id);
      expect(output.store_id).toBe(storeId);
      expect(output.status).toBe(CartStatus.ACTIVE);
      expect(output.items).toEqual([]);
      expect(output.subtotal).toBe(0);
      expect(new Date(output.expires_at)).toEqual(expiresAt);

      const savedCart = await repository.findById(output.cart_id as any);
      expect(savedCart).toBeDefined();
    });

    it('should create cart with default expiration date when not provided', async () => {
      const clientId = new Uuid();
      const storeId = 'store-123';

      const input = new CreateCartInput({
        client_id: clientId.id,
        store_id: storeId
      });

      const output = await useCase.execute(input);

      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + 7);
      
      expect(new Date(output.expires_at).getDate()).toBe(expectedDate.getDate());
    });

    it('should return existing active cart when one exists for client and store', async () => {
      const clientId = new Uuid();
      const storeId = 'store-123';

      // Create existing cart
      const existingCart = CartFakeBuilder.aCart()
        .withClientId(clientId)
        .withStoreId(storeId)
        .withActiveStatus()
        .build();
      
      await repository.insert(existingCart);

      const input = new CreateCartInput({
        client_id: clientId.id,
        store_id: storeId
      });

      const output = await useCase.execute(input);

      expect(output.cart_id).toBe(existingCart.cart_id.id);
      expect(output.client_id).toBe(clientId.id);
      expect(output.store_id).toBe(storeId);
      expect(output.status).toBe(CartStatus.ACTIVE);

      // Should not create a new cart
      const allCarts = await repository.findAll();
      expect(allCarts).toHaveLength(1);
    });

    it('should create new cart when existing cart is not active', async () => {
      const clientId = new Uuid();
      const storeId = 'store-123';

      // Create existing abandoned cart
      const existingCart = CartFakeBuilder.aCart()
        .withClientId(clientId)
        .withStoreId(storeId)
        .withAbandonedStatus()
        .build();
      
      await repository.insert(existingCart);

      const input = new CreateCartInput({
        client_id: clientId.id,
        store_id: storeId
      });

      const output = await useCase.execute(input);

      expect(output.cart_id).not.toBe(existingCart.cart_id);
      expect(output.status).toBe(CartStatus.ACTIVE);

      // Should have two carts now
      const allCarts = await repository.findAll();
      expect(allCarts).toHaveLength(2);
    });

    it('should throw error for invalid client_id', async () => {
      const input = new CreateCartInput({
        client_id: 'invalid-uuid',
        store_id: 'store-123'
      });

      await expect(useCase.execute(input)).rejects.toThrow();
    });

    it('should throw validation error for empty store_id', async () => {
      const input = new CreateCartInput({
        client_id: new Uuid().id,
        store_id: ''
      });

      await expect(useCase.execute(input)).rejects.toThrow();
    });

    it('should handle different stores for same client', async () => {
      const clientId = new Uuid();
      const storeId1 = 'store-123';
      const storeId2 = 'store-456';

      // Create cart for store 1
      const input1 = new CreateCartInput({
        client_id: clientId.id,
        store_id: storeId1
      });
      const output1 = await useCase.execute(input1);

      // Create cart for store 2
      const input2 = new CreateCartInput({
        client_id: clientId.id,
        store_id: storeId2
      });
      const output2 = await useCase.execute(input2);

      expect(output1.cart_id).not.toBe(output2.cart_id);
      expect(output1.store_id).toBe(storeId1);
      expect(output2.store_id).toBe(storeId2);

      const allCarts = await repository.findAll();
      expect(allCarts).toHaveLength(2);
    });
  });
});