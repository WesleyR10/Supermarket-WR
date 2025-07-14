import { MaxLength, MinLength, Min, Max, Matches } from 'class-validator';
import { Category } from './category.aggregate';
import { ClassValidatorFields } from '../../shared/domain/validators/class-validator-fields';
import { Notification } from '../../shared/domain/validators/notification';

export class CategoryRules {
  @MinLength(2, { groups: ['name'] })
  @MaxLength(100, { groups: ['name'] })
  name: string;

  @MaxLength(500, { groups: ['description'] })
  description?: string | null;

  @Min(0, { groups: ['tax_rate'] })
  @Max(100, { groups: ['tax_rate'] })
  tax_rate?: number | null;

  @Min(0, { groups: ['default_margin_percentage'] })
  @Max(500, { groups: ['default_margin_percentage'] })
  default_margin_percentage?: number | null;

  @Min(0, { groups: ['display_order'] })
  display_order?: number;

  @Matches(/^[a-zA-Z0-9-]+$/, { groups: ['icon_name'] })
  icon_name?: string | null;

  constructor(category: Category) {
    Object.assign(this, category);
  }
}

export class CategoryValidator extends ClassValidatorFields {
  validate(notification: Notification, data: any, fields?: string[]): boolean {
    const newFields = fields?.length ? fields : [
      'name',
      'description',
      'tax_rate',
      'default_margin_percentage',
      'display_order',
      'icon_name'
    ];
    
    return super.validate(notification, new CategoryRules(data), newFields);
  }
}

export class CategoryValidatorFactory {
  static create(): CategoryValidator {
    return new CategoryValidator();
  }
} 