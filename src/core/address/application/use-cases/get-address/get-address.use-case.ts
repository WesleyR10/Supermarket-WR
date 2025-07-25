import { IUseCase } from '../../../../shared/application/use-case.interface';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { Address, AddressId } from '../../../domain/address.aggregate';
import { IAddressRepository } from '../../../domain/repositories/address.repository.interface';
import { AddressOutput, AddressOutputMapper } from '../common/address-output';

export type GetAddressInput = {
  id: string;
};

export class GetAddressUseCase
  implements IUseCase<GetAddressInput, AddressOutput>
{
  constructor(private addressRepository: IAddressRepository) {}

  async execute(input: GetAddressInput): Promise<AddressOutput> {
    const addressId = new AddressId(input.id);
    const entity = await this.addressRepository.findById(addressId);
    if (!entity) {
      throw new NotFoundError(input.id, Address);
    }

    return AddressOutputMapper.toOutput(entity);
  }
}