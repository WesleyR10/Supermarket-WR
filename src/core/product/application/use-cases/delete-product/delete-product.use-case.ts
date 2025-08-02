import { IUseCase } from '../../../../shared/application/use-case.interface';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';
import { Product, ProductId } from '../../../domain/product.aggregate';
import { IProductRepository } from '../../../domain/repositories/product.repository.interface';

export type DeleteProductInput = {
  id: string;
  store_id: string; // Adicionado
};

export type DeleteProductOutput = void;

export class DeleteProductUseCase
  implements IUseCase<DeleteProductInput, DeleteProductOutput>
{
  constructor(private readonly productRepo: IProductRepository) {}

  async execute(input: DeleteProductInput): Promise<DeleteProductOutput> {
    const productId = new ProductId(input.id);
    const product = await this.productRepo.findById(productId);

    if (!product) {
      throw new NotFoundError(input.id, Product);
    }

    // Validação de multi-tenancy
    if (product.store_id !== input.store_id) {
      throw new EntityValidationError([
        {
          store_id: ['Product does not belong to this store'],
        },
      ]);
    }

    await this.productRepo.delete(productId);
  }
}