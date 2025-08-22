import { FiscalConfig, FiscalConfigType } from '../fiscal-config.aggregate';
import { IFiscalConfigRepository } from '../repositories/fiscal-config.repository.interface';

export interface FiscalConfigValidationError {
  field: string;
  message: string;
  code: string;
}

export class FiscalConfigValidator {
  constructor(private readonly fiscalConfigRepo: IFiscalConfigRepository) {}

  async validateForCreation(fiscalConfig: FiscalConfig): Promise<FiscalConfigValidationError[]> {
    const errors: FiscalConfigValidationError[] = [];

    // Validar duplicação de nome na mesma loja
    await this.validateUniqueNameInStore(fiscalConfig, errors);

    // Validar NCM codes
    this.validateNCMCodes(fiscalConfig, errors);

    // Validar período de validade
    this.validateValidityPeriod(fiscalConfig, errors);

    // Validar taxa de imposto
    this.validateTaxRate(fiscalConfig, errors);

    // Validar conflitos de configuração
    await this.validateConfigurationConflicts(fiscalConfig, errors);

    return errors;
  }

  async validateForUpdate(fiscalConfig: FiscalConfig): Promise<FiscalConfigValidationError[]> {
    const errors: FiscalConfigValidationError[] = [];

    // Validar duplicação de nome na mesma loja (excluindo o próprio registro)
    await this.validateUniqueNameInStoreForUpdate(fiscalConfig, errors);

    // Validar NCM codes
    this.validateNCMCodes(fiscalConfig, errors);

    // Validar período de validade
    this.validateValidityPeriod(fiscalConfig, errors);

    // Validar taxa de imposto
    this.validateTaxRate(fiscalConfig, errors);

    // Validar conflitos de configuração
    await this.validateConfigurationConflicts(fiscalConfig, errors);

    return errors;
  }

  private async validateUniqueNameInStore(
    fiscalConfig: FiscalConfig,
    errors: FiscalConfigValidationError[]
  ): Promise<void> {
    const existingConfig = await this.fiscalConfigRepo.findByStoreAndName(
      fiscalConfig.store_id,
      fiscalConfig.config_name
    );

    if (existingConfig) {
      errors.push({
        field: 'config_name',
        message: 'Já existe uma configuração fiscal com este nome nesta loja',
        code: 'DUPLICATE_CONFIG_NAME'
      });
    }
  }

  private async validateUniqueNameInStoreForUpdate(
    fiscalConfig: FiscalConfig,
    errors: FiscalConfigValidationError[]
  ): Promise<void> {
    const existingConfig = await this.fiscalConfigRepo.findByStoreAndName(
      fiscalConfig.store_id,
      fiscalConfig.config_name
    );

    if (existingConfig && !existingConfig.fiscal_config_id.equals(fiscalConfig.fiscal_config_id)) {
      errors.push({
        field: 'config_name',
        message: 'Já existe uma configuração fiscal com este nome nesta loja',
        code: 'DUPLICATE_CONFIG_NAME'
      });
    }
  }

  private validateNCMCodes(
    fiscalConfig: FiscalConfig,
    errors: FiscalConfigValidationError[]
  ): void {
    if (fiscalConfig.applies_to_ncm && fiscalConfig.applies_to_ncm.length > 0) {
      const invalidNCMs = fiscalConfig.applies_to_ncm.filter(ncm => !this.isValidNCM(ncm));
      
      if (invalidNCMs.length > 0) {
        errors.push({
          field: 'applies_to_ncm',
          message: `Códigos NCM inválidos: ${invalidNCMs.join(', ')}`,
          code: 'INVALID_NCM_CODES'
        });
      }
    }
  }

  private validateValidityPeriod(
    fiscalConfig: FiscalConfig,
    errors: FiscalConfigValidationError[]
  ): void {
    if (fiscalConfig.start_date && fiscalConfig.end_date) {
      if (fiscalConfig.start_date >= fiscalConfig.end_date) {
        errors.push({
          field: 'end_date',
          message: 'A data de fim deve ser posterior à data de início',
          code: 'INVALID_VALIDITY_PERIOD'
        });
      }
    }
  }

  private validateTaxRate(
    fiscalConfig: FiscalConfig,
    errors: FiscalConfigValidationError[]
  ): void {
    if (fiscalConfig.tax_rate !== null && fiscalConfig.tax_rate !== undefined) {
      if (fiscalConfig.tax_rate < 0) {
        errors.push({
          field: 'tax_rate',
          message: 'A taxa de imposto não pode ser negativa',
          code: 'NEGATIVE_TAX_RATE'
        });
      }

      if (fiscalConfig.tax_rate > 100) {
        errors.push({
          field: 'tax_rate',
          message: 'A taxa de imposto não pode ser superior a 100%',
          code: 'EXCESSIVE_TAX_RATE'
        });
      }
    }
  }

  private async validateConfigurationConflicts(
    fiscalConfig: FiscalConfig,
    errors: FiscalConfigValidationError[]
  ): Promise<void> {
    // Buscar configurações do mesmo tipo na mesma loja
    const sameTypeConfigs = await this.fiscalConfigRepo.findByStoreAndType(
      fiscalConfig.store_id,
      fiscalConfig.config_type
    );

    // Filtrar configurações ativas e com mesma prioridade
    const conflictingConfigs = sameTypeConfigs.filter(config => {
      // Excluir o próprio registro em caso de atualização
      if (config.fiscal_config_id.equals(fiscalConfig.fiscal_config_id)) {
        return false;
      }

      return (
        config.is_active &&
        fiscalConfig.is_active &&
        config.priority === fiscalConfig.priority &&
        this.hasOverlappingScope(fiscalConfig, config)
      );
    });

    if (conflictingConfigs.length > 0) {
      errors.push({
        field: 'priority',
        message: 'Existe conflito de prioridade com outras configurações ativas do mesmo tipo',
        code: 'PRIORITY_CONFLICT'
      });
    }
  }

  private hasOverlappingScope(config1: FiscalConfig, config2: FiscalConfig): boolean {
    // Verificar sobreposição de NCM
    if (config1.applies_to_ncm && config2.applies_to_ncm) {
      const ncmOverlap = config1.applies_to_ncm.some(ncm => 
        config2.applies_to_ncm!.includes(ncm)
      );
      if (ncmOverlap) return true;
    }

    // Verificar sobreposição de categorias
    if (config1.applies_to_categories && config2.applies_to_categories) {
      const categoryOverlap = config1.applies_to_categories.some(cat => 
        config2.applies_to_categories!.includes(cat)
      );
      if (categoryOverlap) return true;
    }

    // Verificar sobreposição de faixas de valor
    if (this.hasValueRangeOverlap(config1, config2)) {
      return true;
    }

    return false;
  }

  private hasValueRangeOverlap(config1: FiscalConfig, config2: FiscalConfig): boolean {
    const min1 = config1.min_value || 0;
    const max1 = config1.max_value || Number.MAX_SAFE_INTEGER;
    const min2 = config2.min_value || 0;
    const max2 = config2.max_value || Number.MAX_SAFE_INTEGER;

    return !(max1 < min2 || max2 < min1);
  }

  private isValidNCM(ncm: string): boolean {
    // NCM deve ter 8 dígitos numéricos
    const ncmRegex = /^\d{8}$/;
    return ncmRegex.test(ncm);
  }
}