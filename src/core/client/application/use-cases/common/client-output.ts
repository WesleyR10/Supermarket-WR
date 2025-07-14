import { Client } from '../../../domain/client.aggregate';

export type ClientOutput = {
  id: string;
  user_id: string;
  stores_id: string;
  loyalty_points: number;
  loyalty_level: string;
  loyalty_card_number: string | null;
  customer_type: string;
  avg_monthly_spending: number | null;
  total_purchases: number;
  credit_limit: number | null;
  preferred_contact_method: string;
  allows_promotions: boolean;
  allows_sms: boolean;
  allows_email: boolean;
  payment_preference: string;
  delivery_preference: string;
  last_purchase_date: Date | null;
  registration_source: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
};

export class ClientOutputMapper {
  static toOutput(entity: Client): ClientOutput {
    const { client_id, ...otherProps } = entity.toJSON();
    return {
      id: client_id,
      ...otherProps,
    };
  }
} 