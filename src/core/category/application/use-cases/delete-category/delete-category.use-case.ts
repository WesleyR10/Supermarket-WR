import { IUseCase } from '../../../../shared/application/use-case.interface';
import { ICategoryRepository } from '../../../domain/repositories/category.repository.interface';
import { CategoryId } from '../../../domain/category.aggregate';
import { Category } from '../../../domain/category.aggregate';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';

export type DeleteCategoryInput = {
  id: string;
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

    if (!category) {
      throw new NotFoundError(input.id, Category);
    }

    // Verificar se a categoria tem subcategorias
    const subcategories = await this.categoryRepo.findByParentId(categoryId);
    if (subcategories.length > 0) {
      throw new Error('Cannot delete category with subcategories');
    }

    await this.categoryRepo.delete(categoryId);

    return {
      id: input.id,
      deleted: true,
    };
  }
} 