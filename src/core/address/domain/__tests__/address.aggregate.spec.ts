import { Address, AddressId, AddressType, AddressStatus } from '../address.aggregate';

describe('Address Aggregate Unit Tests', () => {
  describe('constructor', () => {
    test('should create address with default values', () => {
      const address = new Address({
        street: 'Rua das Flores',
        number: '123',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zipcode: '01234-567',
        address_type: AddressType.HOME,
      });

      expect(address.address_id).toBeInstanceOf(AddressId);
      expect(address.street).toBe('Rua das Flores');
      expect(address.number).toBe('123');
      expect(address.neighborhood).toBe('Centro');
      expect(address.city).toBe('São Paulo');
      expect(address.state).toBe('SP');
      expect(address.zipcode).toBe('01234-567');
      expect(address.address_type).toBe(AddressType.HOME);
      expect(address.is_primary).toBe(false);
      expect(address.status).toBe(AddressStatus.ACTIVE);
      expect(address.client_id).toBeNull();
      expect(address.store_id).toBeNull();
      expect(address.supplier_id).toBeNull();
      expect(address.complement).toBeNull();
      expect(address.deleted_at).toBeNull();
    });
  });

  describe('create command', () => {
    test('should create address with validation', () => {
      const address = Address.create({
        street: 'Rua das Flores',
        number: '123',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zipcode: '01234-567',
        address_type: AddressType.HOME,
      });

      expect(address).toBeInstanceOf(Address);
      expect(address.street).toBe('Rua das Flores');
    });
  });

  describe('business methods', () => {
    let address: Address;

    beforeEach(() => {
      address = new Address({
        street: 'Rua das Flores',
        number: '123',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zipcode: '01234-567',
        address_type: AddressType.HOME,
      });
    });

    test('should activate address', () => {
      address.deactivate();
      address.activate();
      expect(address.status).toBe(AddressStatus.ACTIVE);
      expect(address.isActive()).toBe(true);
    });

    test('should deactivate address', () => {
      address.deactivate();
      expect(address.status).toBe(AddressStatus.INACTIVE);
      expect(address.isActive()).toBe(false);
    });

    test('should mark as deleted', () => {
      address.markAsDeleted();
      expect(address.status).toBe(AddressStatus.DELETED);
      expect(address.isDeleted()).toBe(true);
      expect(address.deleted_at).toBeInstanceOf(Date);
    });

    test('should set as primary', () => {
      address.setAsPrimary();
      expect(address.is_primary).toBe(true);
      expect(address.isPrimary()).toBe(true);
    });

    test('should unset as primary', () => {
      address.setAsPrimary();
      address.unsetAsPrimary();
      expect(address.is_primary).toBe(false);
      expect(address.isPrimary()).toBe(false);
    });

    test('should update address', () => {
      const oldUpdatedAt = address.updated_at;
      address.updateAddress({
        street: 'Nova Rua',
        number: '456',
      });
      expect(address.street).toBe('Nova Rua');
      expect(address.number).toBe('456');
      expect(address.updated_at).not.toBe(oldUpdatedAt);
    });

    test('should get full address', () => {
      const fullAddress = address.getFullAddress();
      expect(fullAddress).toBe('Rua das Flores, 123, Centro, São Paulo - SP, 01234-567');
    });

    test('should check if can receive delivery', () => {
      expect(address.canReceiveDelivery()).toBe(true);
      
      address.deactivate();
      expect(address.canReceiveDelivery()).toBe(false);
    });
  });

  describe('business rules', () => {
    test('should validate single primary address', () => {
      const address1 = Address.fake().anAddress().withClientId('client-1').withIsPrimary(true).build();
      const address2 = Address.fake().anAddress().withClientId('client-1').withIsPrimary(false).build();
      
      expect(() => {
        Address.validateSinglePrimaryAddress([address1], 'client-1', true);
      }).toThrow('Cliente client-1 já possui um endereço primário');
    });

    test('should change primary address', () => {
      const address1 = Address.fake().anAddress().withClientId('client-1').withIsPrimary(true).build();
      const address2 = Address.fake().anAddress().withClientId('client-1').withIsPrimary(false).build();
      
      Address.changePrimaryAddress([address1, address2], 'client-1', address2.address_id.id);
      
      expect(address1.is_primary).toBe(false);
      expect(address2.is_primary).toBe(true);
    });
  });

  describe('fake builder', () => {
    test('should create address using fake builder', () => {
      const address = Address.fake().anAddress().build();
      expect(address).toBeInstanceOf(Address);
    });
  });
});