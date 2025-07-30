import { MaxLength, MinLength, Min, Max } from 'class-validator';
import { FiscalConfig } from './fiscal-config.aggregate';
import { ClassValidatorFields } from '../../shared/domain/validators/class-validator-fields';
import { Notification } from '../../shared/domain/validators/notification';

export class FiscalConfigRules {
  @MinLength(2, { groups: ['config_name'] })
  @MaxLength(100, { groups: ['config_name'] })
  config_name: string;

  @Min(0, { groups: ['tax_rate'] })
  @Max(100, { groups: ['tax_rate'] })
  tax_rate?: number | null;

  @Min(0, { groups: ['min_value'] })
  min_value?: number | null;

  @Min(0, { groups: ['max_value'] })
  max_value?: number | null;

  @Min(0, { groups: ['priority'] })
  @Max(10, { groups: ['priority'] })
  priority: number;

  @MaxLength(500, { groups: ['description'] })
  description?: string | null;

  constructor(fiscalConfig: FiscalConfig) {
    Object.assign(this, fiscalConfig);
  }
}

export class FiscalConfigValidator extends ClassValidatorFields {
  validate(notification: Notification, data: any, fields?: string[]): boolean {
    const newFields = fields?.length ? fields : [
      'config_name',
      'tax_rate',
      'min_value',
      'max_value',
      'priority',
      'description'
    ];
    
    return super.validate(notification, new FiscalConfigRules(data), newFields);
  }
}

export class FiscalConfigValidatorFactory {
  static create(): FiscalConfigValidator {
    return new FiscalConfigValidator();
  }
}