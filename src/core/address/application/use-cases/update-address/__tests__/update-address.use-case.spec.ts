import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';
import { EntityValidationError } from '../../../../../shared/domain/validators/validation.error';
import { Address, AddressId, AddressType, AddressStatus } from '../../../../domain/address.aggregate';
import { AddressInMemoryRepository } from '../../../../infra/db/in-memory/address-in-memory.repository';
import { UpdateAddressUseCase } from '../update-address.use-case';
import { UpdateAddressInput } from '../update-address.input';

describe('UpdateAddressUseCase Unit Tests', () => {
  let useCase: UpdateAddressUseCase;
  let repository: AddressInMemoryRepository;

  beforeEach(() => {
    repository = new AddressInMemoryRepository();
    useCase = new UpdateAddressUseCase(repository);
  });

  it('should throws error when entity not found', async () => {
    const addressId = new AddressId();
    await expect(() => useCase.execute(new UpdateAddressInput({ id: addressId.id }))).rejects.toThrow(
      new NotFoundError(addressId.id, Address),
    );
  });

  it('should throw an Entity Validation Error', async () => {
    const entity = Address.fake().anAddress().build();
    repository.items = [entity];
    const input = new UpdateAddressInput({
      id: entity.address_id.id,
      street: '',
    });
    await expect(() => useCase.execute(input)).rejects.toThrow(EntityValidationError);
  });

  it('should update a address with address data', async () => {
    const entity = Address.fake().anAddress()
      .withStreet('Rua Antiga')
      .withNumber('456')
      .withNeighborhood('Bairro Antigo')
      .withCity('Rio de Janeiro')
      .withState('RJ')
      .withZipcode('20000-000')
      .build();
    repository.items = [entity];
    const spyUpdate = jest.spyOn(repository, 'update');
    const input = new UpdateAddressInput({
      id: entity.address_id.id,
      street: 'Rua das Flores',
      number: '123',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipcode: '01234-567',
    });
    const output = await useCase.execute(input);
    expect(spyUpdate).toHaveBeenCalledTimes(1);
    expect(output).toStrictEqual({
      id: entity.address_id.id,
      client_id: entity.client_id,
      store_id: entity.store_id,
      supplier_id: entity.supplier_id,
      street: 'Rua das Flores',
      number: '123',
      complement: entity.complement,
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipcode: '01234-567',
      address_type: entity.address_type,
      is_primary: entity.is_primary,
      status: entity.status,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
      deleted_at: entity.deleted_at,
    });
  });

  it('should update a address with status', async () => {
    const entity = Address.fake().anAddress()
      .withStreet('Rua das Flores')
      .withNumber('123')
      .withNeighborhood('Centro')
      .withCity('São Paulo')
      .withState('SP')
      .withZipcode('01234-567')
      .build();
    repository.items = [entity];
    const spyUpdate = jest.spyOn(repository, 'update');
    const input = new UpdateAddressInput({
      id: entity.address_id.id,
      status: AddressStatus.INACTIVE,
    });
    const output = await useCase.execute(input);
    expect(spyUpdate).toHaveBeenCalledTimes(1);
    expect(output.status).toBe('INACTIVE');
  });

  it('should update a address with primary flag', async () => {
    const entity = Address.fake().anAddress()
      .withStreet('Rua das Flores')
      .withNumber('123')
      .withNeighborhood('Centro')
      .withCity('São Paulo')
      .withState('SP')
      .withZipcode('01234-567')
      .build();
    repository.items = [entity];
    const spyUpdate = jest.spyOn(repository, 'update');
    const input = new UpdateAddressInput({
      id: entity.address_id.id,
      is_primary: true,
    });
    const output = await useCase.execute(input);
    expect(spyUpdate).toHaveBeenCalledTimes(1);
    expect(output.is_primary).toBe(true);
  });
});