import { Address, AddressType } from '../../../domain/address.aggregate';
import { AddressInMemoryRepository } from './address-in-memory.repository';
import { AddressFilter } from '../../../domain/repositories/address.repository.interface';

describe('AddressInMemoryRepository', () => {
  let repository: AddressInMemoryRepository;

  beforeEach(() => (repository = new AddressInMemoryRepository()));

  describe('applyFilter method', () => {
    it('should not filter items when filter object is null', async () => {
      const items = [
        Address.create({
          client_id: '123',
          street: 'Rua das Flores',
          number: '123',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          zipcode: '01234-567',
          address_type: AddressType.HOME,
        })
      ];
      const filterSpy = jest.spyOn(items, 'filter' as any);

      const itemsFiltered = await repository['applyFilter'](items, null);
      expect(filterSpy).not.toHaveBeenCalled();
      expect(itemsFiltered).toStrictEqual(items);
    });

    it('should filter items by client_id', async () => {
      const items = [
        Address.create({
          client_id: 'client-1',
          street: 'Rua A',
          number: '123',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          zipcode: '01234-567',
          address_type: AddressType.HOME,
        }),
        Address.create({
          client_id: 'client-2',
          street: 'Rua B',
          number: '456',
          neighborhood: 'Jardins',
          city: 'São Paulo',
          state: 'SP',
          zipcode: '01234-567',
          address_type: AddressType.WORK,
        }),
      ];

      const filter: AddressFilter = { client_id: 'client-1' };
      const itemsFiltered = await repository['applyFilter'](items, filter);
      expect(itemsFiltered).toStrictEqual([items[0]]);
    });

    it('should filter items by address_type', async () => {
      const items = [
        Address.create({
          client_id: 'client-1',
          street: 'Rua A',
          number: '123',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          zipcode: '01234-567',
          address_type: AddressType.HOME,
        }),
        Address.create({
          client_id: 'client-1',
          street: 'Rua B',
          number: '456',
          neighborhood: 'Jardins',
          city: 'São Paulo',
          state: 'SP',
          zipcode: '01234-567',
          address_type: AddressType.WORK,
        }),
      ];

      const filter: AddressFilter = { address_type: AddressType.HOME };
      const itemsFiltered = await repository['applyFilter'](items, filter);
      expect(itemsFiltered).toStrictEqual([items[0]]);
    });

    it('should filter items by city (case insensitive)', async () => {
      const items = [
        Address.create({
          client_id: 'client-1',
          street: 'Rua A',
          number: '123',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          zipcode: '01234-567',
          address_type: AddressType.HOME,
        }),
        Address.create({
          client_id: 'client-1',
          street: 'Rua B',
          number: '456',
          neighborhood: 'Centro',
          city: 'Rio de Janeiro',
          state: 'RJ',
          zipcode: '20000-000',
          address_type: AddressType.WORK,
        }),
      ];

      const filter: AddressFilter = { city: 'são paulo' };
      const itemsFiltered = await repository['applyFilter'](items, filter);
      expect(itemsFiltered).toStrictEqual([items[0]]);
    });

    it('should filter items by multiple criteria', async () => {
      const items = [
        Address.create({
          client_id: 'client-1',
          street: 'Rua A',
          number: '123',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          zipcode: '01234-567',
          address_type: AddressType.HOME,
          is_primary: true,
        }),
        Address.create({
          client_id: 'client-1',
          street: 'Rua B',
          number: '456',
          neighborhood: 'Jardins',
          city: 'São Paulo',
          state: 'SP',
          zipcode: '01234-567',
          address_type: AddressType.WORK,
          is_primary: false,
        }),
        Address.create({
          client_id: 'client-2',
          street: 'Rua C',
          number: '789',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          zipcode: '01234-567',
          address_type: AddressType.HOME,
          is_primary: true,
        }),
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
        Address.create({
          client_id: 'client-1',
          street: 'Rua A',
          number: '123',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          zipcode: '01234-567',
          address_type: AddressType.HOME,
          created_at,
        }),
        Address.create({
          client_id: 'client-1',
          street: 'Rua B',
          number: '456',
          neighborhood: 'Jardins',
          city: 'São Paulo',
          state: 'SP',
          zipcode: '01234-567',
          address_type: AddressType.WORK,
          created_at: new Date(created_at.getTime() + 100),
        }),
        Address.create({
          client_id: 'client-1',
          street: 'Rua C',
          number: '789',
          neighborhood: 'Vila Madalena',
          city: 'São Paulo',
          state: 'SP',
          zipcode: '01234-567',
          address_type: AddressType.DELIVERY,
          created_at: new Date(created_at.getTime() + 200),
        }),
      ];

      const itemsSorted = repository['applySort'](items, null, null);
      expect(itemsSorted).toStrictEqual([items[2], items[1], items[0]]);
    });

    it('should sort by street', async () => {
      const items = [
        Address.create({
          client_id: 'client-1',
          street: 'Rua C',
          number: '123',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          zipcode: '01234-567',
          address_type: AddressType.HOME,
        }),
        Address.create({
          client_id: 'client-1',
          street: 'Rua A',
          number: '456',
          neighborhood: 'Jardins',
          city: 'São Paulo',
          state: 'SP',
          zipcode: '01234-567',
          address_type: AddressType.WORK,
        }),
        Address.create({
          client_id: 'client-1',
          street: 'Rua B',
          number: '789',
          neighborhood: 'Vila Madalena',
          city: 'São Paulo',
          state: 'SP',
          zipcode: '01234-567',
          address_type: AddressType.DELIVERY,
        }),
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
        Address.create({
          client_id: 'client-1',
          street: 'Rua A',
          number: '123',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          zipcode: '01234-567',
          address_type: AddressType.HOME,
          is_primary: true,
        }),
        Address.create({
          client_id: 'client-1',
          street: 'Rua B',
          number: '456',
          neighborhood: 'Jardins',
          city: 'São Paulo',
          state: 'SP',
          zipcode: '01234-567',
          address_type: AddressType.WORK,
          is_primary: false,
        }),
        Address.create({
          store_id: 'store-1',
          street: 'Av. Paulista',
          number: '1000',
          neighborhood: 'Bela Vista',
          city: 'São Paulo',
          state: 'SP',
          zipcode: '01310-100',
          address_type: AddressType.HEADQUARTERS,
          is_primary: true,
        }),
        Address.create({
          client_id: 'client-2',
          street: 'Rua C',
          number: '789',
          neighborhood: 'Copacabana',
          city: 'Rio de Janeiro',
          state: 'RJ',
          zipcode: '22000-000',
          address_type: AddressType.DELIVERY,
          is_primary: true,
        }),
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
});