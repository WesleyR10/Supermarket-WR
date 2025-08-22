import { IUseCase } from '../../../../shared/application/use-case.interface';
import { OnlineOrder } from '../../../domain/online-order.aggregate';
import { OnlineOrderOutput, OnlineOrderOutputMapper } from '../common/online-order-output';
import { CreateOnlineOrderInput } from './create-online-order.input';
import { IOnlineOrderRepository } from '../../../domain/online-order.repository';

export class CreateOnlineOrderUseCase
  implements IUseCase<CreateOnlineOrderInput, OnlineOrderOutput>
{
  constructor(
    private readonly onlineOrderRepository: IOnlineOrderRepository
  ) {}

  async execute(input: CreateOnlineOrderInput): Promise<OnlineOrderOutput> {
    // Mapear itens com tipos primitivos esperados pelo domínio
    const items = input.items.map(item => ({
      product_id: item.product_id,
      product_name: item.product_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
    }));

    // Preparar dados do pedido conforme contrato de OnlineOrder.create
    const order = OnlineOrder.create({
      client_id: input.client_id,
      items,
      delivery_address: {
        street: input.delivery_address.street,
        number: input.delivery_address.number,
        complement: input.delivery_address.complement,
        neighborhood: input.delivery_address.neighborhood,
        city: input.delivery_address.city,
        state: input.delivery_address.state,
        zip_code: input.delivery_address.zip_code,
        latitude: input.delivery_address.latitude,
        longitude: input.delivery_address.longitude,
      },
      delivery_fee: input.delivery_fee,
      payment_method: input.payment_method ? {
        type: input.payment_method.type,
        details: input.payment_method.details
      } : undefined,
      notes: input.notes,
      estimated_delivery: input.estimated_delivery
        ? new Date(input.estimated_delivery)
        : undefined,
    });

    await this.onlineOrderRepository.insert(order);

    return OnlineOrderOutputMapper.toOutput(order);
  }
}
