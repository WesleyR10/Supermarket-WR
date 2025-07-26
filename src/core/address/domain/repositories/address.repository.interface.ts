import { ISearchableRepository } from '../../../shared/domain/repository/repository-interface';
import { SearchParams, SearchParamsConstructorProps } from '../../../shared/domain/repository/search-params';
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

export class AddressSearchParams extends SearchParams<AddressFilter> {
  static create(props: SearchParamsConstructorProps<AddressFilter> = {}): AddressSearchParams {
    return new AddressSearchParams(props);
  }

  get filter(): AddressFilter | null {
    return this._filter;
  }

  protected set filter(value: AddressFilter | null) {
    const _value =
      !value || (value as unknown) === '' || typeof value !== 'object'
        ? null
        : value;

    const filter = {
      ...(_value && _value.client_id && { client_id: `${_value.client_id}` }),
      ...(_value && _value.store_id && { store_id: `${_value.store_id}` }),
      ...(_value && _value.supplier_id && { supplier_id: `${_value.supplier_id}` }),
      ...(_value && _value.address_type && { address_type: _value.address_type }),
      ...(_value && _value.status && { status: _value.status }),
      ...(_value && _value.is_primary !== undefined && { is_primary: _value.is_primary }),
      ...(_value && _value.city && { city: `${_value.city}` }),
      ...(_value && _value.state && { state: `${_value.state}` }),
      ...(_value && _value.zipcode && { zipcode: `${_value.zipcode}` }),
    };

    this._filter = Object.keys(filter).length === 0 ? null : filter;
  }
}

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