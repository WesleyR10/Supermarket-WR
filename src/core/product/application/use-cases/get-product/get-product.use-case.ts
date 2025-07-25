import { IUseCase } from '../../../../shared/application/use-case.interface';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { Product, ProductId } from '../../../domain/product.aggregate';
import { IProductRepository } from '../../../domain/repositories/product.repository.interface';
import {
  ProductOutput,
  ProductOutputMapper,
} from '../common/product-output';

export class GetProductUseCase
  implements IUseCase<GetProductInput, GetProductOutput>
{
  constructor(private productRepo: IProductRepository) {}

  async execute(input: GetProductInput): Promise<GetProductOutput> {
    const productId = new ProductId(input.id);
    const product = await this.productRepo.findById(productId);
    if (!product) {
      throw new NotFoundError(input.id, Product);
    }

    return ProductOutputMapper.toOutput(product);
  }
}

export type GetProductInput = {
  id: string;
};

export type GetProductOutput = ProductOutput;