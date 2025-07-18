import { ISearchableRepository } from '../../../shared/domain/repository/repository-interface';
import { SearchParams } from '../../../shared/domain/repository/search-params';
import { SearchResult } from '../../../shared/domain/repository/search-result';
import { Address, AddressId, AddressType, AddressStatus } from '../address.aggregate';

export type AddressFilter = {
  client_id?: string;
  store_id?: string;
  supplier_id?: string;
  address_type?: AddressType;
  status?: AddressStatus;
  is_primary?: boolean;
  city?: string;
  state?: string;
  zipcode?: string;
};

export class AddressSearchParams extends SearchParams<AddressFilter> {}

export class AddressSearchResult extends SearchResult<Address> {}

export interface IAddressRepository
  extends ISearchableRepository<
    Address,
    AddressId,
    AddressFilter,
    AddressSearchParams,
    AddressSearchResult
  > {
  // Métodos específicos do domínio Address
  findByClientId(clientId: string): Promise<Address[]>; // Retorna todos os endereços de um cliente
  findByStoreId(storeId: string): Promise<Address[]>; // Retorna todos os endereços de uma loja
  findBySupplier(supplierId: string): Promise<Address[]>; // Retorna todos os endereços de um fornecedor
  findPrimaryAddress(entityId: string, entityType: 'client' | 'store' | 'supplier'): Promise<Address | null>; // Retorna o endereço principal de um cliente, loja ou fornecedor
  findByAddressType(addressType: AddressType): Promise<Address[]>; // Retorna todos os endereços de um tipo específico
  findByZipcode(zipcode: string): Promise<Address[]>; // Retorna todos os endereços com um determinado CEP
  findByCity(city: string): Promise<Address[]>; // Retorna todos os endereços com um determinado município
  findByState(state: string): Promise<Address[]>; // Retorna todos os endereços com um determinado estado
  findActiveAddressesByClientId(clientId: string): Promise<Address[]>; // Retorna todos os endereços ativos de um cliente
  findPrimaryAddressByClientId(clientId: string): Promise<Address | null>; // Retorna o endereço principal de um cliente
  changePrimaryAddress(clientId: string, newPrimaryAddressId: string): Promise<void>; // Altera o endereço principal de um cliente
}