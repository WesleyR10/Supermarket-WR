import { Store } from '../../../domain/store.aggregate';

export type StoreOutput = {
  id: string;
  name: string;
  cnpj: string;
  status: string;
  settings: {
    business_hours: {
      monday: { open: string; close: string; closed: boolean };
      tuesday: { open: string; close: string; closed: boolean };
      wednesday: { open: string; close: string; closed: boolean };
      thursday: { open: string; close: string; closed: boolean };
      friday: { open: string; close: string; closed: boolean };
      saturday: { open: string; close: string; closed: boolean };
      sunday: { open: string; close: string; closed: boolean };
    };
    sales_config: {
      allow_negative_stock: boolean;
      auto_approve_sales: boolean;
      max_discount_percentage: number;
      require_customer_identification: boolean;
    };
    inventory_config: {
      low_stock_threshold: number;
      auto_reorder: boolean;
      track_expiry_dates: boolean;
    };
    fiscal_config: {
      tax_regime: 'SIMPLES' | 'LUCRO_PRESUMIDO' | 'LUCRO_REAL';
      issue_nfe: boolean;
      municipal_inscription: string | null;
      state_inscription: string | null;
    };
    notification_config: {
      email_notifications: boolean;
      sms_notifications: boolean;
      low_stock_alerts: boolean;
      sales_reports: boolean;
    };
  };
  subscription: {
    plan_type: 'BASIC' | 'PREMIUM' | 'ENTERPRISE';
    start_date: Date;
    end_date: Date;
    is_trial: boolean;
    trial_end_date: Date | null;
    payment_status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
    features: {
      max_products: number;
      max_employees: number;
      max_sales_per_month: number;
      advanced_reports: boolean;
      multi_location: boolean;
      api_access: boolean;
    };
    billing_info: {
      amount: number;
      currency: string;
      billing_cycle: 'MONTHLY' | 'YEARLY';
      next_billing_date: Date;
    };
  };
  created_at: Date;
  updated_at: Date;
};

export class StoreOutputMapper {
  static toOutput(entity: Store): StoreOutput {
    const { store_id, ...otherProps } = entity.toJSON();
    return {
      id: store_id,
      ...otherProps,
    };
  }
}