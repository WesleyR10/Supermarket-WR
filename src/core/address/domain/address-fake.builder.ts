import { Chance } from 'chance';
import { Address, AddressId, AddressType, AddressStatus } from './address.aggregate';

type PropOrFactory<T> = T | ((index: number) => T);

export class AddressFakeBuilder<TBuild = any> {
  private _address_id: PropOrFactory<AddressId> | undefined = undefined;
  private _client_id: PropOrFactory<string | null> = (_index) => null;
  private _store_id: PropOrFactory<string | null> = (_index) => null;
  private _supplier_id: PropOrFactory<string | null> = (_index) => null;
  private _street: PropOrFactory<string> = (_index) => this.chance.address();
  private _number: PropOrFactory<string> = (_index) => this.chance.integer({ min: 1, max: 9999 }).toString();
  private _complement: PropOrFactory<string | null> = (_index) => 
    this.chance.bool({ likelihood: 30 }) ? `Apto ${this.chance.integer({ min: 1, max: 999 })}` : null;
  private _neighborhood: PropOrFactory<string> = (_index) => this.chance.city();
  private _city: PropOrFactory<string> = (_index) => this.chance.city();
  private _state: PropOrFactory<string> = (_index) => this.chance.state({ territories: true }).substring(0, 2).toUpperCase();
  private _zipcode: PropOrFactory<string> = (_index) => this.chance.zip();
  private _address_type: PropOrFactory<AddressType> = (_index) => 
    this.chance.pickone(Object.values(AddressType));
  private _is_primary: PropOrFactory<boolean> = (_index) => this.chance.bool({ likelihood: 20 });
  private _status: PropOrFactory<AddressStatus> = (_index) => AddressStatus.ACTIVE;
  private _created_at: PropOrFactory<Date> = (_index) => new Date();
  private _updated_at: PropOrFactory<Date> = (_index) => new Date();
  private _deleted_at: PropOrFactory<Date | null> = (_index) => null;

  private countObjs;
  private chance: Chance.Chance;

  static anAddress() {
    return new AddressFakeBuilder<Address>();
  }

  static theAddresses(countObjs: number) {
    return new AddressFakeBuilder<Address[]>(countObjs);
  }

  private constructor(countObjs: number = 1) {
    this.countObjs = countObjs;
    this.chance = Chance();
  }

  withAddressId(valueOrFactory: PropOrFactory<AddressId>) {
    this._address_id = valueOrFactory;
    return this;
  }

  withClientId(valueOrFactory: PropOrFactory<string | null>) {
    this._client_id = valueOrFactory;
    return this;
  }

  withStoreId(valueOrFactory: PropOrFactory<string | null>) {
    this._store_id = valueOrFactory;
    return this;
  }

  withSupplierId(valueOrFactory: PropOrFactory<string | null>) {
    this._supplier_id = valueOrFactory;
    return this;
  }

  withStreet(valueOrFactory: PropOrFactory<string>) {
    this._street = valueOrFactory;
    return this;
  }

  withNumber(valueOrFactory: PropOrFactory<string>) {
    this._number = valueOrFactory;
    return this;
  }

  withComplement(valueOrFactory: PropOrFactory<string | null>) {
    this._complement = valueOrFactory;
    return this;
  }

  withNeighborhood(valueOrFactory: PropOrFactory<string>) {
    this._neighborhood = valueOrFactory;
    return this;
  }

  withCity(valueOrFactory: PropOrFactory<string>) {
    this._city = valueOrFactory;
    return this;
  }

  withState(valueOrFactory: PropOrFactory<string>) {
    this._state = valueOrFactory;
    return this;
  }

  withZipcode(valueOrFactory: PropOrFactory<string>) {
    this._zipcode = valueOrFactory;
    return this;
  }

  withAddressType(valueOrFactory: PropOrFactory<AddressType>) {
    this._address_type = valueOrFactory;
    return this;
  }

  withIsPrimary(valueOrFactory: PropOrFactory<boolean>) {
    this._is_primary = valueOrFactory;
    return this;
  }

  withStatus(valueOrFactory: PropOrFactory<AddressStatus>) {
    this._status = valueOrFactory;
    return this;
  }

  withCreatedAt(valueOrFactory: PropOrFactory<Date>) {
    this._created_at = valueOrFactory;
    return this;
  }

  withUpdatedAt(valueOrFactory: PropOrFactory<Date>) {
    this._updated_at = valueOrFactory;
    return this;
  }

  withDeletedAt(valueOrFactory: PropOrFactory<Date | null>) {
    this._deleted_at = valueOrFactory;
    return this;
  }

  withInvalidStreetTooLong(value?: string) {
    this._street = value ?? this.chance.word({ length: 201 });
    return this;
  }

  withInvalidZipcode(value?: string) {
    this._zipcode = value ?? 'invalid-zipcode';
    return this;
  }

  withInvalidState(value?: string) {
    this._state = value ?? 'INVALID';
    return this;
  }

  build(): TBuild {
    const addresses = new Array(this.countObjs).fill(undefined).map((_, index) => {
      const address = new Address({
        address_id: !this._address_id ? undefined : this.callFactory(this._address_id, index),
        client_id: this.callFactory(this._client_id, index),
        store_id: this.callFactory(this._store_id, index),
        supplier_id: this.callFactory(this._supplier_id, index),
        street: this.callFactory(this._street, index),
        number: this.callFactory(this._number, index),
        complement: this.callFactory(this._complement, index),
        neighborhood: this.callFactory(this._neighborhood, index),
        city: this.callFactory(this._city, index),
        state: this.callFactory(this._state, index),
        zipcode: this.callFactory(this._zipcode, index),
        address_type: this.callFactory(this._address_type, index),
        is_primary: this.callFactory(this._is_primary, index),
        status: this.callFactory(this._status, index),
        created_at: this.callFactory(this._created_at, index),
        updated_at: this.callFactory(this._updated_at, index),
        deleted_at: this.callFactory(this._deleted_at, index),
      });
      return address;
    });
    return this.countObjs === 1 ? (addresses[0] as any) : addresses as TBuild;
  }

  get address_id() {
    return this.getValue('address_id');
  }

  get client_id() {
    return this.getValue('client_id');
  }

  get store_id() {
    return this.getValue('store_id');
  }

  get supplier_id() {
    return this.getValue('supplier_id');
  }

  get street() {
    return this.getValue('street');
  }

  get number() {
    return this.getValue('number');
  }

  get complement() {
    return this.getValue('complement');
  }

  get neighborhood() {
    return this.getValue('neighborhood');
  }

  get city() {
    return this.getValue('city');
  }

  get state() {
    return this.getValue('state');
  }

  get zipcode() {
    return this.getValue('zipcode');
  }

  get address_type() {
    return this.getValue('address_type');
  }

  get is_primary() {
    return this.getValue('is_primary');
  }

  get status() {
    return this.getValue('status');
  }

  get created_at() {
    return this.getValue('created_at');
  }

  get updated_at() {
    return this.getValue('updated_at');
  }

  get deleted_at() {
    return this.getValue('deleted_at');
  }

  private getValue(prop: any) {
    const optional = ['address_id', 'created_at'];
    const privateProp = `_${prop}` as keyof this;
    if (!this[privateProp] && optional.includes(prop)) {
      throw new Error(`Property ${prop} not have a factory, use 'with' methods`);
    }
    return this.callFactory(this[privateProp], 0);
  }

  private callFactory(factoryOrValue: PropOrFactory<any>, index: number) {
    return typeof factoryOrValue === 'function'
      ? factoryOrValue(index)
      : factoryOrValue;
  }
}