import { Chance } from 'chance';
import { Category, CategoryId } from './category.aggregate';

type PropOrFactory<T> = T | ((index: number) => T);

export class CategoryFakeBuilder<TBuild = any> {
  private _category_id: PropOrFactory<CategoryId> | undefined = undefined;
  private _store_id: PropOrFactory<string> = (_index) => this.chance.guid();
  private _name: PropOrFactory<string> = (_index) => this.getSupermarketCategoryName();
  private _description: PropOrFactory<string | null> = (_index) => this.getSupermarketCategoryDescription();
  private _is_active: PropOrFactory<boolean> = (_index) => true;
  private _parent_category_id: PropOrFactory<CategoryId | null> = (_index) => null;
  private _tax_rate: PropOrFactory<number | null> = (_index) => this.chance.floating({ min: 0, max: 27, fixed: 2 });
  private _default_margin_percentage: PropOrFactory<number | null> = (_index) => this.chance.floating({ min: 10, max: 50, fixed: 2 });
  private _requires_expiry_date: PropOrFactory<boolean> = (_index) => this.chance.bool({ likelihood: 30 });
  private _display_order: PropOrFactory<number> = (_index) => this.chance.integer({ min: 0, max: 100 });
  private _icon_name: PropOrFactory<string | null> = (_index) => this.getSupermarketIconName();
  private _created_at: PropOrFactory<Date> | undefined = undefined;
  private _updated_at: PropOrFactory<Date> | undefined = undefined;

  private countObjs;
  private chance: Chance.Chance;

  static aCategory() {
    return new CategoryFakeBuilder<Category>();
  }

  static theCategories(countObjs: number) {
    return new CategoryFakeBuilder<Category[]>(countObjs);
  }

  // Método específico para multi-tenancy - criar categorias para uma loja específica
  static categoriesForStore(storeId: string, countObjs: number = 5) {
    return new CategoryFakeBuilder<Category[]>(countObjs).withStoreId(storeId);
  }

  // Método para criar categorias de diferentes lojas (para testes de isolamento)
  static categoriesFromDifferentStores(countObjs: number = 10) {
    return new CategoryFakeBuilder<Category[]>(countObjs).withRandomStoreIds();
  }

  private constructor(countObjs: number = 1) {
    this.countObjs = countObjs;
    this.chance = Chance();
  }

  withCategoryId(valueOrFactory: PropOrFactory<CategoryId>) {
    this._category_id = valueOrFactory;
    return this;
  }

  withStoreId(valueOrFactory: PropOrFactory<string>) {
    this._store_id = valueOrFactory;
    return this;
  }

  // Método para gerar store_ids aleatórios (útil para testes de isolamento)
  withRandomStoreIds() {
    this._store_id = (_index) => this.chance.guid();
    return this;
  }

  // Método para criar categorias com store_id específico (útil para testes)
  forStore(storeId: string) {
    this._store_id = storeId;
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

  withParentCategoryId(valueOrFactory: PropOrFactory<CategoryId | null>) {
    this._parent_category_id = valueOrFactory;
    return this;
  }

  withTaxRate(valueOrFactory: PropOrFactory<number | null>) {
    this._tax_rate = valueOrFactory;
    return this;
  }

  withDefaultMarginPercentage(valueOrFactory: PropOrFactory<number | null>) {
    this._default_margin_percentage = valueOrFactory;
    return this;
  }

  withRequiresExpiryDate(valueOrFactory: PropOrFactory<boolean>) {
    this._requires_expiry_date = valueOrFactory;
    return this;
  }

  withDisplayOrder(valueOrFactory: PropOrFactory<number>) {
    this._display_order = valueOrFactory;
    return this;
  }

  withIconName(valueOrFactory: PropOrFactory<string | null>) {
    this._icon_name = valueOrFactory;
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

  withUpdatedAt(valueOrFactory: PropOrFactory<Date>) {
    this._updated_at = valueOrFactory;
    return this;
  }

  withInvalidNameTooLong(value?: string) {
    this._name = value ?? this.chance.word({ length: 256 });
    return this;
  }

  withInvalidTaxRate(value?: number) {
    this._tax_rate = value ?? this.chance.floating({ min: 101, max: 200 });
    return this;
  }

  withInvalidMarginPercentage(value?: number) {
    this._default_margin_percentage = value ?? this.chance.floating({ min: 501, max: 1000 });
    return this;
  }

  // Método para criar categoria raiz (sem parent)
  asRootCategory() {
    this._parent_category_id = null;
    return this;
  }

  asChildCategory(parentId: CategoryId) {
    this._parent_category_id = parentId;
    return this;
  }

  // Método para criar categorias específicas do supermercado com store_id
  withSupermarketCategory(categoryType: 'food' | 'beverage' | 'cleaning' | 'personal_care' | 'electronics', storeId?: string) {
    if (storeId) {
      this._store_id = storeId;
    }

    switch (categoryType) {
      case 'food':
        this._name = () => this.chance.pickone([
          'Frutas e Verduras', 'Carnes e Aves', 'Laticínios', 'Padaria', 'Congelados',
          'Grãos e Cereais', 'Conservas', 'Temperos e Condimentos'
        ]);
        this._requires_expiry_date = true;
        this._tax_rate = () => this.chance.floating({ min: 0, max: 7, fixed: 2 });
        this._icon_name = () => this.chance.pickone(['apple', 'meat', 'milk', 'bread']);
        break;
      case 'beverage':
        this._name = () => this.chance.pickone([
          'Refrigerantes', 'Sucos', 'Águas', 'Bebidas Alcoólicas', 'Energéticos',
          'Chás e Cafés', 'Bebidas Lácteas'
        ]);
        this._requires_expiry_date = true;
        this._tax_rate = () => this.chance.floating({ min: 17, max: 27, fixed: 2 });
        this._icon_name = () => this.chance.pickone(['bottle', 'coffee', 'wine']);
        break;
      case 'cleaning':
        this._name = () => this.chance.pickone([
          'Produtos de Limpeza', 'Detergentes', 'Desinfetantes', 'Papel Higiênico',
          'Produtos para Roupa'
        ]);
        this._requires_expiry_date = false;
        this._tax_rate = () => this.chance.floating({ min: 17, max: 18, fixed: 2 });
        this._icon_name = () => this.chance.pickone(['spray', 'soap', 'tissue']);
        break;
      case 'personal_care':
        this._name = () => this.chance.pickone([
          'Higiene Pessoal', 'Cosméticos', 'Perfumaria', 'Cuidados com Cabelo',
          'Produtos para Bebê'
        ]);
        this._requires_expiry_date = true;
        this._tax_rate = () => this.chance.floating({ min: 17, max: 27, fixed: 2 });
        this._icon_name = () => this.chance.pickone(['shampoo', 'perfume', 'baby']);
        break;
      case 'electronics':
        this._name = () => this.chance.pickone([
          'Eletrônicos', 'Pilhas e Baterias', 'Acessórios', 'Telefonia'
        ]);
        this._requires_expiry_date = false;
        this._tax_rate = () => this.chance.floating({ min: 17, max: 25, fixed: 2 });
        this._icon_name = () => this.chance.pickone(['phone', 'battery', 'headphones']);
        break;
    }
    return this;
  }

  build(): TBuild {
    const categories = new Array(this.countObjs).fill(undefined).map((_, index) => {
      const category = new Category({
        category_id: this.callFactory(this._category_id, index),
        store_id: this.callFactory(this._store_id, index),
        name: this.callFactory(this._name, index),
        description: this.callFactory(this._description, index),
        is_active: this.callFactory(this._is_active, index),
        parent_category_id: this.callFactory(this._parent_category_id, index),
        tax_rate: this.callFactory(this._tax_rate, index),
        default_margin_percentage: this.callFactory(this._default_margin_percentage, index),
        requires_expiry_date: this.callFactory(this._requires_expiry_date, index),
        display_order: this.callFactory(this._display_order, index),
        icon_name: this.callFactory(this._icon_name, index),
        created_at: this.callFactory(this._created_at, index),
        updated_at: this.callFactory(this._updated_at, index),
      });
      return category;
    });
    return this.countObjs === 1 ? (categories[0] as any) : (categories as any);
  }

  get category_id() {
    return this.getValue('category_id');
  }

  get store_id() {
    return this.getValue('store_id');
  }

  get name() {
    return this.getValue('name');
  }

  get description() {
    return this.getValue('description');
  }

  get is_active() {
    return this.getValue('is_active');
  }

  get created_at() {
    return this.getValue('created_at');
  }

  private getValue(prop: any) {
    const optional = ['category_id', 'created_at', 'updated_at'];
    const privateProp = `_${prop}` as keyof this;
    if (!optional.includes(prop) && !this[privateProp]) {
      throw new Error(`Property ${prop} not have a factory, use 'with' methods`);
    }
    return this.callFactory(this[privateProp], 0);
  }

  private callFactory(factoryOrValue: PropOrFactory<any>, index: number) {
    return typeof factoryOrValue === 'function' ? factoryOrValue(index) : factoryOrValue;
  }

  private getSupermarketCategoryName(): string {
    return this.chance.pickone([
      'Alimentação', 'Bebidas', 'Limpeza', 'Higiene', 'Eletrônicos',
      'Casa e Jardim', 'Pet Shop', 'Farmácia', 'Bazar'
    ]);
  }

  private getSupermarketCategoryDescription(): string | null {
    const descriptions = [
      'Categoria com produtos essenciais para o dia a dia',
      'Produtos selecionados com qualidade garantida',
      'Variedade de itens para todas as necessidades',
      'Produtos com os melhores preços do mercado',
      'Categoria com produtos premium e populares',
      null // Algumas categorias podem não ter descrição
    ];
    return this.chance.pickone(descriptions);
  }

  private getSupermarketIconName(): string {
    return this.chance.pickone([
      'shopping-cart', 'apple', 'bottle', 'spray', 'shampoo',
      'phone', 'home', 'pet', 'medical', 'gift'
    ]);
  }
}