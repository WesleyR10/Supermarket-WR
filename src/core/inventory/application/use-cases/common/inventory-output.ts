import { Inventory } from '../../../domain/inventory.aggregate';

export type InventoryOutput = {
  id: string;
  product_id: string;
  store_id: string;
  quantity: number;
  minimum_quantity: number;
  maximum_quantity: number;
  unit_cost: number;
  unit_price: number;
  supplier_id: string | null;
  location_code: string | null;
  expiry_date: Date | null;
  batch_number: string | null;
  is_active: boolean;
  created_at: Date;
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