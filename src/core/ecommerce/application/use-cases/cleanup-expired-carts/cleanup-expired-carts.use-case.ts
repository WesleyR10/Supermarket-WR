import { IUseCase } from '../../../../shared/application/use-case.interface';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';
import { CartStatus } from '../../../domain/cart.aggregate';
import { ICartRepository } from '../../../domain/repositories/cart.repository.interface';
import { CleanupExpiredCartsInput, ValidateCleanupExpiredCartsInput } from './cleanup-expired-carts.input';

export interface CleanupExpiredCartsOutput {
  cleaned_carts_count: number;
  processed_batches: number;
  total_processing_time_ms: number;
  errors: string[];
}

export class CleanupExpiredCartsUseCase implements IUseCase<CleanupExpiredCartsInput, CleanupExpiredCartsOutput> {
  constructor(private cartRepo: ICartRepository) {}

  async execute(input: CleanupExpiredCartsInput): Promise<CleanupExpiredCartsOutput> {
    const validationErrors = ValidateCleanupExpiredCartsInput.validate(input);
    if (validationErrors.length > 0) {
      throw new EntityValidationError(validationErrors as any);
    }

    const startTime = Date.now();
    let cleanedCartsCount = 0;
    let processedBatches = 0;
    const errors: string[] = [];

    const expiryHours = input.expiry_hours || 24;
    const batchSize = input.batch_size || 100;
    const expiryDate = new Date(Date.now() - (expiryHours * 60 * 60 * 1000));

    try {
      let hasMoreCarts = true;

      while (hasMoreCarts) {
        try {
          // Buscar carrinhos expirados em lotes
          const expiredCarts = await this.cartRepo.findExpiredCarts(
            expiryDate,
            batchSize
          );

          if (expiredCarts.length === 0) {
            hasMoreCarts = false;
            break;
          }

          // Processar cada carrinho do lote
          for (const cart of expiredCarts) {
            try {
              // Verificar se o carrinho ainda está ativo
              if (cart.status === CartStatus.ACTIVE) {
                // Marcar como expirado
                cart.markAsExpired();

                if (cart.notification.hasErrors()) {
                  errors.push(`Erro ao marcar carrinho ${cart.cart_id.id} como expirado: ${cart.notification.toJSON()}`);
                  continue;
                }

                // Atualizar no repositório
                await this.cartRepo.update(cart);
                cleanedCartsCount++;
              }
            } catch (error) {
              errors.push(`Erro ao processar carrinho ${cart.cart_id.id}: ${error.message}`);
            }
          }

          processedBatches++;

          // Se retornou menos carrinhos que o tamanho do lote, não há mais carrinhos
          if (expiredCarts.length < batchSize) {
            hasMoreCarts = false;
          }

        } catch (error) {
          errors.push(`Erro ao processar lote ${processedBatches + 1}: ${error.message}`);
          hasMoreCarts = false;
        }
      }

    } catch (error) {
      errors.push(`Erro geral na limpeza de carrinhos: ${error.message}`);
    }

    const endTime = Date.now();
    const totalProcessingTime = endTime - startTime;

    return {
      cleaned_carts_count: cleanedCartsCount,
      processed_batches: processedBatches,
      total_processing_time_ms: totalProcessingTime,
      errors
    };
  }
}