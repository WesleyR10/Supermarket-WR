import { IUseCase } from '../../../../shared/application/use-case.interface';
import { DeleteOnlineOrderInput, ValidateDeleteOnlineOrderInput } from './delete-online-order.input';
import { IOnlineOrderRepository } from '../../../domain/repositories/online-order.repository.interface';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';
import { OnlineOrder, OnlineOrderId } from '../../../domain/online-order.aggregate';

export class DeleteOnlineOrderUseCase
  implements IUseCase<DeleteOnlineOrderInput, void>
{
  constructor(
    private readonly onlineOrderRepo: IOnlineOrderRepository
  ) {}

  async execute(input: DeleteOnlineOrderInput): Promise<void> {
    const orderId = new OnlineOrderId(input.id);
    const order = await this.onlineOrderRepo.findById(orderId);

    if (!order || order.store_id !== input.store_id) {
      throw new NotFoundError(input.id, OnlineOrder);
    }

    await this.onlineOrderRepo.delete(orderId);
  }
}