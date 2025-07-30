import { IFiscalConfigRepository } from '../../../fiscal-config/domain/repositories/fiscal-config.repository.interface';
import { Product } from '../product.aggregate';

export interface IFiscalValidationDomainService {
  validateFiscalCompliance(product: Product, storeId: string): Promise<FiscalValidationResult>;
}

export type FiscalValidationResult = {
  isValid: boolean;
  errors: string[];
  requiredNCM: boolean;
  applicableConfigs: FiscalConfigSummary[];
};

export type FiscalConfigSummary = {
  configName: string;
  configType: string;
  taxRate: number | null;
  priority: number;
};

export class FiscalValidationDomainService implements IFiscalValidationDomainService {
  constructor(
    private readonly fiscalConfigRepo: IFiscalConfigRepository
  ) {}

  async validateFiscalCompliance(product: Product, storeId: string): Promise<FiscalValidationResult> {
    const errors: string[] = [];
    let requiredNCM = false;

    // Buscar configurações fiscais aplicáveis
    const applicableConfigs = await this.fiscalConfigRepo.findApplicableConfigs(storeId, {
      ncm_code: product.ncm_code ?? undefined,
      category_id: product.category_id,
      value: product.price
    });

    // Regra de NCM baseada no preço
    if (product.price >= 50 && !product.ncm_code) {
      requiredNCM = true;
      errors.push('NCM code is required for products with price >= R$ 50.00');
    }

    // Validações específicas por tipo de produto
    if (product.isWeighable() && !product.weight && !product.volume) {
      errors.push('Weight or volume is required for weighable products');
    }

    if (product.isBeverage() && !product.volume) {
      errors.push('Volume is required for beverages');
    }

    // NOVA: Validação de margem mínima
    if (product.cost_price && product.price <= product.cost_price) {
      errors.push('Product price must be higher than cost price');
    }

    return {
      isValid: errors.length === 0,
      errors,
      requiredNCM,
      applicableConfigs: applicableConfigs.map(config => ({
        configName: config.config_name,
        configType: config.config_type,
        taxRate: config.tax_rate,
        priority: config.priority
      }))
    };
  }
}