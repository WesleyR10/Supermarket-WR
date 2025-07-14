import { IUseCase } from '../../../../shared/application/use-case.interface';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { OnlineOrder, OnlineOrderId } from '../../../domain/online-order.aggregate';
import { IOnlineOrderRepository } from '../../../domain/online-order.repository';
import { OnlineOrderOutput, OnlineOrderOutputMapper } from '../common/online-order-output';

export type GetOnlineOrderInput = {
  id: string;
};

export type GetOnlineOrderOutput = OnlineOrderOutput;

export class GetOnlineOrderUseCase implements IUseCase<GetOnlineOrderInput, GetOnlineOrderOutput> {
  constructor(private onlineOrderRepository: IOnlineOrderRepository) {}

  async execute(input: GetOnlineOrderInput): Promise<GetOnlineOrderOutput> {
    const orderId = new OnlineOrderId(input.id);
    const onlineOrder = await this.onlineOrderRepository.findById(orderId);

    if (!onlineOrder) {
      throw new NotFoundError(input.id, OnlineOrder);
    }

    return OnlineOrderOutputMapper.toOutput(onlineOrder);
  }
}
