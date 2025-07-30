import { Chance } from 'chance';
import { Product, ProductId, UnitType } from './product.aggregate';

type PropOrFactory<T> = T | ((index: number) => T);

export class ProductFakeBuilder<TBuild = any> {
  private _product_id: PropOrFactory<ProductId> = (_index) => new ProductId();
  private _store_id: PropOrFactory<string> = (_index) => 
    this.chance.guid({ version: 4 });
  private _category_id: PropOrFactory<string> = (_index) => 
    this.chance.guid({ version: 4 });
  private _name: PropOrFactory<string> = (_index) => 
    this.chance.pickone([
      'Coca-Cola 2L',
      'Arroz Tio João 5kg',
      'Leite Integral 1L',
      'Pão de Açúcar',
      'Carne Bovina 1kg',
      'Frango Inteiro',
      'Macarrão Barilla 500g',
      'Óleo de Soja 900ml',
      'Açúcar Cristal 1kg',
      'Café Pelé 500g',
      'Detergente Ypê 500ml',
      'Sabão em Pó OMO 1kg',
      'Shampoo Seda 400ml',
      'Biscoito Trakinas 126g',
      'Iogurte Danone 170g'
    ]);
  private _description: PropOrFactory<string | null> = (_index) => 
    this.chance.bool({ likelihood: 70 }) ? this.chance.sentence() : null;
  private _barcode: PropOrFactory<string> = (_index) => 
    this.chance.string({ length: 13, pool: '0123456789' });
  private _price: PropOrFactory<number> = (_index) => 
    parseFloat(this.chance.floating({ min: 0.50, max: 150.00, fixed: 2 }).toString());
  private _cost_price: PropOrFactory<number | null> = (_index) => 
    this.chance.bool({ likelihood: 80 }) ? 
      parseFloat(this.chance.floating({ min: 0.30, max: 80.00, fixed: 2 }).toString()) : null;
  private _is_active: PropOrFactory<boolean> = (_index) => true;
  
  // Campos específicos do supermercado
  private _brand: PropOrFactory<string | null> = (_index) => 
    this.chance.bool({ likelihood: 75 }) ? this.chance.pickone([
      'Coca-Cola', 'Nestlé', 'Unilever', 'Procter & Gamble', 'Danone',
      'Tio João', 'Sadia', 'Perdigão', 'Barilla', 'Pelé', 'OMO', 'Ypê',
      'Seda', 'Trakinas', 'Bauducco', 'Garoto', 'Lacta', 'Vigor'
    ]) : null;
  private _unit_type: PropOrFactory<UnitType> = (_index) => UnitType.UNIT;
  private _weight: PropOrFactory<number | null> = (_index) => 
    this.chance.bool({ likelihood: 60 }) ? 
      this.chance.integer({ min: 50, max: 5000 }) : null; // 50g a 5kg
  private _volume: PropOrFactory<number | null> = (_index) => 
    this.chance.bool({ likelihood: 40 }) ? 
      this.chance.integer({ min: 100, max: 5000 }) : null; // 100ml a 5L
  private _dimensions: PropOrFactory<string | null> = (_index) => 
    this.chance.bool({ likelihood: 30 }) ? 
      `${this.chance.integer({ min: 5, max: 30 })}x${this.chance.integer({ min: 5, max: 30 })}x${this.chance.integer({ min: 5, max: 30 })}cm` : null;
  private _supplier_code: PropOrFactory<string | null> = (_index) => 
    this.chance.bool({ likelihood: 50 }) ? 
      this.chance.string({ length: 8, pool: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' }) : null;
  private _ncm_code: PropOrFactory<string | null> = (_index) => 
    this.chance.bool({ likelihood: 60 }) ? 
      this.chance.string({ length: 8, pool: '0123456789' }) : null;
  private _requires_weighing: PropOrFactory<boolean> = (_index) => false;
  
  private _created_at: PropOrFactory<Date> = (_index) => 
    new Date(this.chance.date({ min: new Date(2020, 0, 1) }));
  private _updated_at: PropOrFactory<Date> = (_index) => 
    new Date(this.chance.date({ min: new Date(2023, 0, 1) }));

  private countObjs = 1;
  private chance: Chance.Chance;

  // Factory methods
  static aProduct() {
    return new ProductFakeBuilder<Product>();
  }

  private constructor() {
    this.chance = Chance();
  }

  static theProducts(countObjs: number): ProductFakeBuilder {
    const builder = new ProductFakeBuilder();
    builder.countObjs = countObjs;
    return builder;
  }

  // Métodos específicos do domínio de supermercado
  
  withBeverage() {
    this._name = () => this.chance.pickone([
      'Coca-Cola 2L', 'Pepsi 2L', 'Guaraná Antarctica 2L', 'Sprite 2L',
      'Fanta Laranja 2L', 'Água Mineral 1.5L', 'Suco Del Valle 1L',
      'Cerveja Brahma 350ml', 'Vinho Tinto 750ml', 'Cachaça 51 700ml'
    ]);
    this._unit_type = () => UnitType.LITER;
    this._volume = () => this.chance.integer({ min: 350, max: 2000 });
    this._ncm_code = () => '22021000'; // NCM para bebidas
    this._brand = () => this.chance.pickone([
      'Coca-Cola', 'Pepsi', 'Guaraná Antarctica', 'Sprite', 'Fanta',
      'Água Crystal', 'Del Valle', 'Brahma', 'Vinícola Aurora', 'Cachaça 51'
    ]);
    return this;
  }

  withMeatProduct() {
    this._name = () => this.chance.pickone([
      'Carne Bovina Premium', 'Frango Inteiro', 'Costela Suína',
      'Picanha 1kg', 'Alcatra Fatiada', 'Linguiça Toscana',
      'Bacon Fatiado', 'Peito de Frango', 'Coxão Mole'
    ]);
    this._unit_type = () => UnitType.KG;
    this._requires_weighing = () => true;
    this._weight = () => this.chance.integer({ min: 500, max: 3000 });
    this._ncm_code = () => '02013000'; // NCM para carnes
    this._brand = () => this.chance.pickone(['Sadia', 'Perdigão', 'Seara', 'Friboi']);
    return this;
  }

  withGroceryItem() {
    this._name = () => this.chance.pickone([
      'Arroz Branco 5kg', 'Feijão Preto 1kg', 'Açúcar Cristal 1kg',
      'Óleo de Soja 900ml', 'Macarrão Espaguete 500g', 'Farinha de Trigo 1kg',
      'Sal Refinado 1kg', 'Café Torrado 500g'
    ]);
    this._unit_type = () => UnitType.UNIT;
    this._brand = () => this.chance.pickone(['Tio João', 'Camil', 'União', 'Soya']);
    return this;
  }

  withCleaningProduct() {
    this._name = () => this.chance.pickone([
      'Detergente Líquido 500ml', 'Sabão em Pó 1kg', 'Desinfetante 1L',
      'Água Sanitária 1L', 'Amaciante 2L', 'Esponja de Aço',
      'Papel Higiênico 12 rolos', 'Sabonete 90g'
    ]);
    this._brand = () => this.chance.pickone(['Ypê', 'OMO', 'Veja', 'Bombril']);
    this._ncm_code = () => '34022000'; // NCM para produtos de limpeza
    return this;
  }

  withHighValueProduct() {
    this._price = () => parseFloat(this.chance.floating({ min: 50.00, max: 500.00, fixed: 2 }).toString());
    this._cost_price = () => parseFloat(this.chance.floating({ min: 30.00, max: 300.00, fixed: 2 }).toString());
    return this;
  }

  withPerishableProduct() {
    this._name = () => this.chance.pickone([
      'Leite Integral 1L', 'Iogurte Natural 170g', 'Queijo Mussarela 200g',
      'Presunto Fatiado 200g', 'Pão de Forma', 'Ovos Brancos 12 unidades'
    ]);
    this._brand = () => this.chance.pickone(['Nestlé', 'Danone', 'Vigor', 'Tirolez']);
    return this;
  }

  withDiscountedProduct() {
    this._price = () => parseFloat(this.chance.floating({ min: 1.00, max: 15.00, fixed: 2 }).toString());
    return this;
  }

  withInactiveProduct() {
    this._is_active = () => false;
    return this;
  }

  withWeighableProduct() {
    this._requires_weighing = () => true;
    this._unit_type = () => UnitType.KG;
    return this;
  }

  // Métodos with para configuração individual
  withProductId(valueOrFactory: PropOrFactory<ProductId>) {
    this._product_id = valueOrFactory;
    return this;
  }

  withStoreId(valueOrFactory: PropOrFactory<string>) {
    this._store_id = valueOrFactory;
    return this;
  }

  withCategoryId(valueOrFactory: PropOrFactory<string>) {
    this._category_id = valueOrFactory;
    return this;
  }

  withName(valueOrFactory: PropOrFactory<string>) {
    this._name = valueOrFactory;
    return this;
  }

  withDescription(valueOrFactory: PropOrFactory<string | null>) {
    this._description = valueOrFactory;
    return this;
  }

  withBarcode(valueOrFactory: PropOrFactory<string>) {
    this._barcode = valueOrFactory;
    return this;
  }

  withPrice(valueOrFactory: PropOrFactory<number>) {
    this._price = valueOrFactory;
    return this;
  }

  withCostPrice(valueOrFactory: PropOrFactory<number | null>) {
    this._cost_price = valueOrFactory;
    return this;
  }

  withIsActive(valueOrFactory: PropOrFactory<boolean>) {
    this._is_active = valueOrFactory;
    return this;
  }

  withBrand(valueOrFactory: PropOrFactory<string | null>) {
    this._brand = valueOrFactory;
    return this;
  }

  withUnitType(valueOrFactory: PropOrFactory<UnitType>) {
    this._unit_type = valueOrFactory;
    return this;
  }

  withWeight(valueOrFactory: PropOrFactory<number | null>) {
    this._weight = valueOrFactory;
    return this;
  }

  withVolume(valueOrFactory: PropOrFactory<number | null>) {
    this._volume = valueOrFactory;
    return this;
  }

  withDimensions(valueOrFactory: PropOrFactory<string | null>) {
    this._dimensions = valueOrFactory;
    return this;
  }

  withSupplierCode(valueOrFactory: PropOrFactory<string | null>) {
    this._supplier_code = valueOrFactory;
    return this;
  }

  withNcmCode(valueOrFactory: PropOrFactory<string | null>) {
    this._ncm_code = valueOrFactory;
    return this;
  }

  withRequiresWeighing(valueOrFactory: PropOrFactory<boolean>) {
    this._requires_weighing = valueOrFactory;
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

  activate() {
    this._is_active = () => true;
    return this;
  }

  deactivate() {
    this._is_active = () => false;
    return this;
  }

  // MÉTODO BUILD QUE ESTAVA FALTANDO
  build(): TBuild {
    const products = new Array(this.countObjs).fill(undefined).map((_, index) => {
      const product = new Product({
        product_id: this.callFactory(this._product_id, index),
        store_id: this.callFactory(this._store_id, index),
        category_id: this.callFactory(this._category_id, index),
        name: this.callFactory(this._name, index),
        description: this.callFactory(this._description, index),
        barcode: this.callFactory(this._barcode, index),
        price: this.callFactory(this._price, index),
        cost_price: this.callFactory(this._cost_price, index),
        is_active: this.callFactory(this._is_active, index),
        brand: this.callFactory(this._brand, index),
        unit_type: this.callFactory(this._unit_type, index),
        weight: this.callFactory(this._weight, index),
        volume: this.callFactory(this._volume, index),
        dimensions: this.callFactory(this._dimensions, index),
        supplier_code: this.callFactory(this._supplier_code, index),
        ncm_code: this.callFactory(this._ncm_code, index),
        requires_weighing: this.callFactory(this._requires_weighing, index),
        created_at: this.callFactory(this._created_at, index),
        updated_at: this.callFactory(this._updated_at, index),
      });
      return product;
    });
    return (this.countObjs === 1 ? products[0] : products) as TBuild;
  }

  // Getters
  get product_id() {
    return this.getValue('product_id');
  }

  get store_id() {
    return this.getValue('store_id');
  }

  get category_id() {
    return this.getValue('category_id');
  }

  get name() {
    return this.getValue('name');
  }

  get description() {
    return this.getValue('description');
  }

  get barcode() {
    return this.getValue('barcode');
  }

  get price() {
    return this.getValue('price');
  }

  get cost_price() {
    return this.getValue('cost_price');
  }

  get is_active() {
    return this.getValue('is_active');
  }

  get brand() {
    return this.getValue('brand');
  }

  get unit_type() {
    return this.getValue('unit_type');
  }

  get weight() {
    return this.getValue('weight');
  }

  get volume() {
    return this.getValue('volume');
  }

  get dimensions() {
    return this.getValue('dimensions');
  }

  get supplier_code() {
    return this.getValue('supplier_code');
  }

  get ncm_code() {
    return this.getValue('ncm_code');
  }

  get requires_weighing() {
    return this.getValue('requires_weighing');
  }

  get created_at() {
    return this.getValue('created_at');
  }

  get updated_at() {
    return this.getValue('updated_at');
  }

  private getValue(prop: string) {
    const privateProp = `_${prop}` as keyof this;
    return this.callFactory(this[privateProp] as any, 0);
  }

  private callFactory(factoryOrValue: PropOrFactory<any>, index: number) {
    if (typeof factoryOrValue === 'function') {
      return factoryOrValue(index);
    }
    return factoryOrValue;
  }
}