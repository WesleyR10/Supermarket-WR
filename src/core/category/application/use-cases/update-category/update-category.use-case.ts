import { IUseCase } from '../../../../shared/application/use-case.interface';
import { ICategoryRepository } from '../../../domain/repositories/category.repository.interface';
import { CategoryId } from '../../../domain/category.aggregate';
import { Category } from '../../../domain/category.aggregate';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';
import { FieldsErrors } from '../../../../shared/domain/validators/validator-fields-interface';
import { UpdateCategoryInput } from './update-category.input';
import { CategoryOutput, CategoryOutputMapper } from '../common/category-output';

export class UpdateCategoryUseCase
  implements IUseCase<UpdateCategoryInput, CategoryOutput>
{
  constructor(private readonly categoryRepo: ICategoryRepository) {}

  async execute(input: UpdateCategoryInput): Promise<CategoryOutput> {
    // Validações de sintaxe
    this.validateInput(input);

    const categoryId = new CategoryId(input.id);
    const category = await this.categoryRepo.findById(categoryId);

    if (!category) {
      throw new NotFoundError(input.id, Category);
    }

    if (category.store_id !== input.store_id) {
      throw new EntityValidationError([
        {
          store_id: ['Category does not belong to this store'],
        },
      ]);
    }
    // Atualizar propriedades
    if (input.name !== undefined) category.name = input.name;
    if (input.description !== undefined) category.description = input.description;
    if (input.is_active !== undefined) category.is_active = input.is_active;
    if (input.parent_category_id !== undefined) {
      category.parent_category_id = input.parent_category_id ? new CategoryId(input.parent_category_id) : null;
    }
    if (input.tax_rate !== undefined) category.tax_rate = input.tax_rate;
    if (input.default_margin_percentage !== undefined) category.default_margin_percentage = input.default_margin_percentage;
    if (input.requires_expiry_date !== undefined) category.requires_expiry_date = input.requires_expiry_date;
    if (input.display_order !== undefined) category.display_order = input.display_order;
    if (input.icon_name !== undefined) category.icon_name = input.icon_name;

    // Validar regras de negócio
    this.validateBusinessRules(category);

    if (category.notification.hasErrors()) {
      const errors = this.convertNotificationToFieldsErrors(category.notification.toJSON());
      throw new EntityValidationError([errors]);
    }

    await this.categoryRepo.update(category);

    return CategoryOutputMapper.toOutput(category);
  }

  private validateInput(input: UpdateCategoryInput): void {
    const errors: string[] = [];

    if (!input.id || typeof input.id !== 'string') {
      errors.push('ID is required and must be a string');
    }

    if (input.name !== undefined) {
      if (typeof input.name !== 'string') {
        errors.push('Name must be a string');
      } else if (input.name.trim().length === 0) {
        errors.push('Name cannot be empty');
      } else if (input.name.length > 100) {
        errors.push('Name cannot exceed 100 characters');
      }
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

  private validateBusinessRules(category: Category): void {
    // Regras de negócio específicas do supermercado

    if (category.isPerishableCategory() && !category.requires_expiry_date) {
      category.notification.addError(
        'Perishable categories must require expiry date control',
        'requires_expiry_date'
      );
    }

    if (category.shouldHaveTaxRate() && category.tax_rate === null) {
      category.notification.addError(
        'This category type typically requires a tax rate',
        'tax_rate'
      );
    }

    if (!category.isPromotionEligible() && category.name.toLowerCase().includes('medicamento')) {
      category.notification.addError(
        'Medication categories cannot be promotion eligible',
        'name'
      );
    }

    if (category.default_margin_percentage && category.default_margin_percentage > 200) {
      console.warn(`High margin percentage (${category.default_margin_percentage}%) for category: ${category.name}`);
    }
  }

  private convertNotificationToFieldsErrors(
    notificationErrors: Array<string | { [key: string]: string[] }>
  ): FieldsErrors {
    const fieldsErrors: FieldsErrors = {};

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