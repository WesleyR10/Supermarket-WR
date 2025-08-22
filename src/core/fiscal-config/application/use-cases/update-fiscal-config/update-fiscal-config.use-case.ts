import { IUseCase } from '../../../../shared/application/use-case.interface';
import { IFiscalConfigRepository } from '../../../domain/repositories/fiscal-config.repository.interface';
import { FiscalConfigId } from '../../../domain/fiscal-config.aggregate';
import { FiscalConfig } from '../../../domain/fiscal-config.aggregate';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';
import { FieldsErrors } from '../../../../shared/domain/validators/validator-fields-interface';
import { UpdateFiscalConfigInput } from './update-fiscal-config.input';
import { FiscalConfigOutput, FiscalConfigOutputMapper } from '../common/fiscal-config-output';

export class UpdateFiscalConfigUseCase
  implements IUseCase<UpdateFiscalConfigInput, FiscalConfigOutput>
{
  constructor(private readonly fiscalConfigRepo: IFiscalConfigRepository) {}

  async execute(input: UpdateFiscalConfigInput): Promise<FiscalConfigOutput> {
    // Validações de sintaxe
    this.validateInput(input);

    const fiscalConfigId = new FiscalConfigId(input.id);
    const fiscalConfig = await this.fiscalConfigRepo.findById(fiscalConfigId);

    if (!fiscalConfig) {
      throw new NotFoundError(input.id, FiscalConfig);
    }

    if (fiscalConfig.store_id !== input.store_id) {
      throw new EntityValidationError([
        {
          store_id: ['Fiscal config does not belong to this store'],
        },
      ]);
    }

    // Atualizar propriedades
    if (input.config_name !== undefined) fiscalConfig.changeName(input.config_name);
    if (input.description !== undefined) fiscalConfig.changeDescription(input.description);
    if (input.tax_rate !== undefined) fiscalConfig.updateTaxRate(input.tax_rate);
    if (input.is_active !== undefined) {
      input.is_active ? fiscalConfig.activate() : fiscalConfig.deactivate();
    }
    if (input.priority !== undefined) fiscalConfig.updatePriority(input.priority);
    if (input.start_date !== undefined || input.end_date !== undefined) {
      fiscalConfig.setValidityPeriod(
        input.start_date !== undefined ? input.start_date : fiscalConfig.start_date,
        input.end_date !== undefined ? input.end_date : fiscalConfig.end_date
      );
    }
    if (input.config_type !== undefined) fiscalConfig.config_type = input.config_type;
    if (input.applies_to_ncm !== undefined) fiscalConfig.applies_to_ncm = input.applies_to_ncm;
    if (input.applies_to_categories !== undefined) fiscalConfig.applies_to_categories = input.applies_to_categories;
    if (input.min_value !== undefined) fiscalConfig.min_value = input.min_value;
    if (input.max_value !== undefined) fiscalConfig.max_value = input.max_value;
    if (input.metadata !== undefined) fiscalConfig.metadata = input.metadata;

    // Validar regras de negócio
    this.validateBusinessRules(fiscalConfig);

    if (fiscalConfig.notification.hasErrors()) {
      const fieldsErrors = this.convertNotificationToFieldsErrors(
        fiscalConfig.notification.toJSON()
      );
      throw new EntityValidationError([fieldsErrors]);
    }

    await this.fiscalConfigRepo.update(fiscalConfig);
    return FiscalConfigOutputMapper.toOutput(fiscalConfig);
  }

  private validateInput(input: UpdateFiscalConfigInput): void {
    const errors: { [field: string]: string[] } = {};

    // Validação de ID
    if (!input.id || typeof input.id !== 'string' || input.id.trim() === '') {
      errors.id = ['ID is required and must be a non-empty string'];
    }

    // Validação de store_id
    if (!input.store_id || typeof input.store_id !== 'string' || input.store_id.trim() === '') {
      errors.store_id = ['Store ID is required and must be a non-empty string'];
    }

    // Validação de config_name
    if (input.config_name !== undefined) {
      if (typeof input.config_name !== 'string' || input.config_name.trim() === '') {
        errors.config_name = ['Config name must be a non-empty string'];
      }
    }

    // Validação de tax_rate
    if (input.tax_rate !== undefined && input.tax_rate !== null) {
      if (typeof input.tax_rate !== 'number' || input.tax_rate < 0 || input.tax_rate > 100) {
        errors.tax_rate = ['Tax rate must be a number between 0 and 100'];
      }
    }

    // Validação de priority
    if (input.priority !== undefined) {
      if (typeof input.priority !== 'number' || input.priority < 0) {
        errors.priority = ['Priority must be a non-negative number'];
      }
    }

    // Validação de min_value e max_value
    if (input.min_value !== undefined && input.min_value !== null) {
      if (typeof input.min_value !== 'number' || input.min_value < 0) {
        errors.min_value = ['Min value must be a non-negative number'];
      }
    }

    if (input.max_value !== undefined && input.max_value !== null) {
      if (typeof input.max_value !== 'number' || input.max_value < 0) {
        errors.max_value = ['Max value must be a non-negative number'];
      }
    }

    // Validação de min_value vs max_value
    if (
      input.min_value !== undefined && input.min_value !== null &&
      input.max_value !== undefined && input.max_value !== null &&
      input.min_value > input.max_value
    ) {
      if (!errors.min_value) errors.min_value = [];
      errors.min_value.push('Min value cannot be greater than max value');
    }

    // Validação de datas
    if (input.start_date !== undefined && input.start_date !== null) {
      if (!(input.start_date instanceof Date) && typeof input.start_date !== 'string') {
        errors.start_date = ['Start date must be a valid date'];
      }
    }

    if (input.end_date !== undefined && input.end_date !== null) {
      if (!(input.end_date instanceof Date) && typeof input.end_date !== 'string') {
        errors.end_date = ['End date must be a valid date'];
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new EntityValidationError([errors]);
    }
  }

  private validateBusinessRules(fiscalConfig: FiscalConfig): void {
    // Validar se as datas fazem sentido
    if (fiscalConfig.start_date && fiscalConfig.end_date) {
      if (fiscalConfig.start_date > fiscalConfig.end_date) {
        fiscalConfig.notification.addError(
          'start_date',
          'Start date cannot be after end date'
        );
      }
    }

    // Validar se min_value e max_value fazem sentido
    if (fiscalConfig.min_value !== null && fiscalConfig.max_value !== null) {
      if (fiscalConfig.min_value > fiscalConfig.max_value) {
        fiscalConfig.notification.addError(
          'min_value',
          'Min value cannot be greater than max value'
        );
      }
    }

    // Validar tax_rate
    if (fiscalConfig.tax_rate !== null && (fiscalConfig.tax_rate < 0 || fiscalConfig.tax_rate > 100)) {
      fiscalConfig.notification.addError(
        'tax_rate',
        'Tax rate must be between 0 and 100'
      );
    }

    // Validar priority
    if (fiscalConfig.priority < 0) {
      fiscalConfig.notification.addError(
        'priority',
        'Priority must be a non-negative number'
      );
    }
  }

  private convertNotificationToFieldsErrors(
    notificationErrors: Array<string | { [key: string]: string[] }>
  ): FieldsErrors {
    const fieldsErrors: { [field: string]: string[] } = {};
    
    notificationErrors.forEach((error) => {
      if (typeof error === 'string') {
        if (!fieldsErrors['_general']) {
          fieldsErrors['_general'] = [];
        }
        fieldsErrors['_general'].push(error);
      } else {
        Object.entries(error).forEach(([field, messages]) => {
          if (!fieldsErrors[field]) {
            fieldsErrors[field] = [];
          }
          fieldsErrors[field].push(...messages);
        });
      }
    });
    
    return fieldsErrors;
  }
}