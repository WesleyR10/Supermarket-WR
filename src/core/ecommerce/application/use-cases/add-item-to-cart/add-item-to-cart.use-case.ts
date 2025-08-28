import { IUseCase } from '../../../../shared/application/use-case.interface';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { Cart, CartId } from '../../../domain/cart.aggregate';
import { ICartRepository } from '../../../domain/repositories/cart.repository.interface';
import { IStockValidationService } from '../../../domain/stock-validation.service.interface';
import { IProductValidationService } from '../../../domain/product-validation.service.interface';
import { Uuid } from '../../../../shared/domain/value-objects/uuid.vo';
import { Quantity } from '../../../../shared/domain/value-objects/quantity.vo';
import { Price } from '../../../../shared/domain/value-objects/price.vo';
import { AddItemToCartInput, ValidateAddItemToCartInput } from './add-item-to-cart.input';
import { CartOutput, CartOutputMapper } from '../common/cart-output';

export class AddItemToCartUseCase implements IUseCase<AddItemToCartInput, CartOutput> {
  constructor(
    private cartRepo: ICartRepository,
    private stockValidationService: IStockValidationService,
    private productValidationService: IProductValidationService
  ) {}

  async execute(input: AddItemToCartInput): Promise<CartOutput> {
    const cartId = new CartId(input.cart_id);
    const cart = await this.cartRepo.findById(cartId);
    
    if (!cart) {
      throw new NotFoundError(input.cart_id, Cart);
    }

    // Validar se o produto existe e está ativo
    await this.productValidationService.validateProducts([{
      product_id: input.product_id,
      store_id: cart.store_id
    }]);

    // Obter informações atualizadas do produto
    const productInfo = await this.productValidationService.getProductInfo(
      input.product_id,
      cart.store_id
    );

    if (!productInfo) {
      throw new Error(`Produto ${input.product_id} não encontrado ou inativo`);
    }

    // Validar estoque disponível
    await this.stockValidationService.validateStock(cart.store_id, [{
      product_id: input.product_id,
      quantity: input.quantity
    }]);

    const productId = new Uuid(input.product_id);
    const quantity = new Quantity(input.quantity);
    // Usar preço atualizado do produto se não fornecido
    const unitPrice = new Price(input.unit_price || productInfo.price);

    cart.addItem({
      product_id: productId,
      product_name: input.product_name || productInfo.name,
      quantity,
      unit_price: unitPrice
    });

    if (cart.notification.hasErrors()) {
      throw new EntityValidationError(cart.notification.toJSON());
    }

    await this.cartRepo.update(cart);
    return CartOutputMapper.toOutput(cart);
  }
}