export type CreateSaleOutput = {
  id: string;
  customer_id: string | null;
  cashier_id: string;
  total_amount: number;
  discount_amount: number;
  tax_amount: number;
  payment_method: string;
  sale_status: string;
  items: {
    product_id: string;
    quantity: number;
    unit_price: number;
    discount_percentage: number;
    total_price: number;
  }[];
  store_id: string;
  register_number: number;
  sale_date: Date;
  created_at: Date;
}; 