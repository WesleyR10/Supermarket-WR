import { AddressType } from '@core/address/domain/address.aggregate';
import { AddressInMemoryRepository } from '../../../../infra/db/in-memory/address-in-memory.repository';
import { CreateAddressUseCase } from '../create-address.use-case';

describe('CreateAddressUseCase Unit Tests', () => {
  let useCase: CreateAddressUseCase;
  let repository: AddressInMemoryRepository;

  beforeEach(() => {
    repository = new AddressInMemoryRepository();
    useCase = new CreateAddressUseCase(repository);
  });

  it('should throw an error when aggregate is not valid', async () => {
    const input = { 
      client_id: 'client-123',
      street: 'Rua', // muito curto (mínimo 5 caracteres)
      zipcode: '12345-678'
    };
    await expect(() => useCase.execute({
      ...input,
      number: '123',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      address_type: 'HOME' as AddressType
    })).rejects.toThrowError(
      'Entity Validation Error',
    );
  });

  it('should create an address', async () => {
    const spyInsert = jest.spyOn(repository, 'insert');
    let output = await useCase.execute({
      client_id: 'client-123',
      street: 'Rua das Flores', // ✅ mínimo 5 caracteres
      number: '123',            // ✅ obrigatório
      neighborhood: 'Centro',   // ✅ mínimo 3 caracteres
      city: 'São Paulo',        // ✅ mínimo 2 caracteres
      state: 'SP',              // ✅ exatamente 2 caracteres maiúsculos
      zipcode: '01234-567',     // ✅ formato correto
      address_type: 'HOME' as AddressType
    });
    expect(spyInsert).toHaveBeenCalledTimes(1);
    expect(output).toStrictEqual({
      id: repository.items[0].address_id.id,
      client_id: 'client-123',
      store_id: null,
      supplier_id: null,
      street: 'Rua das Flores',
      number: '123',
      complement: null,
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipcode: '01234-567',
      address_type: 'HOME',
      is_primary: false,
      status: 'ACTIVE',
      created_at: repository.items[0].created_at,
      updated_at: repository.items[0].updated_at,
      deleted_at: null,
    });

    output = await useCase.execute({
      supplier_id: 'supplier-456',
      street: 'Avenida Comercial',
      number: '456',
      neighborhood: 'Industrial',
      city: 'Santos',
      state: 'SP',
      zipcode: '98765-432',
      address_type: 'HEADQUARTERS' as AddressType,
      is_primary: true
    });
    expect(spyInsert).toHaveBeenCalledTimes(2);
    expect(output).toStrictEqual({
      id: repository.items[1].address_id.id,
      client_id: null,
      store_id: null,
      supplier_id: 'supplier-456',
      street: 'Avenida Comercial',
      number: '456',
      complement: null,
      neighborhood: 'Industrial',
      city: 'Santos',
      state: 'SP',
      zipcode: '98765-432',
      address_type: 'HEADQUARTERS',
      is_primary: true,
      status: 'ACTIVE',
      created_at: repository.items[1].created_at,
      updated_at: repository.items[1].updated_at,
      deleted_at: null,
    });
  });
});