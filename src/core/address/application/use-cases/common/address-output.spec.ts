import { Address, AddressType, AddressStatus } from '../../../domain/address.aggregate';
import { AddressOutputMapper } from './address-output';

describe('AddressOutputMapper Unit Tests', () => {
  it('should convert an address in output', () => {
    const entity = Address.create({
      client_id: '123e4567-e89b-12d3-a456-426614174000',
      street: 'Rua das Flores',
      number: '123',
      complement: 'Apto 45',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipcode: '01234-567',
      address_type: AddressType.HOME,
      is_primary: true,
    });
    
    const spyToJSON = jest.spyOn(entity, 'toJSON');
    const output = AddressOutputMapper.toOutput(entity);
    
    expect(spyToJSON).toHaveBeenCalled();
    expect(output).toStrictEqual({
      id: entity.address_id.id,
      client_id: '123e4567-e89b-12d3-a456-426614174000',
      store_id: null,
      supplier_id: null,
      street: 'Rua das Flores',
      number: '123',
      complement: 'Apto 45',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipcode: '01234-567',
      address_type: 'HOME',
      is_primary: true,
      status: 'ACTIVE',
      created_at: entity.created_at,
      updated_at: entity.updated_at,
      deleted_at: null,
    });
  });
}); 