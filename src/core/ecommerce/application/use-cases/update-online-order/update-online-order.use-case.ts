import { IUseCase } from '../../../../shared/application/use-case.interface';
import { OnlineOrder, OnlineOrderId, DeliveryAddress } from '../../../domain/online-order.aggregate';
import { OnlineOrderOutput, OnlineOrderOutputMapper } from '../common/online-order-output';
import { IOnlineOrderRepository } from '../../../domain/repositories/online-order.repository.interface';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';
import { UpdateOnlineOrderInput } from './update-online-order.input';

export class UpdateOnlineOrderUseCase
  implements IUseCase<UpdateOnlineOrderInput, UpdateOnlineOrderOutput>
{
  constructor(private readonly onlineOrderRepo: IOnlineOrderRepository) {}

  async execute(input: UpdateOnlineOrderInput): Promise<UpdateOnlineOrderOutput> {
    const entityId = new OnlineOrderId(input.id);
    const order = await this.onlineOrderRepo.findById(entityId);

    if (!order) {
      throw new NotFoundError(input.id, OnlineOrder);
    }

    if (order.store_id !== input.store_id) {
      throw new EntityValidationError([
        {
          store_id: ['Online order does not belong to this store'],
        },
      ]);
    }

    // Atualizar propriedades
    if (input.notes !== undefined) {
      order.notes = input.notes;
    }
    if (input.estimated_delivery !== undefined) {
      order.estimated_delivery = input.estimated_delivery ? new Date(input.estimated_delivery) : null;
    }
    if (input.delivery_address !== undefined) {
      order.delivery_address = DeliveryAddress.create(input.delivery_address);
    }
    
    // Se nenhum campo opcional foi fornecido, limpar campos opcionais
    if (Object.keys(input).length === 2) { // apenas id e store_id
      order.notes = null;
      order.estimated_delivery = null;
    }

    // Executar validação após as alterações
    order.validate();

    // Verificação de erros de validação
    if (order.notification.hasErrors()) {
      throw new EntityValidationError(order.notification.toJSON());
    }

    await this.onlineOrderRepo.update(order);

    return OnlineOrderOutputMapper.toOutput(order);
  }
}

export type UpdateOnlineOrderOutput = OnlineOrderOutput;