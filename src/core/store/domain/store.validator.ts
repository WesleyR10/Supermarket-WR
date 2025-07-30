import { MaxLength, MinLength, Matches, IsNotEmpty, IsObject } from 'class-validator';
import { Store } from './store.aggregate';
import { ClassValidatorFields } from '../../shared/domain/validators/class-validator-fields';
import { Notification } from '../../shared/domain/validators/notification';

export class StoreRules {
  @IsNotEmpty({ groups: ['name'] })
  @MinLength(2, { groups: ['name'] })
  @MaxLength(100, { groups: ['name'] })
  name: string;

  @IsNotEmpty({ groups: ['cnpj'] })
  @Matches(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, { 
    groups: ['cnpj'],
    message: 'CNPJ deve estar no formato XX.XXX.XXX/XXXX-XX'
  })
  cnpj: string;

  @IsObject({ groups: ['settings'] })
  settings: object;

  @IsObject({ groups: ['subscription'] })
  subscription: object;

  constructor(store: Store) {
    Object.assign(this, store);
  }
}

export class StoreValidator extends ClassValidatorFields {
  validate(notification: Notification, data: any, fields?: string[]): boolean {
    const newFields = fields?.length ? fields : [
      'name',
      'cnpj',
      'settings',
      'subscription'
    ];
    
    const isValid = super.validate(notification, new StoreRules(data), newFields);
    
    // Validações customizadas
    if (fields?.includes('cnpj') || !fields) {
      this.validateCNPJ(notification, data.cnpj);
    }
    
    if (fields?.includes('settings') || !fields) {
      this.validateSettings(notification, data.settings);
    }
    
    if (fields?.includes('subscription') || !fields) {
      this.validateSubscription(notification, data.subscription);
    }
    
    return isValid && !notification.hasErrors();
  }
  
  private validateCNPJ(notification: Notification, cnpj: string): void {
    if (!cnpj) return;
    
    // Remove formatação
    const cleanCNPJ = cnpj.replace(/[^\d]/g, '');
    
    if (cleanCNPJ.length !== 14) {
      notification.addError('CNPJ deve ter 14 dígitos', 'cnpj');
      return;
    }
    
    // Validação básica de CNPJ (algoritmo simplificado)
    if (this.isInvalidCNPJ(cleanCNPJ)) {
      notification.addError('CNPJ inválido', 'cnpj');
    }
  }
  
  private validateSettings(notification: Notification, settings: any): void {
    if (!settings) return;
    
    // Validar business_hours
    if (settings.business_hours) {
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      for (const day of days) {
        if (settings.business_hours[day]) {
          const dayConfig = settings.business_hours[day];
          if (!dayConfig.closed) {
            // Verificar se os horários são válidos (formato HH:MM)
            const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
            if (!dayConfig.open || !dayConfig.close || 
                !timeRegex.test(dayConfig.open) || !timeRegex.test(dayConfig.close)) {
              notification.addError(`Horário de funcionamento inválido para ${day}`, 'settings.business_hours');
            }
          }
        }
      }
    }
    
    // Validar sales_config
    if (settings.sales_config) {
      const salesConfig = settings.sales_config;
      if (salesConfig.max_discount_percentage && (salesConfig.max_discount_percentage < 0 || salesConfig.max_discount_percentage > 100)) {
        notification.addError('Percentual máximo de desconto deve estar entre 0 e 100', 'settings.sales_config');
      }
    }
    
    // Validar inventory_config
    if (settings.inventory_config) {
      const inventoryConfig = settings.inventory_config;
      if (inventoryConfig.low_stock_threshold !== undefined && inventoryConfig.low_stock_threshold <= 0) {
        notification.addError('Limite mínimo de estoque deve ser maior que zero', 'settings.inventory_config');
      }
    }
  }
  
  private validateSubscription(notification: Notification, subscription: any): void {
    if (!subscription) return;
    
    if (subscription.start_date && subscription.end_date) {
      if (new Date(subscription.start_date) >= new Date(subscription.end_date)) {
        notification.addError('Data de fim da assinatura deve ser posterior à data de início', 'subscription');
      }
    }
    
    if (subscription.features) {
      const features = subscription.features;
      if (features.max_products && features.max_products <= 0) {
        notification.addError('Número máximo de produtos deve ser maior que zero', 'subscription.features');
      }
      if (features.max_employees && features.max_employees <= 0) {
        notification.addError('Número máximo de funcionários deve ser maior que zero', 'subscription.features');
      }
    }
    
    if (subscription.billing_info) {
      const billing = subscription.billing_info;
      if (billing.amount && billing.amount <= 0) {
        notification.addError('Valor da assinatura deve ser maior que zero', 'subscription.billing_info');
      }
    }
  }
  
  private isInvalidCNPJ(cnpj: string): boolean {
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{13}$/.test(cnpj)) {
      return true;
    }
    
    // Algoritmo de validação do CNPJ (simplificado)
    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cnpj[i]) * weights1[i];
    }
    
    let remainder = sum % 11;
    const digit1 = remainder < 2 ? 0 : 11 - remainder;
    
    if (parseInt(cnpj[12]) !== digit1) {
      return true;
    }
    
    sum = 0;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cnpj[i]) * weights2[i];
    }
    
    remainder = sum % 11;
    const digit2 = remainder < 2 ? 0 : 11 - remainder;
    
    return parseInt(cnpj[13]) !== digit2;
  }
}

export class StoreValidatorFactory {
  static create(): StoreValidator {
    return new StoreValidator();
  }
}