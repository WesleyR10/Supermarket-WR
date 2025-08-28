import { IUseCase } from '../../../../shared/application/use-case.interface';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { Cart, CartId } from '../../../domain/cart.aggregate';
import { ICartRepository } from '../../../domain/repositories/cart.repository.interface';
import { GetCartInput } from './get-cart.input';
import { CartOutput, CartOutputMapper } from '../common/cart-output';

export class GetCartUseCase implements IUseCase<GetCartInput, CartOutput> {
  constructor(private cartRepo: ICartRepository) {}

  async execute(input: GetCartInput): Promise<CartOutput> {
    const cartId = new CartId(input.cart_id);
    const cart = await this.cartRepo.findById(cartId);
    
    if (!cart) {
      throw new NotFoundError(input.cart_id, Cart);
    }

    return CartOutputMapper.toOutput(cart);
  }
}