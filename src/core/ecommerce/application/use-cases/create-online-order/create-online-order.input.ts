export type CreateOnlineOrderInput = {
  client_id: string;
  items: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
  }>;
  delivery_address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zip_code: string;
    latitude?: number;
    longitude?: number;
  };
  delivery_fee: number;
  payment_method?: {
    type: string;
    details?: any;
  };
  notes?: string;
  estimated_delivery?: string;
};
