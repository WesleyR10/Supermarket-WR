import { IUseCase } from '../../../../shared/application/use-case.interface';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';
import { Address } from '../../../domain/address.aggregate';
import { IAddressRepository } from '../../../domain/repositories/address.repository.interface';
import { AddressOutput, AddressOutputMapper } from '../common/address-output';
import { CreateAddressInput } from './create-address.input';

export class CreateAddressUseCase
  implements IUseCase<CreateAddressInput, AddressOutput>
{
  constructor(private readonly addressRepository: IAddressRepository) {}

  async execute(input: CreateAddressInput): Promise<AddressOutput> {
    const entity = Address.create(input);

    if (entity.notification.hasErrors()) {
      throw new EntityValidationError(entity.notification.toJSON());
    }

    await this.addressRepository.insert(entity);

    return AddressOutputMapper.toOutput(entity);
  }
}