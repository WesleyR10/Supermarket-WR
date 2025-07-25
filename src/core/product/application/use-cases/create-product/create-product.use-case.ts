import { IUseCase } from '../../../../shared/application/use-case.interface';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';
import { Product } from '../../../domain/product.aggregate';
import { IProductRepository } from '../../../domain/repositories/product.repository.interface';
import {
  ProductOutput,
  ProductOutputMapper,
} from '../common/product-output';
import { CreateProductInput } from './create-product.input';

export class CreateProductUseCase
  implements IUseCase<CreateProductInput, CreateProductOutput>
{
  constructor(private productRepo: IProductRepository) {}

  async execute(input: CreateProductInput): Promise<CreateProductOutput> {
    const product = Product.create({
      category_id: input.category_id,
      name: input.name,
      description: input.description,
      barcode: input.barcode,
      price: input.price,
      cost_price: input.cost_price,
      is_active: input.is_active,
      brand: input.brand,
      unit_type: input.unit_type,
      weight: input.weight,
      volume: input.volume,
      dimensions: input.dimensions,
      supplier_code: input.supplier_code,
      ncm_code: input.ncm_code,
      requires_weighing: input.requires_weighing,
    });

    if (product.notification.hasErrors()) {
      throw new EntityValidationError(product.notification.toJSON());
    }

    await this.productRepo.insert(product);

    return ProductOutputMapper.toOutput(product);
  }
}

export type CreateProductOutput = ProductOutput;