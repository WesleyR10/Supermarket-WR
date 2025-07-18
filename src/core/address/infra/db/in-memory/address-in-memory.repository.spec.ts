import { Address, AddressType } from '../../../domain/address.aggregate';
import { AddressInMemoryRepository } from './address-in-memory.repository';
import { AddressFilter } from '../../../domain/repositories/address.repository.interface';

describe('AddressInMemoryRepository', () => {
  let repository: AddressInMemoryRepository;

  beforeEach(() => (repository = new AddressInMemoryRepository()));

  describe('applyFilter method', () => {
    it('should not filter items when filter object is null', async () => {
      const items = [
        Address.fake().anAddress().withClientId('123').build()
      ];
      const filterSpy = jest.spyOn(items, 'filter' as any);

      const itemsFiltered = await repository['applyFilter'](items, null);
      expect(filterSpy).not.toHaveBeenCalled();
      expect(itemsFiltered).toStrictEqual(items);
    });

    it('should filter items by client_id', async () => {
      const items = [
        Address.fake().anAddress().withClientId('client-1').withStreet('Rua A').withAddressType(AddressType.HOME).build(),
        Address.fake().anAddress().withClientId('client-2').withStreet('Rua B').withAddressType(AddressType.WORK).build(),
      ];

      const filter: AddressFilter = { client_id: 'client-1' };
      const itemsFiltered = await repository['applyFilter'](items, filter);
      expect(itemsFiltered).toStrictEqual([items[0]]);
    });

    it('should filter items by address_type', async () => {
      const items = [
        Address.fake().anAddress().withClientId('client-1').withStreet('Rua A').withAddressType(AddressType.HOME).build(),
        Address.fake().anAddress().withClientId('client-1').withStreet('Rua B').withAddressType(AddressType.WORK).build(),
      ];

      const filter: AddressFilter = { address_type: AddressType.HOME };
      const itemsFiltered = await repository['applyFilter'](items, filter);
      expect(itemsFiltered).toStrictEqual([items[0]]);
    });

    it('should filter items by city (case insensitive)', async () => {
      const items = [
        Address.fake().anAddress().withClientId('client-1').withCity('São Paulo').build(),
        Address.fake().anAddress().withClientId('client-1').withCity('Rio de Janeiro').withState('RJ').build(),
      ];

      const filter: AddressFilter = { city: 'são paulo' };
      const itemsFiltered = await repository['applyFilter'](items, filter);
      expect(itemsFiltered).toStrictEqual([items[0]]);
    });

    it('should filter items by multiple criteria', async () => {
      const items = [
        Address.fake().anAddress()
          .withClientId('client-1')
          .withAddressType(AddressType.HOME)
          .withIsPrimary(true)
          .build(),
        Address.fake().anAddress()
          .withClientId('client-1')
          .withAddressType(AddressType.WORK)
          .withIsPrimary(false)
          .build(),
        Address.fake().anAddress()
          .withClientId('client-2')
          .withAddressType(AddressType.HOME)
          .withIsPrimary(true)
          .build(),
      ];

      const filter: AddressFilter = {
        client_id: 'client-1',
        address_type: AddressType.HOME,
        is_primary: true,
      };
      const itemsFiltered = await repository['applyFilter'](items, filter);
      expect(itemsFiltered).toStrictEqual([items[0]]);
    });
  });

  describe('applySort method', () => {
    it('should sort by created_at DESC when sort param is null', async () => {
      const created_at = new Date();
      const items = [
        Address.fake().anAddress()
          .withClientId('client-1')
          .withStreet('Rua A')
          .withAddressType(AddressType.HOME)
          .withCreatedAt(created_at)
          .build(),
        Address.fake().anAddress()
          .withClientId('client-1')
          .withStreet('Rua B')
          .withAddressType(AddressType.WORK)
          .withCreatedAt(new Date(created_at.getTime() + 100))
          .build(),
        Address.fake().anAddress()
          .withClientId('client-1')
          .withStreet('Rua C')
          .withAddressType(AddressType.DELIVERY)
          .withCreatedAt(new Date(created_at.getTime() + 200))
          .build(),
      ];

      const itemsSorted = repository['applySort'](items, null, null);
      expect(itemsSorted).toStrictEqual([items[2], items[1], items[0]]);
    });

    it('should sort by street', async () => {
      const items = [
        Address.fake().anAddress().withStreet('Rua C').withAddressType(AddressType.HOME).build(),
        Address.fake().anAddress().withStreet('Rua A').withAddressType(AddressType.WORK).build(),
        Address.fake().anAddress().withStreet('Rua B').withAddressType(AddressType.DELIVERY).build(),
      ];

      let itemsSorted = repository['applySort'](items, 'street', 'asc');
      expect(itemsSorted).toStrictEqual([items[1], items[2], items[0]]);

      itemsSorted = repository['applySort'](items, 'street', 'desc');
      expect(itemsSorted).toStrictEqual([items[0], items[2], items[1]]);
    });
  });

  describe('domain specific methods', () => {
    beforeEach(() => {
      const addresses = [
        Address.fake().anAddress()
          .withClientId('client-1')
          .withStreet('Rua A')
          .withCity('São Paulo')
          .withState('SP')
          .withAddressType(AddressType.HOME)
          .withIsPrimary(true)
          .build(),
        Address.fake().anAddress()
          .withClientId('client-1')
          .withStreet('Rua B')
          .withCity('São Paulo')
          .withState('SP')
          .withAddressType(AddressType.WORK)
          .withIsPrimary(false)
          .build(),
        Address.fake().anAddress()
          .withStoreId('store-1')
          .withStreet('Av. Paulista')
          .withNumber('1000')
          .withNeighborhood('Bela Vista')
          .withCity('São Paulo')
          .withState('SP')
          .withZipcode('01310-100')
          .withAddressType(AddressType.HEADQUARTERS)
          .withIsPrimary(true)
          .build(),
        Address.fake().anAddress()
          .withClientId('client-2')
          .withStreet('Rua C')
          .withCity('Rio de Janeiro')
          .withState('RJ')
          .withZipcode('22000-000')
          .withAddressType(AddressType.DELIVERY)
          .withIsPrimary(true)
          .build(),
      ];
      repository.items = addresses;
    });

    it('should find addresses by client_id', async () => {
      const addresses = await repository.findByClientId('client-1');
      expect(addresses).toHaveLength(2);
      expect(addresses.every(addr => addr.client_id === 'client-1')).toBe(true);
    });

    it('should find addresses by store_id', async () => {
      const addresses = await repository.findByStoreId('store-1');
      expect(addresses).toHaveLength(1);
      expect(addresses[0].store_id).toBe('store-1');
    });

    it('should find primary address for client', async () => {
      const primaryAddress = await repository.findPrimaryAddress('client-1', 'client');
      expect(primaryAddress).not.toBeNull();
      expect(primaryAddress!.client_id).toBe('client-1');
      expect(primaryAddress!.is_primary).toBe(true);
    });

    it('should find addresses by address type', async () => {
      const homeAddresses = await repository.findByAddressType(AddressType.HOME);
      expect(homeAddresses).toHaveLength(1);
      expect(homeAddresses[0].address_type).toBe(AddressType.HOME);
    });

    it('should find delivery addresses', async () => {
      const deliveryAddresses = await repository.findDeliveryAddresses();
      expect(deliveryAddresses.length).toBeGreaterThan(0);
      expect(deliveryAddresses.every(addr => addr.canReceiveDelivery())).toBe(true);
    });

    it('should find addresses by city', async () => {
      const spAddresses = await repository.findByCity('São Paulo');
      expect(spAddresses).toHaveLength(3);
      expect(spAddresses.every(addr => addr.city === 'São Paulo')).toBe(true);
    });

    it('should find addresses by state', async () => {
      const spAddresses = await repository.findByState('SP');
      expect(spAddresses).toHaveLength(3);
      expect(spAddresses.every(addr => addr.state === 'SP')).toBe(true);
    });
  });

  describe('Address business rules', () => {
  describe('Single primary address rule', () => {
    it('should allow creating primary address when client has no primary address', () => {
      const addresses = [
        Address.fake().anAddress().withClientId('client-1').withIsPrimary(false).build()
      ];
      
      expect(() => {
        Address.validateSinglePrimaryAddress(addresses, 'client-1', true);
      }).not.toThrow();
    });

    it('should throw error when trying to create second primary address for same client', () => {
      const addresses = [
        Address.fake().anAddress().withClientId('client-1').withIsPrimary(true).build()
      ];
      
      expect(() => {
        Address.validateSinglePrimaryAddress(addresses, 'client-1', true);
      }).toThrow('Cliente client-1 já possui um endereço primário');
    });

    it('should allow changing primary address', () => {
      const address1 = Address.fake().anAddress().withClientId('client-1').withIsPrimary(true).build();
      const address2 = Address.fake().anAddress().withClientId('client-1').withIsPrimary(false).build();
      const addresses = [address1, address2];
      
      Address.changePrimaryAddress(addresses, 'client-1', address2.address_id.id);
      
      expect(address1.is_primary).toBe(false);
      expect(address2.is_primary).toBe(true);
    });
  });
});
});