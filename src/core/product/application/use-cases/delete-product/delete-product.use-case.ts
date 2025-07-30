import { IUseCase } from '../../../../shared/application/use-case.interface';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { Product, ProductId } from '../../../domain/product.aggregate';
import { IProductRepository } from '../../../domain/repositories/product.repository.interface';

export type DeleteProductInput = {
  id: string;
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

    await this.productRepo.delete(productId);
  }
}