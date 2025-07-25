import { IUseCase } from '../../../../shared/application/use-case.interface';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';
import { Address, AddressId } from '../../../domain/address.aggregate';
import { IAddressRepository } from '../../../domain/repositories/address.repository.interface';
import { AddressOutput, AddressOutputMapper } from '../common/address-output';
import { UpdateAddressInput } from './update-address.input';

export class UpdateAddressUseCase
  implements IUseCase<UpdateAddressInput, AddressOutput>
{
  constructor(private readonly addressRepository: IAddressRepository) {}

  async execute(input: UpdateAddressInput): Promise<AddressOutput> {
    const addressId = new AddressId(input.id);
    const entity = await this.addressRepository.findById(addressId);
    if (!entity) {
      throw new NotFoundError(input.id, Address);
    }

    if (input.street || input.number || input.complement !== undefined || 
        input.neighborhood || input.city || input.state || input.zipcode) {
      entity.updateAddress({
        street: input.street,
        number: input.number,
        complement: input.complement,
        neighborhood: input.neighborhood,
        city: input.city,
        state: input.state,
        zipcode: input.zipcode,
      });
    }

    if (input.address_type) {
      entity.address_type = input.address_type;
      entity.updated_at = new Date();
    }

    if (input.is_primary !== undefined) {
      if (input.is_primary) {
        entity.setAsPrimary();
      } else {
        entity.unsetAsPrimary();
      }
    }

    if (input.status) {
      if (input.status === 'ACTIVE') {
        entity.activate();
      } else if (input.status === 'INACTIVE') {
        entity.deactivate();
      } else if (input.status === 'DELETED') {
        entity.markAsDeleted();
      }
    }

    entity.validate();
    if (entity.notification.hasErrors()) {
      throw new EntityValidationError(entity.notification.toJSON());
    }

    await this.addressRepository.update(entity);
    return AddressOutputMapper.toOutput(entity);
  }
}