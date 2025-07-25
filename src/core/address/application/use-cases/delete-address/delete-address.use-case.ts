import { IUseCase } from '../../../../shared/application/use-case.interface';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { Address, AddressId } from '../../../domain/address.aggregate';
import { IAddressRepository } from '../../../domain/repositories/address.repository.interface';

export type DeleteAddressInput = {
  id: string;
};

export type DeleteAddressOutput = void;

export class DeleteAddressUseCase
  implements IUseCase<DeleteAddressInput, DeleteAddressOutput>
{
  constructor(private addressRepository: IAddressRepository) {}

  async execute(input: DeleteAddressInput): Promise<DeleteAddressOutput> {
    const addressId = new AddressId(input.id);
    const entity = await this.addressRepository.findById(addressId);
    
    if (!entity) {
      throw new NotFoundError(input.id, Address);
    }

    entity.markAsDeleted();
    await this.addressRepository.update(entity);
  }
}