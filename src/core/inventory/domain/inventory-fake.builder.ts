import { Chance } from 'chance';
import { Inventory, InventoryId } from './inventory.aggregate';

type PropOrFactory<T> = T | ((index: number) => T);

export class InventoryFakeBuilder<TBuild = any> {
  // auto generated in entity
  private _inventory_item_id: PropOrFactory<InventoryId> | undefined = undefined;
  private _product_id: PropOrFactory<string> = (_index) => this.chance.guid();
  private _store_id: PropOrFactory<string> = (_index) => this.chance.guid();
  private _quantity: PropOrFactory<number> = (_index) => this.chance.integer({ min: 0, max: 1000 });
  private _minimum_quantity: PropOrFactory<number> = (_index) => this.chance.integer({ min: 10, max: 100 });
  private _maximum_quantity: PropOrFactory<number> = (_index) => this.chance.integer({ min: 200, max: 5000 });
  private _unit_cost: PropOrFactory<number> = (_index) => this.chance.floating({ min: 1, max: 100, fixed: 2 });
  private _unit_price: PropOrFactory<number> = (_index) => this.chance.floating({ min: 2, max: 200, fixed: 2 });
  private _supplier_id: PropOrFactory<string | null> = (_index) => this.chance.guid();
  private _location_code: PropOrFactory<string | null> = (_index) => this.getLocationCode();
  private _expiry_date: PropOrFactory<Date | null> = (_index) => this.getExpiryDate();
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

  withQuantity(valueOrFactory: PropOrFactory<number>) {
    this._quantity = valueOrFactory;
    return this;
  }

  withMinimumQuantity(valueOrFactory: PropOrFactory<number>) {
    this._minimum_quantity = valueOrFactory;
    return this;
  }

  withMaximumQuantity(valueOrFactory: PropOrFactory<number>) {
    this._maximum_quantity = valueOrFactory;
    return this;
  }

  withUnitCost(valueOrFactory: PropOrFactory<number>) {
    this._unit_cost = valueOrFactory;
    return this;
  }

  withUnitPrice(valueOrFactory: PropOrFactory<number>) {
    this._unit_price = valueOrFactory;
    return this;
  }

  withSupplierId(valueOrFactory: PropOrFactory<string | null>) {
    this._supplier_id = valueOrFactory;
    return this;
  }

  withLocationCode(valueOrFactory: PropOrFactory<string | null>) {
    this._location_code = valueOrFactory;
    return this;
  }

  withExpiryDate(valueOrFactory: PropOrFactory<Date | null>) {
    this._expiry_date = valueOrFactory;
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
    this._expiry_date = this.getExpiryDate();
    this._batch_number = this.getBatchNumber();
    return this;
  }

  withNonPerishableProduct() {
    this._expiry_date = null;
    this._batch_number = null;
    return this;
  }

  withLowStock() {
    this._quantity = this.chance.integer({ min: 0, max: 50 });
    return this;
  }

  withOutOfStock() {
    this._quantity = 0;
    return this;
  }

  withFullStock() {
    this._quantity = this.chance.integer({ min: 800, max: 1000 });
    return this;
  }

  withHighValueProduct() {
    this._unit_cost = this.chance.floating({ min: 50, max: 500, fixed: 2 });
    this._unit_price = this.chance.floating({ min: 100, max: 1000, fixed: 2 });
    return this;
  }

  withLowValueProduct() {
    this._unit_cost = this.chance.floating({ min: 0.5, max: 10, fixed: 2 });
    this._unit_price = this.chance.floating({ min: 1, max: 20, fixed: 2 });
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
          minimum_quantity: this.callFactory(this._minimum_quantity, index),
          maximum_quantity: this.callFactory(this._maximum_quantity, index),
          unit_cost: this.callFactory(this._unit_cost, index),
          unit_price: this.callFactory(this._unit_price, index),
          supplier_id: this.callFactory(this._supplier_id, index),
          location_code: this.callFactory(this._location_code, index),
          expiry_date: this.callFactory(this._expiry_date, index),
          batch_number: this.callFactory(this._batch_number, index),
          is_active: this.callFactory(this._is_active, index),
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

  get minimum_quantity() {
    return this.getValue('minimum_quantity');
  }

  get maximum_quantity() {
    return this.getValue('maximum_quantity');
  }

  get unit_cost() {
    return this.getValue('unit_cost');
  }

  get unit_price() {
    return this.getValue('unit_price');
  }

  get supplier_id() {
    return this.getValue('supplier_id');
  }

  get location_code() {
    return this.getValue('location_code');
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
  private getLocationCode(): string {
    const sections = ['A', 'B', 'C', 'D', 'E', 'F'];
    const aisles = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10'];
    const shelves = ['01', '02', '03', '04', '05'];
    
    const section = this.chance.pickone(sections);
    const aisle = this.chance.pickone(aisles);
    const shelf = this.chance.pickone(shelves);
    
    return `${section}-${aisle}-${shelf}`;
  }

  private getExpiryDate(): Date | null {
    // 50% de chance de ser perecível
    if (this.chance.bool({ likelihood: 50 })) {
      const daysFromNow = this.chance.integer({ min: 1, max: 365 });
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + daysFromNow);
      return expiryDate;
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