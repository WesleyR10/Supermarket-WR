import { Chance } from 'chance';
import { DeliveryAddress } from '../online-order.aggregate';

type PropOrFactory<T> = T | ((index: number) => T);

export class DeliveryAddressFakeBuilder<TBuild = any> {
  private _street: PropOrFactory<string> = (_index) => this.chance.street();
  private _number: PropOrFactory<string> = (_index) => this.chance.integer({ min: 1, max: 9999 }).toString();
  private _neighborhood: PropOrFactory<string> = (_index) => this.chance.word();
  private _city: PropOrFactory<string> = (_index) => this.chance.city();
  private _state: PropOrFactory<string> = (_index) => this.chance.state({ full: false });
  private _zip_code: PropOrFactory<string> = (_index) => this.chance.zip();
  private _complement: PropOrFactory<string | undefined> = (_index) => undefined;

  private countObjs: number;
  private chance: Chance.Chance;

  static aDeliveryAddress() {
    return new DeliveryAddressFakeBuilder<DeliveryAddress>();
  }

  static theDeliveryAddresses(countObjs: number) {
    return new DeliveryAddressFakeBuilder<DeliveryAddress[]>(countObjs);
  }

  private constructor(countObjs: number = 1) {
    this.countObjs = countObjs;
    this.chance = Chance();
  }

  withStreet(valueOrFactory: PropOrFactory<string>) {
    this._street = valueOrFactory;
    return this;
  }

  withNumber(valueOrFactory: PropOrFactory<string>) {
    this._number = valueOrFactory;
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

  withZipCode(valueOrFactory: PropOrFactory<string>) {
    this._zip_code = valueOrFactory;
    return this;
  }

  withComplement(valueOrFactory: PropOrFactory<string | undefined>) {
    this._complement = valueOrFactory;
    return this;
  }

  build(): TBuild {
    const addresses = new Array(this.countObjs)
      .fill(undefined)
      .map((_, index) => {
        return DeliveryAddress.create({
          street: this.callFactory(this._street, index),
          number: this.callFactory(this._number, index),
          neighborhood: this.callFactory(this._neighborhood, index),
          city: this.callFactory(this._city, index),
          state: this.callFactory(this._state, index),
          zip_code: this.callFactory(this._zip_code, index),
          complement: this.callFactory(this._complement, index)
        });
      });
    return (this.countObjs === 1 ? addresses[0] : addresses) as TBuild;
  }

  private callFactory(factoryOrValue: PropOrFactory<any>, index: number) {
    return typeof factoryOrValue === 'function' ? factoryOrValue(index) : factoryOrValue;
  }
}