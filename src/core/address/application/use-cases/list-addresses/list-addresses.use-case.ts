import { IUseCase } from '../../../../shared/application/use-case.interface';
import { SearchInput } from '../../../../shared/application/search-input';
import { PaginationOutput, PaginationOutputMapper } from '../../../../shared/application/pagination-output';
import { IAddressRepository, AddressSearchParams, AddressFilter } from '../../../domain/repositories/address.repository.interface';
import { AddressOutput, AddressOutputMapper } from '../common/address-output';

export type ListAddressesInput = SearchInput<AddressFilter>;

export type ListAddressesOutput = PaginationOutput<AddressOutput>;

export class ListAddressesUseCase
  implements IUseCase<ListAddressesInput, ListAddressesOutput>
{
  constructor(private addressRepository: IAddressRepository) {}

  async execute(input: ListAddressesInput): Promise<ListAddressesOutput> {
    const params = new AddressSearchParams(input);
    const searchResult = await this.addressRepository.search(params);
    return this.toOutput(searchResult);
  }

  private toOutput(searchResult: any): ListAddressesOutput {
    const { items: _items } = searchResult;
    const items = _items.map((i) => {
      return AddressOutputMapper.toOutput(i);
    });
    return PaginationOutputMapper.toOutput(items, searchResult);
  }
}