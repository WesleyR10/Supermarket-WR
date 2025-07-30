import { FiscalConfig } from '../fiscal-config.aggregate';
import { IFiscalConfigRepository } from '../repositories/fiscal-config.repository.interface';

export class FiscalCalculationService {
  constructor(private readonly fiscalConfigRepo: IFiscalConfigRepository) {}

  async calculateTaxesForProduct(
    storeId: string,
    productData: {
      ncm_code?: string;
      category_id?: string;
      value: number;
    }
  ): Promise<{
    config: FiscalConfig;
    taxAmount: number;
    taxRate: number;
  }[]> {
    const applicableConfigs = await this.fiscalConfigRepo.findApplicableConfigs(
      storeId,
      productData
    );

    // Ordenar por prioridade (maior prioridade primeiro)
    const sortedConfigs = applicableConfigs
      .filter(config => config.appliesTo(productData))
      .sort((a, b) => b.priority - a.priority);

    return sortedConfigs.map(config => ({
      config,
      taxAmount: config.calculateTax(productData.value),
      taxRate: config.tax_rate || 0
    }));
  }
}