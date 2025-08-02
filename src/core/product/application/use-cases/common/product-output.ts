import { Product, UnitType } from '../../../domain/product.aggregate';

export type ProductOutput = {
  id: string;
  store_id: string;
  category_id: string;
  name: string;
  description: string | null;
  barcode: string | null; // Corrigido: permite null
  price: number;
  cost_price: number | null;
  is_active: boolean;
  
  // Campos específicos do domínio de supermercado
  brand: string | null;
  unit_type: UnitType;
  weight: number | null;
  volume: number | null;
  dimensions: string | null;
  supplier_code: string | null;
  ncm_code: string | null;
  requires_weighing: boolean;
  
  created_at: Date;
  updated_at: Date;
};

export class ProductOutputMapper {
  static toOutput(entity: Product): ProductOutput {
    const { product_id, ...otherProps } = entity.toJSON();
    return {
      id: product_id, 
      ...otherProps,
    };
  }
}