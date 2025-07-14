import { OnlineOrder, OnlineOrderId } from '../online-order.aggregate';
import { IOnlineOrderRepository } from '../online-order.repository';

export class OnlineOrderInMemoryRepository implements IOnlineOrderRepository {
  items: OnlineOrder[] = [];

  async findByClientId(clientId: string): Promise<OnlineOrder[]> {
    return this.items.filter(item => item.client_id.id === clientId);
  }

  async findByStatus(status: string): Promise<OnlineOrder[]> {
    return this.items.filter(item => item.status === status);
  }

  async findByIds(ids: OnlineOrderId[]): Promise<OnlineOrder[]> {
    return this.items.filter(item => 
      ids.some(id => id.equals(item.order_id))
    );
  }

  getEntity(): new (...args: any[]) => OnlineOrder {
    return OnlineOrder;
  }

  async insert(entity: OnlineOrder): Promise<void> {
    this.items.push(entity);
  }

  async bulkInsert(entities: OnlineOrder[]): Promise<void> {
    this.items.push(...entities);
  }

  async update(entity: OnlineOrder): Promise<void> {
    const index = this.items.findIndex(item => 
      item.order_id.equals(entity.order_id)
    );
    if (index !== -1) {
      this.items[index] = entity;
    }
  }

  async delete(entity_id: OnlineOrderId): Promise<void> {
    const index = this.items.findIndex(item => 
      item.order_id.equals(entity_id)
    );
    if (index !== -1) {
      this.items.splice(index, 1);
    }
  }

  async findById(entity_id: OnlineOrderId): Promise<OnlineOrder | null> {
    const item = this.items.find(item => 
      item.order_id.equals(entity_id)
    );
    return item || null;
  }

  async findAll(): Promise<OnlineOrder[]> {
    return this.items;
  }

  async existsById(
    entities_id: OnlineOrderId[]
  ): Promise<{
    exists: OnlineOrderId[];
    not_exists: OnlineOrderId[];
  }> {
    const exists: OnlineOrderId[] = [];
    const not_exists: OnlineOrderId[] = [];

    for (const id of entities_id) {
      const found = this.items.some(item => item.order_id.equals(id));
      if (found) {
        exists.push(id);
      } else {
        not_exists.push(id);
      }
    }

    return { exists, not_exists };
  }
}
