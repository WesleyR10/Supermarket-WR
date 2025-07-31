import { IUseCase } from '../../../../shared/application/use-case.interface';
import { ICategoryRepository } from '../../../domain/repositories/category.repository.interface';
import { CategoryId } from '../../../domain/category.aggregate';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { Category } from '../../../domain/category.aggregate';
import { CategoryOutput, CategoryOutputMapper } from '../common/category-output';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';

export type GetCategoryInput = {
  id: string;
  store_id: string;
};

export class GetCategoryUseCase
  implements IUseCase<GetCategoryInput, CategoryOutput>
{
  constructor(private readonly categoryRepo: ICategoryRepository) {}

  async execute(input: GetCategoryInput): Promise<CategoryOutput> {
    const categoryId = new CategoryId(input.id);
    const category = await this.categoryRepo.findById(categoryId);

    if (!category) throw new NotFoundError(input.id, Category);
    
    if (category.store_id !== input.store_id) {
      throw new EntityValidationError([
        {
          store_id: ['Category does not belong to this store'],
        },
      ]);
    }
    
    return CategoryOutputMapper.toOutput(category);
  }
}