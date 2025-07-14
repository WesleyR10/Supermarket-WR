import { Sale } from '../../../domain/sale.aggregate';

export type SaleItemOutput = {
  product_id: string;
  quantity: number;
  unit_price: number;
  discount_percentage: number;
  total_price: number;
};

export type SaleOutput = {
  id: string;
  customer_id: string | null;
  store_id: string;
  cashier_id: string;
  total_amount: number;
  discount_amount: number;
  tax_amount: number;
  payment_method: string;
  sale_status: string;
  items: SaleItemOutput[];
  register_number: number;
  sale_date: Date;
  created_at: Date;
};

export class SaleOutputMapper {
  static toOutput(entity: Sale): SaleOutput {
    const { sale_id, ...otherProps } = entity.toJSON();
    return {
      id: sale_id,
      ...otherProps,
    };
  }
} 