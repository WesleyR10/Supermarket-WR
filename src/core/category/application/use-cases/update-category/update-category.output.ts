export type UpdateCategoryOutput = {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  parent_category_id: string | null;
  tax_rate: number | null;
  default_margin_percentage: number | null;
  requires_expiry_date: boolean;
  display_order: number;
  icon_name: string | null;
  created_at: Date;
}; 