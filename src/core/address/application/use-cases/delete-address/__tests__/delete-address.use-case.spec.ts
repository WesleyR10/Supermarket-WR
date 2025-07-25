import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';
import { Address, AddressId } from '../../../../domain/address.aggregate';
import { AddressInMemoryRepository } from '../../../../infra/db/in-memory/address-in-memory.repository';
import { DeleteAddressUseCase } from '../delete-address.use-case';

describe('DeleteAddressUseCase Unit Tests', () => {
  let useCase: DeleteAddressUseCase;
  let repository: AddressInMemoryRepository;

  beforeEach(() => {
    repository = new AddressInMemoryRepository();
    useCase = new DeleteAddressUseCase(repository);
  });

  it('should throws error when entity not found', async () => {
    const addressId = new AddressId();
    await expect(() => useCase.execute({ id: addressId.id })).rejects.toThrow(
      new NotFoundError(addressId.id, Address),
    );
  });

  it('should delete a address', async () => {
    const entity = Address.fake().anAddress().build();
    repository.items = [entity];
    const spyUpdate = jest.spyOn(repository, 'update');
    await useCase.execute({ id: entity.address_id.id });
    expect(spyUpdate).toHaveBeenCalledTimes(1);
    expect(entity.status).toBe('DELETED');
  });
});