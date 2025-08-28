import { CleanupExpiredCartsUseCase } from '../cleanup-expired-carts.use-case';
import { CleanupExpiredCartsInput } from '../cleanup-expired-carts.input';
import { CartInMemoryRepository } from '../../../../infra/db/in-memory/cart-in-memory.repository';
import { Cart, CartStatus } from '../../../../domain/cart.aggregate';
import { ICartRepository } from '../../../../domain/repositories/cart.repository.interface';
import { Uuid } from '../../../../../shared/domain/value-objects/uuid.vo';
import { Quantity } from '../../../../../shared/domain/value-objects/quantity.vo';
import { Price } from '../../../../../shared/domain/value-objects/price.vo';

describe('CleanupExpiredCartsUseCase Unit Tests', () => {
  let useCase: CleanupExpiredCartsUseCase;
  let repository: jest.Mocked<ICartRepository>;

  beforeEach(() => {
    repository = {
      findExpiredCarts: jest.fn(),
      update: jest.fn(),
    } as any;
    useCase = new CleanupExpiredCartsUseCase(repository);
  });

  describe('execute', () => {
    it('should cleanup expired carts successfully', async () => {
      // Arrange
      const input = new CleanupExpiredCartsInput({
        expiry_hours: 24,
        batch_size: 2
      });

      const expiredCart1 = Cart.create({
        client_id: new Uuid().id,
        store_id: 'store-1',
        expires_at: new Date(Date.now() - 25 * 60 * 60 * 1000) // 25 horas atrás
      });

      const expiredCart2 = Cart.create({
        client_id: new Uuid().id,
        store_id: 'store-1',
        expires_at: new Date(Date.now() - 26 * 60 * 60 * 1000) // 26 horas atrás
      });

      // Primeiro lote com 2 carrinhos
      repository.findExpiredCarts
        .mockResolvedValueOnce([expiredCart1, expiredCart2])
        .mockResolvedValueOnce([]); // Segundo lote vazio

      repository.update.mockResolvedValue();

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.cleaned_carts_count).toBe(2);
      expect(result.processed_batches).toBe(1);
      expect(result.errors).toHaveLength(0);
      expect(result.total_processing_time_ms).toBeGreaterThanOrEqual(0);

      expect(repository.findExpiredCarts).toHaveBeenCalledTimes(2);
      expect(repository.update).toHaveBeenCalledTimes(2);

      // Verificar se os carrinhos foram marcados como expirados
      expect(expiredCart1.status).toBe(CartStatus.EXPIRED);
      expect(expiredCart2.status).toBe(CartStatus.EXPIRED);
    });

    it('should handle empty result gracefully', async () => {
      // Arrange
      const input = new CleanupExpiredCartsInput({
        expiry_hours: 24,
        batch_size: 100
      });

      repository.findExpiredCarts.mockResolvedValue([]);

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.cleaned_carts_count).toBe(0);
      expect(result.processed_batches).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(repository.findExpiredCarts).toHaveBeenCalledTimes(1);
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      const input = new CleanupExpiredCartsInput({
        expiry_hours: 24,
        batch_size: 100
      });

      const error = new Error('Database connection failed');
      repository.findExpiredCarts.mockRejectedValue(error);

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.cleaned_carts_count).toBe(0);
      expect(result.processed_batches).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Erro ao processar lote 1');
      expect(result.errors[0]).toContain('Database connection failed');
    });

    it('should handle update errors for individual carts', async () => {
      // Arrange
      const input = new CleanupExpiredCartsInput({
        expiry_hours: 24,
        batch_size: 2
      });

      const expiredCart1 = Cart.create({
        client_id: new Uuid().id,
        store_id: 'store-1',
        expires_at: new Date(Date.now() - 25 * 60 * 60 * 1000)
      });

      const expiredCart2 = Cart.create({
        client_id: new Uuid().id,
        store_id: 'store-1',
        expires_at: new Date(Date.now() - 26 * 60 * 60 * 1000)
      });

      repository.findExpiredCarts
        .mockResolvedValueOnce([expiredCart1, expiredCart2])
        .mockResolvedValueOnce([]);

      repository.update
        .mockResolvedValueOnce() // Primeiro carrinho atualiza com sucesso
        .mockRejectedValueOnce(new Error('Update failed')); // Segundo falha

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.cleaned_carts_count).toBe(1); // Apenas o primeiro foi limpo
      expect(result.processed_batches).toBe(1); // Apenas um batch foi processado
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Erro ao processar carrinho');
      expect(result.errors[0]).toContain('Update failed');
    });

    it('should use default values when not provided', async () => {
      // Arrange
      const input = new CleanupExpiredCartsInput();
      repository.findExpiredCarts.mockResolvedValue([]);

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(repository.findExpiredCarts).toHaveBeenCalledWith(
        expect.any(Date),
        100 // batch_size padrão
      );

      // Verificar se a data de expiração está correta (24 horas atrás)
      const callArgs = repository.findExpiredCarts.mock.calls[0];
      const expiryDate = callArgs[0] as Date;
      const expectedTime = Date.now() - (24 * 60 * 60 * 1000);
      const timeDiff = Math.abs(expiryDate.getTime() - expectedTime);
      expect(timeDiff).toBeLessThan(1000); // Diferença menor que 1 segundo
    });

    it('should skip already converted carts', async () => {
      // Arrange
      const input = new CleanupExpiredCartsInput({
        expiry_hours: 24,
        batch_size: 2
      });

      const expiredCart = Cart.create({
        client_id: new Uuid().id,
        store_id: 'store-1',
        expires_at: new Date(Date.now() - 25 * 60 * 60 * 1000)
      });

      const convertedCart = Cart.create({
        client_id: new Uuid().id,
        store_id: 'store-1',
        expires_at: new Date(Date.now() + 60 * 60 * 1000) // Futuro para permitir adicionar item
      });
      
      // Adicionar item ao carrinho antes de marcar como convertido
      convertedCart.addItem({
        product_id: new Uuid(),
        product_name: 'Test Product',
        quantity: new Quantity(1),
        unit_price: new Price(10.00)
      });
      convertedCart.markAsConverted();
      
      // Agora simular que o carrinho está expirado para o teste
      convertedCart['expires_at'] = new Date(Date.now() - 25 * 60 * 60 * 1000);

      repository.findExpiredCarts
        .mockResolvedValueOnce([expiredCart, convertedCart])
        .mockResolvedValueOnce([]);

      repository.update.mockResolvedValue();

      // Act
      const result = await useCase.execute(input);

      // Assert
      expect(result.cleaned_carts_count).toBe(1); // Apenas o carrinho ativo foi limpo
      expect(repository.update).toHaveBeenCalledTimes(1);
      expect(expiredCart.status).toBe(CartStatus.EXPIRED);
      expect(convertedCart.status).toBe(CartStatus.CONVERTED); // Não mudou
    });
  });
});