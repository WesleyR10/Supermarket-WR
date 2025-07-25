import { Address } from '../../../domain/address.aggregate';
import { AddressOutputMapper } from './address-output';

describe('AddressOutputMapper Unit Tests', () => {
  it('should convert address to output', () => {
    const address = Address.fake().anAddress().build();
    const output = AddressOutputMapper.toOutput(address);

    expect(output).toStrictEqual({
      id: address.address_id.id,
      client_id: address.client_id,
      store_id: address.store_id,
      supplier_id: address.supplier_id,
      street: address.street,
      number: address.number,
      complement: address.complement,
      neighborhood: address.neighborhood,
      city: address.city,
      state: address.state,
      zipcode: address.zipcode,
      address_type: address.address_type,
      is_primary: address.is_primary,
      status: address.status,
      created_at: address.created_at,
      updated_at: address.updated_at,
      deleted_at: address.deleted_at,
    });
  });
});