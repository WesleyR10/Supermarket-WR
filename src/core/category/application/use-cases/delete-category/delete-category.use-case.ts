import { IUseCase } from '../../../../shared/application/use-case.interface';
import { ICategoryRepository } from '../../../domain/repositories/category.repository.interface';
import { CategoryId } from '../../../domain/category.aggregate';
import { Category } from '../../../domain/category.aggregate';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { EntityValidationError } from '@core/shared/domain/validators/validation.error';

export type DeleteCategoryInput = {
  id: string;
  store_id: string;
};

export type DeleteCategoryOutput = {
  id: string;
  deleted: boolean;
};

export class DeleteCategoryUseCase
  implements IUseCase<DeleteCategoryInput, DeleteCategoryOutput>
{
  constructor(private readonly categoryRepo: ICategoryRepository) {}

  async execute(input: DeleteCategoryInput): Promise<DeleteCategoryOutput> {
    const categoryId = new CategoryId(input.id);
    
    const category = await this.categoryRepo.findById(categoryId);
    if (!category) throw new NotFoundError(input.id, Category);

    const subcategories = await this.categoryRepo.findByParentId(input.store_id, categoryId);
    category.prepareForDeletion(subcategories, input.store_id);

    if (category.notification.hasErrors()) {
      throw new EntityValidationError(category.notification.toJSON());
    }

    await this.categoryRepo.delete(categoryId);
    return { id: input.id, deleted: true };
  }
}