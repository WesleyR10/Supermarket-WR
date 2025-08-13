import { Inventory } from '../../../domain/inventory.aggregate';

export type InventoryOutput = {
  id: string;
  product_id: string;
  store_id: string;
  quantity: number;
  min_stock: number;
  max_stock: number;
  cost_price: number | null;
  unit_price: number | null;
  supplier_id: string | null;
  location: string | null;
  expiry_date: Date | null;
  batch_number: string | null;
  is_active: boolean;
  last_movement_date: Date | null;
  created_at: Date;
  updated_at: Date;
};

export class InventoryOutputMapper {
  static toOutput(entity: Inventory): InventoryOutput {
    const { inventory_item_id, ...otherProps } = entity.toJSON();
    return {
      id: inventory_item_id,
      ...otherProps,
    };
  }
}