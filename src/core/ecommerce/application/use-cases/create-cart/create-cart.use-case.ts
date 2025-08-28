import { IUseCase } from '../../../../shared/application/use-case.interface';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';
import { Cart } from '../../../domain/cart.aggregate';
import { ICartRepository } from '../../../domain/repositories/cart.repository.interface';
import { Uuid } from '../../../../shared/domain/value-objects/uuid.vo';
import { CreateCartInput } from './create-cart.input';
import { CartOutput, CartOutputMapper } from '../common/cart-output';

export class CreateCartUseCase implements IUseCase<CreateCartInput, CartOutput> {
  constructor(private cartRepo: ICartRepository) {}

  async execute(input: CreateCartInput): Promise<CartOutput> {
    const clientId = new Uuid(input.client_id);
    
    // Verificar se já existe um carrinho ativo para este cliente na loja
    const existingCart = await this.cartRepo.findActiveByClient(clientId, input.store_id);
    if (existingCart) {
      return CartOutputMapper.toOutput(existingCart);
    }

    // Definir data de expiração (padrão: 7 dias)
    const expiresAt = input.expires_at 
      ? new Date(input.expires_at)
      : (() => {
          const date = new Date();
          date.setDate(date.getDate() + 7);
          return date;
        })();

    const entity = Cart.create({
      client_id: clientId.id,
      store_id: input.store_id,
      expires_at: expiresAt
    });

    if (entity.notification.hasErrors()) {
      throw new EntityValidationError(entity.notification.toJSON());
    }

    await this.cartRepo.insert(entity);
    return CartOutputMapper.toOutput(entity);
  }
}