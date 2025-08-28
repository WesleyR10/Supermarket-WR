import { IUseCase } from '../../../../shared/application/use-case.interface';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { Cart, CartId } from '../../../domain/cart.aggregate';
import { ICartRepository } from '../../../domain/repositories/cart.repository.interface';
import { ClearCartInput } from './clear-cart.input';
import { CartOutput, CartOutputMapper } from '../common/cart-output';

export class ClearCartUseCase implements IUseCase<ClearCartInput, CartOutput> {
  constructor(private cartRepo: ICartRepository) {}

  async execute(input: ClearCartInput): Promise<CartOutput> {
    const cartId = new CartId(input.cart_id);
    const cart = await this.cartRepo.findById(cartId);
    
    if (!cart) {
      throw new NotFoundError(input.cart_id, Cart);
    }

    cart.clearItems();

    if (cart.notification.hasErrors()) {
      throw new EntityValidationError(cart.notification.toJSON());
    }

    await this.cartRepo.update(cart);
    return CartOutputMapper.toOutput(cart);
  }
}