import {
  PaginationOutput,
  PaginationOutputMapper,
} from '../../../../shared/application/pagination-output';
import { IUseCase } from '../../../../shared/application/use-case.interface';
import {
  ProductSearchParams,
  ProductSearchResult,
  IProductRepository,
} from '../../../domain/repositories/product.repository.interface';
import {
  ProductOutput,
  ProductOutputMapper,
} from '../common/product-output';
import { ListProductsInput } from './list-products.input';

export class ListProductsUseCase
  implements IUseCase<ListProductsInput, ListProductsOutput>
{
  constructor(private productRepo: IProductRepository) {}

  async execute(input: ListProductsInput): Promise<ListProductsOutput> {
    const params = ProductSearchParams.create(input);
    const searchResult = await this.productRepo.search(params);
    return this.toOutput(searchResult);
  }

  private toOutput(searchResult: ProductSearchResult): ListProductsOutput {
    const { items: _items } = searchResult;
    const items = _items.map((i) => {
      return ProductOutputMapper.toOutput(i);
    });
    return PaginationOutputMapper.toOutput(items, searchResult);
  }
}

export type ListProductsOutput = PaginationOutput<ProductOutput>;