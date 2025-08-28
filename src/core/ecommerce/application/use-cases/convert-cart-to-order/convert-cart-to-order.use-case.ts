import { IUseCase } from '../../../../shared/application/use-case.interface';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { Cart, CartId, CartStatus } from '../../../domain/cart.aggregate';
import { OnlineOrder } from '../../../domain/online-order.aggregate';
import { ICartRepository } from '../../../domain/repositories/cart.repository.interface';
import { IOnlineOrderRepository } from '../../../domain/repositories/online-order.repository.interface';
import { IStockValidationService } from '../../../domain/services/stock-validation.service.interface';
import { ConvertCartToOrderInput } from './convert-cart-to-order.input';
import { OnlineOrderOutput, OnlineOrderOutputMapper } from '../common/online-order-output';

export class ConvertCartToOrderUseCase implements IUseCase<ConvertCartToOrderInput, OnlineOrderOutput> {
  constructor(
    private cartRepo: ICartRepository,
    private onlineOrderRepo: IOnlineOrderRepository,
    private stockValidationService: IStockValidationService
  ) {}

  async execute(input: ConvertCartToOrderInput): Promise<OnlineOrderOutput> {
    const cartId = new CartId(input.cart_id);
    const cart = await this.cartRepo.findById(cartId);
    
    if (!cart) {
      throw new NotFoundError(input.cart_id, Cart);
    }

    if (cart.status !== CartStatus.ACTIVE) {
      throw new Error('Carrinho deve estar ativo para ser convertido em pedido');
    }

    if (cart.isEmpty()) {
      throw new Error('Carrinho não pode estar vazio para ser convertido em pedido');
    }

    // Validar estoque dos itens do carrinho
    const stockValidationItems = cart.items.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity
    }));

    const stockValidation = await this.stockValidationService.validateStockAvailability(
      cart.store_id,
      stockValidationItems
    );

    if (!stockValidation.is_valid) {
      const errorMessages = stockValidation.errors.map(error => error.message).join('; ');
      throw new Error(`Estoque insuficiente: ${errorMessages}`);
    }

    // Converter itens do carrinho para itens do pedido
    const orderItems = cart.items.map(item => ({
      product_id: item.product_id.id,
      product_name: item.product_name,
      quantity: item.quantity.value,
      unit_price: item.unit_price.value
    }));

    // Criar pedido online
    const onlineOrder = OnlineOrder.create({
      client_id: cart.client_id.id,
      store_id: cart.store_id,
      items: orderItems,
      delivery_address: {
        street: input.delivery_address.street,
        number: input.delivery_address.number,
        complement: input.delivery_address.complement,
        neighborhood: input.delivery_address.neighborhood,
        city: input.delivery_address.city,
        state: input.delivery_address.state,
        zip_code: input.delivery_address.zip_code
      },
      delivery_fee: 0,
      payment_method: input.payment_methods.length > 0 ? {
        type: input.payment_methods[0].type,
        details: {
          card_number: input.payment_methods[0].card_number,
          card_holder_name: input.payment_methods[0].card_holder_name,
          expiry_date: input.payment_methods[0].card_expiry_date,
          cvv: input.payment_methods[0].card_cvv
        }
      } : undefined
    });

    if (onlineOrder.notification.hasErrors()) {
      throw new EntityValidationError(onlineOrder.notification.toJSON());
    }

    // Marcar carrinho como convertido
    cart.markAsConverted();

    if (cart.notification.hasErrors()) {
      throw new EntityValidationError(cart.notification.toJSON());
    }

    // Salvar pedido e atualizar carrinho
    await this.onlineOrderRepo.insert(onlineOrder);
    await this.cartRepo.update(cart);

    return OnlineOrderOutputMapper.toOutput(onlineOrder);
  }
}