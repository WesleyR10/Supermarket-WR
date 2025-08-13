import { Chance } from 'chance';
import { Inventory, InventoryId } from './inventory.aggregate';
import { Quantity } from '../../shared/domain/value-objects/quantity.vo';
import { Location } from '../../shared/domain/value-objects/location.vo';
import { ExpiryDate } from '../../shared/domain/value-objects/expiry-date.vo';
import { Money } from '../../shared/domain/value-objects/money.vo';

type PropOrFactory<T> = T | ((index: number) => T);

export class InventoryFakeBuilder<TBuild = any> {
  // auto generated in entity
  private _inventory_item_id: PropOrFactory<InventoryId> | undefined = undefined;
  private _product_id: PropOrFactory<string> = (_index) => this.chance.guid();
  private _store_id: PropOrFactory<string> = (_index) => this.chance.guid();
  private _quantity: PropOrFactory<Quantity> = (_index) => new Quantity(this.chance.integer({ min: 0, max: 1000 }));
  private _min_stock: PropOrFactory<Quantity> = (_index) => new Quantity(this.chance.integer({ min: 10, max: 100 }));
  private _max_stock: PropOrFactory<Quantity> = (_index) => new Quantity(this.chance.integer({ min: 200, max: 5000 }));
  private _cost_price: PropOrFactory<Money> = (_index) => new Money(this.chance.floating({ min: 1, max: 100, fixed: 2 }));
  private _unit_price: PropOrFactory<Money | null> = (_index) => new Money(this.chance.floating({ min: 1, max: 200, fixed: 2 }));
  private _supplier_id: PropOrFactory<string | null> = (_index) => this.chance.guid();
  private _location: PropOrFactory<Location | null> = (_index) => this.getLocation();
  private _expiry_date: PropOrFactory<ExpiryDate | null> = (_index) => this.getExpiryDate();
  private _batch_number: PropOrFactory<string | null> = (_index) => this.getBatchNumber();
  private _is_active: PropOrFactory<boolean> = (_index) => true;
  // auto generated in entity
  private _created_at: PropOrFactory<Date> | undefined = undefined;

  private countObjs;
  private chance: Chance.Chance;

  static anInventory() {
    return new InventoryFakeBuilder<Inventory>();
  }

  static theInventories(countObjs: number) {
    return new InventoryFakeBuilder<Inventory[]>(countObjs);
  }

  private constructor(countObjs: number = 1) {
    this.countObjs = countObjs;
    this.chance = Chance();
  }

  withInventoryId(valueOrFactory: PropOrFactory<InventoryId>) {
    this._inventory_item_id = valueOrFactory;
    return this;
  }

  withProductId(valueOrFactory: PropOrFactory<string>) {
    this._product_id = valueOrFactory;
    return this;
  }

  withStoreId(valueOrFactory: PropOrFactory<string>) {
    this._store_id = valueOrFactory;
    return this;
  }

  withQuantity(valueOrFactory: PropOrFactory<number> | PropOrFactory<Quantity>) {
    if (typeof valueOrFactory === 'number') {
      this._quantity = new Quantity(valueOrFactory);
    } else if (typeof valueOrFactory === 'function') {
      this._quantity = (index) => {
        const value = valueOrFactory(index);
        return value instanceof Quantity ? value : new Quantity(value as number);
      };
    } else {
      this._quantity = valueOrFactory as PropOrFactory<Quantity>;
    }
    return this;
  }

  withMinStock(valueOrFactory: PropOrFactory<number> | PropOrFactory<Quantity>) {
    if (typeof valueOrFactory === 'number') {
      this._min_stock = new Quantity(valueOrFactory);
    } else if (typeof valueOrFactory === 'function') {
      this._min_stock = (index) => {
        const value = valueOrFactory(index);
        return value instanceof Quantity ? value : new Quantity(value as number);
      };
    } else {
      this._min_stock = valueOrFactory as PropOrFactory<Quantity>;
    }
    return this;
  }

  withMaxStock(valueOrFactory: PropOrFactory<number> | PropOrFactory<Quantity>) {
    if (typeof valueOrFactory === 'number') {
      this._max_stock = new Quantity(valueOrFactory);
    } else if (typeof valueOrFactory === 'function') {
      this._max_stock = (index) => {
        const value = valueOrFactory(index);
        return value instanceof Quantity ? value : new Quantity(value as number);
      };
    } else {
      this._max_stock = valueOrFactory as PropOrFactory<Quantity>;
    }
    return this;
  }

  withCostPrice(valueOrFactory: PropOrFactory<number> | PropOrFactory<Money>) {
    if (typeof valueOrFactory === 'number') {
      this._cost_price = new Money(valueOrFactory);
    } else if (typeof valueOrFactory === 'function') {
      this._cost_price = (index) => {
        const value = valueOrFactory(index);
        return value instanceof Money ? value : new Money(value as number);
      };
    } else {
      this._cost_price = valueOrFactory as PropOrFactory<Money>;
    }
    return this;
  }

  withUnitPrice(valueOrFactory: PropOrFactory<number | null> | PropOrFactory<Money | null>) {
    if (typeof valueOrFactory === 'number') {
      this._unit_price = new Money(valueOrFactory);
    } else if (valueOrFactory === null) {
      this._unit_price = null;
    } else if (typeof valueOrFactory === 'function') {
      this._unit_price = (index) => {
        const value = valueOrFactory(index);
        if (value === null) return null;
        return value instanceof Money ? value : new Money(value as number);
      };
    } else {
      this._unit_price = valueOrFactory as PropOrFactory<Money | null>;
    }
    return this;
  }

  withSupplierId(valueOrFactory: PropOrFactory<string | null>) {
    this._supplier_id = valueOrFactory;
    return this;
  }

  withLocation(valueOrFactory: PropOrFactory<string | null> | PropOrFactory<Location | null>) {
    if (typeof valueOrFactory === 'string') {
      this._location = Location.fromString(valueOrFactory);
    } else if (valueOrFactory === null) {
      this._location = null;
    } else if (typeof valueOrFactory === 'function') {
      this._location = (index) => {
        const value = valueOrFactory(index);
        if (value === null) return null;
        return value instanceof Location ? value : Location.fromString(value as string);
      };
    } else {
      this._location = valueOrFactory as PropOrFactory<Location | null>;
    }
    return this;
  }

  withExpiryDate(valueOrFactory: PropOrFactory<Date | null> | PropOrFactory<ExpiryDate | null>) {
    if (valueOrFactory instanceof Date) {
      this._expiry_date = new ExpiryDate(valueOrFactory);
    } else if (valueOrFactory === null) {
      this._expiry_date = null;
    } else if (typeof valueOrFactory === 'function') {
      this._expiry_date = (index) => {
        const value = valueOrFactory(index);
        if (value === null) return null;
        return value instanceof ExpiryDate ? value : new ExpiryDate(value as Date);
      };
    } else {
      this._expiry_date = valueOrFactory as PropOrFactory<ExpiryDate | null>;
    }
    return this;
  }

  withBatchNumber(valueOrFactory: PropOrFactory<string | null>) {
    this._batch_number = valueOrFactory;
    return this;
  }

  activate() {
    this._is_active = true;
    return this;
  }

  deactivate() {
    this._is_active = false;
    return this;
  }

  withCreatedAt(valueOrFactory: PropOrFactory<Date>) {
    this._created_at = valueOrFactory;
    return this;
  }

  // Métodos específicos para supermercado
  withPerishableProduct() {
    this._expiry_date = (_index) => {
      const days = this.chance.integer({ min: 1, max: 365 });
      const date = new Date(Date.now() + 86400000 * days);
      return new ExpiryDate(date);
    };
    this._batch_number = (_index) => `LOT-${this.chance.string({ length: 10, alpha: true, numeric: true }).toUpperCase()}`;
    return this;
  }

  withNonPerishableProduct() {
    this._expiry_date = null;
    this._batch_number = null;
    return this;
  }

  withLowStock() {
    this._quantity = new Quantity(this.chance.integer({ min: 0, max: 50 }));
    return this;
  }

  withOutOfStock() {
    this._quantity = new Quantity(0);
    return this;
  }

  withFullStock() {
    this._quantity = new Quantity(this.chance.integer({ min: 800, max: 1000 }));
    return this;
  }

  withHighValueProduct() {
    this._cost_price = new Money(this.chance.floating({ min: 50, max: 500, fixed: 2 }));
    return this;
  }

  withLowValueProduct() {
    this._cost_price = new Money(this.chance.floating({ min: 0.5, max: 10, fixed: 2 }));
    return this;
  }

  build(): TBuild {
    const inventories = new Array(this.countObjs)
      .fill(undefined)
      .map((_, index) => {
        const inventory = new Inventory({
          inventory_item_id: !this._inventory_item_id
            ? undefined
            : this.callFactory(this._inventory_item_id, index),
          product_id: this.callFactory(this._product_id, index),
          store_id: this.callFactory(this._store_id, index),
          quantity: this.callFactory(this._quantity, index),
          min_stock: this.callFactory(this._min_stock, index),
          max_stock: this.callFactory(this._max_stock, index),
          cost_price: this.callFactory(this._cost_price, index),
          unit_price: this.callFactory(this._unit_price, index),
          supplier_id: this.callFactory(this._supplier_id, index),
          location: this.callFactory(this._location, index),
          expiry_date: this.callFactory(this._expiry_date, index),
          batch_number: this.callFactory(this._batch_number, index),
          ...(this._created_at && {
            created_at: this.callFactory(this._created_at, index),
          }),
        });
        inventory.validate();
        return inventory;
      });
    return (this.countObjs === 1 ? inventories[0] : inventories) as TBuild;
  }

  get inventory_item_id() {
    return this.getValue('inventory_item_id');
  }

  get product_id() {
    return this.getValue('product_id');
  }

  get store_id() {
    return this.getValue('store_id');
  }

  get quantity() {
    return this.getValue('quantity');
  }

  get min_stock() {
    return this.getValue('min_stock');
  }

  get max_stock() {
    return this.getValue('max_stock');
  }

  get cost_price() {
    return this.getValue('cost_price');
  }

  get unit_price() {
    return this.getValue('unit_price');
  }

  get supplier_id() {
    return this.getValue('supplier_id');
  }

  get location() {
    return this.getValue('location');
  }

  get expiry_date() {
    return this.getValue('expiry_date');
  }

  get batch_number() {
    return this.getValue('batch_number');
  }

  get is_active() {
    return this.getValue('is_active');
  }

  get created_at() {
    return this.getValue('created_at');
  }

  private getValue(prop: any) {
    const optional = ['inventory_item_id', 'created_at'];
    const privateProp = `_${prop}` as keyof this;
    if (!this[privateProp] && optional.includes(prop)) {
      throw new Error(
        `Property ${prop} not have a factory, use 'with' methods`,
      );
    }
    return this.callFactory(this[privateProp], 0);
  }

  private callFactory(factoryOrValue: PropOrFactory<any>, index: number) {
    return typeof factoryOrValue === 'function'
      ? factoryOrValue(index)
      : factoryOrValue;
  }

  // Dados específicos do domínio de supermercado
  private getLocation(): Location {
    const sections = ['A', 'B', 'C', 'D', 'E', 'F'];
    const aisles = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10'];
    const shelves = ['01', '02', '03', '04', '05'];
    
    const section = this.chance.pickone(sections);
    const aisle = this.chance.pickone(aisles);
    const shelf = this.chance.pickone(shelves);
    
    return Location.fromString(`${section}-${aisle}-${shelf}`);
  }

  private getExpiryDate(): ExpiryDate | null {
    // 50% de chance de ser perecível
    if (this.chance.bool({ likelihood: 50 })) {
      const daysFromNow = this.chance.integer({ min: 1, max: 365 });
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + daysFromNow);
      return new ExpiryDate(expiryDate);
    }
    return null;
  }

  private getBatchNumber(): string | null {
    // Se tem data de validade, deve ter lote
    if (this.getExpiryDate()) {
      const year = this.chance.year();
      const month = this.chance.integer({ min: 1, max: 12 }).toString().padStart(2, '0');
      const day = this.chance.integer({ min: 1, max: 28 }).toString().padStart(2, '0');
      const sequence = this.chance.integer({ min: 1, max: 999 }).toString().padStart(3, '0');
      
      return `LOT-${year}${month}${day}-${sequence}`;
    }
    return null;
  }
}