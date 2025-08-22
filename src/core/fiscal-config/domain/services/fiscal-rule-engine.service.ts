import { FiscalConfig, FiscalConfigType } from '../fiscal-config.aggregate';
import { IFiscalConfigRepository } from '../repositories/fiscal-config.repository.interface';

export interface TaxCalculationResult {
  config: FiscalConfig;
  taxAmount: number;
  taxRate: number;
  appliedRule: string;
}

export interface FiscalRuleContext {
  storeId: string;
  productData: {
    ncm_code?: string;
    category_id?: string;
    value: number;
  };
  calculationDate?: Date;
}

export class FiscalRuleEngineService {
  constructor(private readonly fiscalConfigRepo: IFiscalConfigRepository) {}

  async calculateAllApplicableTaxes(
    context: FiscalRuleContext
  ): Promise<TaxCalculationResult[]> {
    const applicableConfigs = await this.getApplicableConfigs(context);
    const results: TaxCalculationResult[] = [];

    for (const config of applicableConfigs) {
      const taxAmount = config.calculateTax(context.productData.value);
      const appliedRule = this.getAppliedRuleDescription(config, context);

      results.push({
        config,
        taxAmount,
        taxRate: config.tax_rate || 0,
        appliedRule
      });
    }

    return results.sort((a, b) => b.config.priority - a.config.priority);
  }

  async calculateHighestPriorityTax(
    context: FiscalRuleContext
  ): Promise<TaxCalculationResult | null> {
    const results = await this.calculateAllApplicableTaxes(context);
    return results.length > 0 ? results[0] : null;
  }

  async calculateTotalTaxAmount(
    context: FiscalRuleContext,
    configTypes?: FiscalConfigType[]
  ): Promise<{
    totalAmount: number;
    totalRate: number;
    appliedConfigs: TaxCalculationResult[];
  }> {
    let results = await this.calculateAllApplicableTaxes(context);

    // Filtrar por tipos específicos se fornecidos
    if (configTypes && configTypes.length > 0) {
      results = results.filter(result => 
        configTypes.includes(result.config.config_type)
      );
    }

    // Remover duplicatas por tipo (manter apenas a de maior prioridade)
    const uniqueByType = this.removeDuplicatesByType(results);

    const totalAmount = uniqueByType.reduce((sum, result) => sum + result.taxAmount, 0);
    const totalRate = uniqueByType.reduce((sum, result) => sum + result.taxRate, 0);

    return {
      totalAmount,
      totalRate,
      appliedConfigs: uniqueByType
    };
  }

  async validateFiscalCompliance(
    context: FiscalRuleContext
  ): Promise<{
    isCompliant: boolean;
    missingConfigs: FiscalConfigType[];
    warnings: string[];
  }> {
    const requiredTypes: FiscalConfigType[] = [
      FiscalConfigType.ICMS,
      FiscalConfigType.PIS,
      FiscalConfigType.COFINS
    ];

    const results = await this.calculateAllApplicableTaxes(context);
    const appliedTypes = results.map(r => r.config.config_type);
    const missingConfigs = requiredTypes.filter(type => !appliedTypes.includes(type));
    
    const warnings: string[] = [];

    // Verificar se há configurações conflitantes
    const conflictingConfigs = this.findConflictingConfigs(results);
    if (conflictingConfigs.length > 0) {
      warnings.push('Existem configurações fiscais conflitantes aplicáveis');
    }

    // Verificar se há configurações próximas do vencimento
    const expiringConfigs = results.filter(r => 
      r.config.end_date && 
      r.config.end_date <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias
    );
    if (expiringConfigs.length > 0) {
      warnings.push('Algumas configurações fiscais estão próximas do vencimento');
    }

    return {
      isCompliant: missingConfigs.length === 0,
      missingConfigs,
      warnings
    };
  }

  async findOptimalTaxConfiguration(
    context: FiscalRuleContext
  ): Promise<{
    recommendedConfigs: FiscalConfig[];
    estimatedTaxSaving: number;
    reasoning: string[];
  }> {
    const allConfigs = await this.fiscalConfigRepo.findByStoreId(context.storeId);
    const applicableConfigs = allConfigs.filter(config => 
      config.is_active && config.appliesTo(context.productData)
    );

    // Agrupar por tipo
    const configsByType = this.groupConfigsByType(applicableConfigs);
    const recommendedConfigs: FiscalConfig[] = [];
    const reasoning: string[] = [];

    // Para cada tipo, encontrar a configuração com menor taxa
    for (const [type, configs] of configsByType.entries()) {
      const sortedByRate = configs.sort((a, b) => (a.tax_rate || 0) - (b.tax_rate || 0));
      const optimal = sortedByRate[0];
      
      if (optimal) {
        recommendedConfigs.push(optimal);
        reasoning.push(
          `${type}: Configuração '${optimal.config_name}' com taxa de ${optimal.tax_rate}%`
        );
      }
    }

    // Calcular economia estimada
    const currentTax = await this.calculateTotalTaxAmount(context);
    const optimalContext = { ...context };
    const optimalTax = await this.calculateTotalTaxAmount(optimalContext);
    const estimatedTaxSaving = currentTax.totalAmount - optimalTax.totalAmount;

    return {
      recommendedConfigs,
      estimatedTaxSaving,
      reasoning
    };
  }

  private async getApplicableConfigs(context: FiscalRuleContext): Promise<FiscalConfig[]> {
    const configs = await this.fiscalConfigRepo.findApplicableConfigs(
      context.storeId,
      context.productData
    );

    const calculationDate = context.calculationDate || new Date();

    return configs.filter(config => {
      // Verificar se está ativo
      if (!config.is_active) return false;

      // Verificar período de validade
      if (!config.isValidForDate(calculationDate)) return false;

      // Verificar se aplica ao produto
      return config.appliesTo(context.productData);
    });
  }

  private getAppliedRuleDescription(config: FiscalConfig, context: FiscalRuleContext): string {
    const rules: string[] = [];

    if (config.applies_to_ncm && context.productData.ncm_code) {
      rules.push(`NCM: ${context.productData.ncm_code}`);
    }

    if (config.applies_to_categories && context.productData.category_id) {
      rules.push(`Categoria: ${context.productData.category_id}`);
    }

    if (config.min_value || config.max_value) {
      const min = config.min_value || 0;
      const max = config.max_value || 'ilimitado';
      rules.push(`Valor: R$ ${min} - R$ ${max}`);
    }

    return rules.length > 0 ? rules.join(', ') : 'Regra geral';
  }

  private removeDuplicatesByType(results: TaxCalculationResult[]): TaxCalculationResult[] {
    const typeMap = new Map<FiscalConfigType, TaxCalculationResult>();

    for (const result of results) {
      const existing = typeMap.get(result.config.config_type);
      if (!existing || result.config.priority > existing.config.priority) {
        typeMap.set(result.config.config_type, result);
      }
    }

    return Array.from(typeMap.values());
  }

  private findConflictingConfigs(results: TaxCalculationResult[]): TaxCalculationResult[] {
    const conflicts: TaxCalculationResult[] = [];
    const typeGroups = this.groupResultsByType(results);

    for (const [type, groupResults] of typeGroups.entries()) {
      if (groupResults.length > 1) {
        // Verificar se há configurações com mesma prioridade
        const priorityGroups = new Map<number, TaxCalculationResult[]>();
        
        for (const result of groupResults) {
          const priority = result.config.priority;
          if (!priorityGroups.has(priority)) {
            priorityGroups.set(priority, []);
          }
          priorityGroups.get(priority)!.push(result);
        }

        for (const [priority, sameP] of priorityGroups.entries()) {
          if (sameP.length > 1) {
            conflicts.push(...sameP);
          }
        }
      }
    }

    return conflicts;
  }

  private groupConfigsByType(configs: FiscalConfig[]): Map<FiscalConfigType, FiscalConfig[]> {
    const groups = new Map<FiscalConfigType, FiscalConfig[]>();
    
    for (const config of configs) {
      if (!groups.has(config.config_type)) {
        groups.set(config.config_type, []);
      }
      groups.get(config.config_type)!.push(config);
    }

    return groups;
  }

  private groupResultsByType(results: TaxCalculationResult[]): Map<FiscalConfigType, TaxCalculationResult[]> {
    const groups = new Map<FiscalConfigType, TaxCalculationResult[]>();
    
    for (const result of results) {
      if (!groups.has(result.config.config_type)) {
        groups.set(result.config.config_type, []);
      }
      groups.get(result.config.config_type)!.push(result);
    }

    return groups;
  }
}