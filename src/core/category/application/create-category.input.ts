export type CreateCategoryInput = {
  name: string;
  description?: string | null;
  is_active?: boolean;
  // Campos específicos do domínio de supermercado
  parent_category_id?: string | null;
  tax_rate?: number | null;
  default_margin_percentage?: number | null;
  requires_expiry_date?: boolean;
  display_order?: number;
  icon_name?: string | null;
}; 