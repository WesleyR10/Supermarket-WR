import { IUseCase } from '../../../../shared/application/use-case.interface';
import { PaginationOutput, PaginationOutputMapper } from '../../../../shared/application/pagination-output';
import { IAddressRepository, AddressSearchParams, AddressSearchResult } from '../../../domain/repositories/address.repository.interface';
import { AddressOutput, AddressOutputMapper } from '../common/address-output';
import { ListAddressesInput } from './list-addresses.input';

export type ListAddressesOutput = PaginationOutput<AddressOutput>;

export class ListAddressesUseCase
  implements IUseCase<ListAddressesInput, ListAddressesOutput>
{
  constructor(private addressRepository: IAddressRepository) {}

  async execute(input: ListAddressesInput): Promise<ListAddressesOutput> {
    const params = AddressSearchParams.create(input);
    const searchResult = await this.addressRepository.search(params);
    return this.toOutput(searchResult);
  }

  private toOutput(searchResult: AddressSearchResult): ListAddressesOutput {
    const { items: _items } = searchResult;
    const items = _items.map((i) => {
      return AddressOutputMapper.toOutput(i);
    });
    return PaginationOutputMapper.toOutput(items, searchResult);
  }
}