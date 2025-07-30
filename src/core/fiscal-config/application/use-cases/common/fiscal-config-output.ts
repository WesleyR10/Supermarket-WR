import { FiscalConfig, FiscalConfigType } from '../../../domain/fiscal-config.aggregate';

export type FiscalConfigOutput = {
  id: string;
  store_id: string;
  config_name: string;
  config_type: FiscalConfigType;
  tax_rate: number | null;
  applies_to_ncm: string[];
  applies_to_categories: string[];
  min_value: number | null;
  max_value: number | null;
  start_date: Date | null;
  end_date: Date | null;
  is_active: boolean;
  priority: number;
  description: string | null;
  metadata: Record<string, any> | null;
  created_at: Date;
  updated_at: Date;
};

export class FiscalConfigOutputMapper {
  static toOutput(entity: FiscalConfig): FiscalConfigOutput {
    const { fiscal_config_id, ...otherProps } = entity.toJSON();
    return {
      id: fiscal_config_id,
      ...otherProps,
    };
  }
}