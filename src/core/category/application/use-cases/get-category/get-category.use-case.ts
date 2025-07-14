import { IUseCase } from '../../../../shared/application/use-case.interface';
import { ICategoryRepository } from '../../../domain/repositories/category.repository.interface';
import { CategoryId } from '../../../domain/category.aggregate';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { Category } from '../../../domain/category.aggregate';
import { GetCategoryOutput } from './get-category.output';

export type GetCategoryInput = {
  id: string;
};

export class GetCategoryUseCase
  implements IUseCase<GetCategoryInput, GetCategoryOutput>
{
  constructor(private readonly categoryRepo: ICategoryRepository) {}

  async execute(input: GetCategoryInput): Promise<GetCategoryOutput> {
    const categoryId = new CategoryId(input.id);
    const category = await this.categoryRepo.findById(categoryId);

    if (!category) {
      throw new NotFoundError(input.id, Category);
    }

    return this.toOutput(category);
  }

  private toOutput(category: Category): GetCategoryOutput {
    return {
      id: category.category_id.id,
      name: category.name,
      description: category.description,
      is_active: category.is_active,
      parent_category_id: category.parent_category_id?.id || null,
      tax_rate: category.tax_rate,
      default_margin_percentage: category.default_margin_percentage,
      requires_expiry_date: category.requires_expiry_date,
      display_order: category.display_order,
      icon_name: category.icon_name,
      created_at: category.created_at,
    };
  }
} 