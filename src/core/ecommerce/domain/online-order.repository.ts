import { IRepository } from '../../shared/domain/repository/repository-interface';
import { OnlineOrder, OnlineOrderId } from './online-order.aggregate';

export interface IOnlineOrderRepository extends IRepository<OnlineOrder, OnlineOrderId> {
  findByClientId(clientId: string): Promise<OnlineOrder[]>;
  findByStatus(status: string): Promise<OnlineOrder[]>;
}
