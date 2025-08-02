import { IUseCase } from '../../../../shared/application/use-case.interface';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';
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
    
    if (product.store_id !== input.store_id) {
      throw new EntityValidationError([
        {
          store_id: ['Product does not belong to this store'],
        },
      ]);
    }

    return ProductOutputMapper.toOutput(product);
  }
}

export type GetProductInput = {
  id: string;
  store_id: string; // Adicionado
};

export type GetProductOutput = ProductOutput;