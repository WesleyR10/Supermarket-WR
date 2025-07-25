import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';
import { Address, AddressId } from '../../../../domain/address.aggregate';
import { AddressInMemoryRepository } from '../../../../infra/db/in-memory/address-in-memory.repository';
import { GetAddressUseCase } from '../get-address.use-case';

describe('GetAddressUseCase Unit Tests', () => {
  let useCase: GetAddressUseCase;
  let repository: AddressInMemoryRepository;

  beforeEach(() => {
    repository = new AddressInMemoryRepository();
    useCase = new GetAddressUseCase(repository);
  });

  it('should throws error when entity not found', async () => {
    const addressId = new AddressId();
    await expect(() => useCase.execute({ id: addressId.id })).rejects.toThrow(
      new NotFoundError(addressId.id, Address),
    );
  });

  it('should returns a address', async () => {
    const entity = Address.fake().anAddress().build();
    repository.items = [entity];
    const spyFindById = jest.spyOn(repository, 'findById');
    const output = await useCase.execute({ id: entity.address_id.id });
    expect(spyFindById).toHaveBeenCalledTimes(1);
    expect(output).toStrictEqual({
      id: entity.address_id.id,
      client_id: entity.client_id,
      store_id: entity.store_id,
      supplier_id: entity.supplier_id,
      street: entity.street,
      number: entity.number,
      complement: entity.complement,
      neighborhood: entity.neighborhood,
      city: entity.city,
      state: entity.state,
      zipcode: entity.zipcode,
      address_type: entity.address_type,
      is_primary: entity.is_primary,
      status: entity.status,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
      deleted_at: entity.deleted_at,
    });
  });
});