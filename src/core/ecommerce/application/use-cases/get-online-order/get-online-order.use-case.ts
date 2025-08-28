import { IUseCase } from '../../../../shared/application/use-case.interface';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';
import { OnlineOrder, OnlineOrderId } from '../../../domain/online-order.aggregate';
import { OnlineOrderOutput, OnlineOrderOutputMapper } from '../common/online-order-output';
import { IOnlineOrderRepository } from '../../../domain/repositories/online-order.repository.interface';
import { GetOnlineOrderInput, ValidateGetOnlineOrderInput } from './get-online-order.input';

export class GetOnlineOrderUseCase implements IUseCase<GetOnlineOrderInput, GetOnlineOrderOutput> {
  constructor(private readonly onlineOrderRepo: IOnlineOrderRepository) {}

  async execute(input: GetOnlineOrderInput): Promise<GetOnlineOrderOutput> {
    const orderId = new OnlineOrderId(input.id);
    const onlineOrder = await this.onlineOrderRepo.findById(orderId);

    if (!onlineOrder) {
      throw new NotFoundError(input.id, OnlineOrder);
    }

    if (onlineOrder.store_id !== input.store_id) {
      throw new EntityValidationError([
        {
          store_id: ['Online order does not belong to this store'],
        },
      ]);
    }

    return OnlineOrderOutputMapper.toOutput(onlineOrder);
  }
}

export type GetOnlineOrderOutput = OnlineOrderOutput;
