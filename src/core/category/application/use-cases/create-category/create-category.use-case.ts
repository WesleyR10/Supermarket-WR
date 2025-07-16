import { IUseCase } from '../../../../shared/application/use-case.interface';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';
import { FieldsErrors } from '../../../../shared/domain/validators/validator-fields-interface';
import { Category } from '../../../domain/category.aggregate';
import { ICategoryRepository } from '../../../domain/repositories/category.repository.interface';
import { CategoryOutput,CategoryOutputMapper  } from '../common/category-output';
import { CreateCategoryInput } from './create-category.input';

export class CreateCategoryUseCase
  implements IUseCase<CreateCategoryInput, CreateCategoryOutput>
{
  constructor(private readonly categoryRepo: ICategoryRepository) {}

  async execute(input: CreateCategoryInput): Promise<CreateCategoryOutput> {
    // Validações de sintaxe e formato (Use Case responsibility)
    this.validateInput(input);

    // Criação da entidade (Domain responsibility)
    const entity = Category.create(input);

    // Validações de domínio específicas do supermercado
    this.validateBusinessRules(entity);

     if (entity.notification.hasErrors()) {
      const errors = this.convertNotificationToFieldsErrors(entity.notification.toJSON());
      throw new EntityValidationError([errors]);
    }


    // Persistência
    await this.categoryRepo.insert(entity);

    return CategoryOutputMapper.toOutput(entity);
  }

  private convertNotificationToFieldsErrors(
    notificationErrors: Array<string | { [key: string]: string[] }>
  ): FieldsErrors {
    const fieldsErrors: FieldsErrors = {};

    notificationErrors.forEach((error) => {
      if (typeof error === 'string') {
        // Erro geral (sem campo específico)
        if (!fieldsErrors['_general']) {
          fieldsErrors['_general'] = [];
        }
        fieldsErrors['_general'].push(error);
      } else {
        // Erro específico de campo
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

  private validateInput(input: CreateCategoryInput): void {
    const errors: string[] = [];

    // Validações de sintaxe (formato, tipos, etc.)
    if (!input.name || typeof input.name !== 'string') {
      errors.push('Name is required and must be a string');
    }

    if (input.name && input.name.trim().length === 0) {
      errors.push('Name cannot be empty');
    }

    if (input.name && input.name.length > 100) {
      errors.push('Name cannot exceed 100 characters');
    }

    if (input.description !== undefined && input.description !== null && typeof input.description !== 'string') {
      errors.push('Description must be a string or null');
    }

    if (input.description && input.description.length > 500) {
      errors.push('Description cannot exceed 500 characters');
    }

    if (input.is_active !== undefined && typeof input.is_active !== 'boolean') {
      errors.push('is_active must be a boolean');
    }

    // Validações específicas do supermercado
    if (input.tax_rate !== undefined && input.tax_rate !== null) {
      if (typeof input.tax_rate !== 'number') {
        errors.push('Tax rate must be a number');
      } else if (input.tax_rate < 0 || input.tax_rate > 100) {
        errors.push('Tax rate must be between 0 and 100');
      }
    }

    if (input.default_margin_percentage !== undefined && input.default_margin_percentage !== null) {
      if (typeof input.default_margin_percentage !== 'number') {
        errors.push('Default margin percentage must be a number');
      } else if (input.default_margin_percentage < 0) {
        errors.push('Default margin percentage cannot be negative');
      } else if (input.default_margin_percentage > 500) {
        errors.push('Default margin percentage cannot exceed 500%');
      }
    }

    if (input.display_order !== undefined) {
      if (typeof input.display_order !== 'number') {
        errors.push('Display order must be a number');
      } else if (input.display_order < 0) {
        errors.push('Display order cannot be negative');
      }
    }

    if (input.icon_name !== undefined && input.icon_name !== null) {
      if (typeof input.icon_name !== 'string') {
        errors.push('Icon name must be a string');
      } else if (input.icon_name.length > 50) {
        errors.push('Icon name cannot exceed 50 characters');
      } else if (!/^[a-zA-Z0-9-_]+$/.test(input.icon_name)) {
        errors.push('Icon name can only contain letters, numbers, hyphens and underscores');
      }
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
  }

  private validateBusinessRules(entity: Category): void {
    // Regras de negócio específicas do supermercado
  
    // Regra: Categorias perecíveis devem ter controle de validade
    if (entity.isPerishableCategory() && !entity.requires_expiry_date) {
      entity.notification.addError(
        'Perishable categories must require expiry date control',
        'requires_expiry_date'
      );
    }
  
    // Regra: Categorias que devem ter tax rate não podem ter tax_rate null
    if (entity.shouldHaveTaxRate() && entity.tax_rate === null) {
      entity.notification.addError(
        'This category type typically requires a tax rate',
        'tax_rate'
      );
    }

  }
} 

export type CreateCategoryOutput = CategoryOutput