import { IUseCase } from '../../../../shared/application/use-case.interface';
import { OnlineOrder, DeliveryAddress } from '../../../domain/online-order.aggregate';
import { OnlineOrderOutput, OnlineOrderOutputMapper } from '../common/online-order-output';
import { CreateOnlineOrderInput } from './create-online-order.input';
import { IOnlineOrderRepository } from '../../../domain/online-order.repository';
import { ClientId } from '../../../../client/domain/client.aggregate';
import { ProductId } from '../../../../product/domain/product.aggregate';
import { Money } from '../../../../shared/domain/value-objects/money.vo';
import { Quantity } from '../../../../shared/domain/value-objects/quantity.vo';
import { Price } from '../../../../shared/domain/value-objects/price.vo';
import { PaymentMethod, PaymentMethodType } from '../../../../shared/domain/value-objects/payment-method.vo';
import { InvalidArgumentError } from '../../../../shared/domain/errors/invalid-argument.error';

export class CreateOnlineOrderUseCase
  implements IUseCase<CreateOnlineOrderInput, OnlineOrderOutput>
{
  constructor(
    private readonly onlineOrderRepository: IOnlineOrderRepository
  ) {}

  async execute(input: CreateOnlineOrderInput): Promise<OnlineOrderOutput> {
    // Criar delivery address a partir do input
    const deliveryAddressResult = DeliveryAddress.create({
      street: input.delivery_address.street,
      number: input.delivery_address.number,
      complement: input.delivery_address.complement,
      neighborhood: input.delivery_address.neighborhood,
      city: input.delivery_address.city,
      state: input.delivery_address.state,
      zip_code: input.delivery_address.zip_code
    });

    // Verificar se a criação do endereço foi bem-sucedida
    if (deliveryAddressResult.isFail()) {
      throw deliveryAddressResult.error;
    }

    const deliveryAddress = deliveryAddressResult.ok;

    // Criar items do pedido
    const orderItems = input.items.map(item => ({
      product_id: new ProductId(item.product_id),
      product_name: item.product_name,
      quantity: new Quantity(item.quantity),
      unit_price: new Price(item.unit_price)
    }));

    // Criar payment method se fornecido
    let paymentMethod: PaymentMethod | undefined;
    if (input.payment_method) {
      const type = input.payment_method.type.toUpperCase() as PaymentMethodType;
      paymentMethod = new PaymentMethod(type, input.payment_method.details);
    }

    // Criar o pedido online
    const onlineOrderResult = OnlineOrder.create({
      client_id: new ClientId(input.client_id),
      items: orderItems,
      delivery_address: deliveryAddress,
      delivery_fee: new Money(input.delivery_fee),
      payment_method: paymentMethod,
      notes: input.notes,
      estimated_delivery: input.estimated_delivery ? new Date(input.estimated_delivery) : undefined
    });

    // Verificar se a criação foi bem-sucedida
    if (onlineOrderResult.isFail()) {
      throw onlineOrderResult.error;
    }

    const onlineOrder = onlineOrderResult.ok;

    // Salvar no repositório
    await this.onlineOrderRepository.insert(onlineOrder);

    // Retornar output
    return OnlineOrderOutputMapper.toOutput(onlineOrder);
  }
}
