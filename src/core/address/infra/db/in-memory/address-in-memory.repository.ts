import { InMemorySearchableRepository } from '../../../../shared/infra/db/in-memory/in-memory.repository';
import { Address, AddressId, AddressType, AddressStatus } from '../../../domain/address.aggregate';
import {
  IAddressRepository,
  AddressFilter,
  AddressSearchParams,
  AddressSearchResult,
} from '../../../domain/repositories/address.repository.interface';

export class AddressInMemoryRepository
  extends InMemorySearchableRepository<
    Address,
    AddressId,
    AddressFilter,
    AddressSearchParams,
    AddressSearchResult
  >
  implements IAddressRepository
{
  sortableFields: string[] = [
    'street',
    'city',
    'state',
    'zipcode',
    'created_at',
    'updated_at',
    'address_type',
    'is_primary'
  ];

  // Métodos específicos do domínio Address
  async findByClientId(clientId: string): Promise<Address[]> {
    return this.items.filter(item => item.client_id === clientId);
  }

  async findByStoreId(storeId: string): Promise<Address[]> {
    return this.items.filter(item => item.store_id === storeId);
  }

  async findBySupplier(supplierId: string): Promise<Address[]> {
    return this.items.filter(item => item.supplier_id === supplierId);
  }

  async findPrimaryAddress(
    entityId: string,
    entityType: 'client' | 'store' | 'supplier'
  ): Promise<Address | null> {
    const item = this.items.find(item => {
      const matchesEntity = 
        (entityType === 'client' && item.client_id === entityId) ||
        (entityType === 'store' && item.store_id === entityId) ||
        (entityType === 'supplier' && item.supplier_id === entityId);
      return matchesEntity && item.is_primary;
    });
    return item || null;
  }

  async findByAddressType(addressType: AddressType): Promise<Address[]> {
    return this.items.filter(item => item.address_type === addressType);
  }

  async findActiveAddresses(): Promise<Address[]> {
    return this.items.filter(item => item.isActive());
  }

  async findDeliveryAddresses(): Promise<Address[]> {
    return this.items.filter(item => item.canReceiveDelivery());
  }

  async findByZipcode(zipcode: string): Promise<Address[]> {
    return this.items.filter(item => item.zipcode === zipcode);
  }

  async findByCity(city: string): Promise<Address[]> {
    return this.items.filter(item => 
      item.city.toLowerCase().includes(city.toLowerCase())
    );
  }

  async findByState(state: string): Promise<Address[]> {
    return this.items.filter(item => item.state === state.toUpperCase());
  }

  protected async applyFilter(
    items: Address[],
    filter: AddressFilter | null,
  ): Promise<Address[]> {
    if (!filter) {
      return items;
    }

    return items.filter((item) => {
      // Filtro por client_id
      if (filter.client_id && item.client_id !== filter.client_id) {
        return false;
      }

      // Filtro por store_id
      if (filter.store_id && item.store_id !== filter.store_id) {
        return false;
      }

      // Filtro por supplier_id
      if (filter.supplier_id && item.supplier_id !== filter.supplier_id) {
        return false;
      }

      // Filtro por address_type
      if (filter.address_type && item.address_type !== filter.address_type) {
        return false;
      }

      // Filtro por status
      if (filter.status && item.status !== filter.status) {
        return false;
      }

      // Filtro por is_primary
      if (filter.is_primary !== undefined && item.is_primary !== filter.is_primary) {
        return false;
      }

      // Filtro por cidade (busca parcial, case insensitive)
      if (filter.city && !item.city.toLowerCase().includes(filter.city.toLowerCase())) {
        return false;
      }

      // Filtro por estado
      if (filter.state && item.state !== filter.state.toUpperCase()) {
        return false;
      }

      // Filtro por CEP
      if (filter.zipcode && item.zipcode !== filter.zipcode) {
        return false;
      }

      return true;
    });
  }

  getEntity(): new (...args: any[]) => Address {
    return Address;
  }

  protected applySort(
    items: Address[],
    sort: string | null,
    sort_dir: string | null,
  ): Address[] {
    if (!sort || !this.sortableFields.includes(sort)) {
      return super.applySort(items, 'created_at', 'desc');
    }

    return super.applySort(items, sort, sort_dir as any);
  }

  // Novos métodos para suportar a regra de negócio
  async findActiveAddressesByClientId(clientId: string): Promise<Address[]> {
    return this.items.filter(item => 
      item.client_id === clientId && item.isActive()
    );
  }

  async findPrimaryAddressByClientId(clientId: string): Promise<Address | null> {
    const address = this.items.find(item => 
      item.client_id === clientId && item.is_primary && item.isActive()
    );
    return address || null;
  }

  async changePrimaryAddress(clientId: string, newPrimaryAddressId: string): Promise<void> {
    const addresses = await this.findActiveAddressesByClientId(clientId);
    Address.changePrimaryAddress(addresses, clientId, newPrimaryAddressId);
  }

  // Override do método insert para validar a regra de negócio
  async insert(entity: Address): Promise<void> {
    if (entity.client_id && entity.is_primary) {
      const clientAddresses = await this.findActiveAddressesByClientId(entity.client_id);
      Address.validateSinglePrimaryAddress(clientAddresses, entity.client_id, entity.is_primary);
    }
    await super.insert(entity);
  }

  // Override do método update para validar a regra de negócio
  async update(entity: Address): Promise<void> {
    if (entity.client_id && entity.is_primary) {
      const clientAddresses = await this.findActiveAddressesByClientId(entity.client_id);
      // Remove o endereço atual da lista para não conflitar consigo mesmo
      const otherAddresses = clientAddresses.filter(addr => addr.address_id.id !== entity.address_id.id);
      Address.validateSinglePrimaryAddress(otherAddresses, entity.client_id, entity.is_primary);
    }
    await super.update(entity);
  }
}