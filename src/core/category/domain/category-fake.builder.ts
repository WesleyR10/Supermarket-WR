import { Chance } from 'chance';
import { Category, CategoryId } from './category.aggregate';

type PropOrFactory<T> = T | ((index: number) => T);

export class CategoryFakeBuilder<TBuild = any> {
  // auto generated in entity
  private _category_id: PropOrFactory<CategoryId> | undefined = undefined;
  private _store_id: PropOrFactory<string> = (_index) => this.chance.guid();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _name: PropOrFactory<string> = (_index) => this.getSupermarketCategoryName();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _description: PropOrFactory<string | null> = (_index) =>
    this.getSupermarketCategoryDescription();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _is_active: PropOrFactory<boolean> = (_index) => true;
  // auto generated in entity
  private _created_at: PropOrFactory<Date> | undefined = undefined;

  private countObjs;
  private chance: Chance.Chance;

  static aCategory() {
    return new CategoryFakeBuilder<Category>();
  }

  static theCategories(countObjs: number) {
    return new CategoryFakeBuilder<Category[]>(countObjs);
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

  withName(valueOrFactory: PropOrFactory<string>) {
    this._name = valueOrFactory;
    return this;
  }

  withDescription(valueOrFactory: PropOrFactory<string | null>) {
    this._description = valueOrFactory;
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

  withInvalidNameTooLong(value?: string) {
    this._name = value ?? this.chance.word({ length: 256 });
    return this;
  }

  // Métodos específicos para supermercado
  withSupermarketCategory(categoryType: 'food' | 'beverage' | 'cleaning' | 'personal_care' | 'electronics') {
    const categories = {
      food: { name: 'Alimentos', description: 'Produtos alimentícios e perecíveis' },
      beverage: { name: 'Bebidas', description: 'Refrigerantes, sucos, águas e bebidas alcoólicas' },
      cleaning: { name: 'Limpeza', description: 'Produtos de limpeza e higiene doméstica' },
      personal_care: { name: 'Higiene Pessoal', description: 'Produtos de cuidados pessoais e beleza' },
      electronics: { name: 'Eletrônicos', description: 'Produtos eletrônicos e eletrodomésticos' }
    };
    
    this._name = categories[categoryType].name;
    this._description = categories[categoryType].description;
    return this;
  }

  build(): TBuild {
    const categories = new Array(this.countObjs)
      .fill(undefined)
      .map((_, index) => {
        const category = new Category({
          category_id: !this._category_id
            ? undefined
            : this.callFactory(this._category_id, index),
          store_id: this.callFactory(this._store_id, index),
          name: this.callFactory(this._name, index),
          description: this.callFactory(this._description, index),
          is_active: this.callFactory(this._is_active, index),
          ...(this._created_at && {
            created_at: this.callFactory(this._created_at, index),
          }),
        });
        category.validate();
        return category;
      });
    return (this.countObjs === 1 ? categories[0] : categories) as TBuild;
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
    const optional = ['category_id', 'created_at'];
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
  private getSupermarketCategoryName(): string {
    const supermarketCategories = [
      'Alimentos', 'Bebidas', 'Limpeza', 'Higiene Pessoal', 'Carnes e Aves',
      'Laticínios', 'Padaria', 'Hortifruti', 'Congelados', 'Eletrônicos',
      'Utilidades Domésticas', 'Pet Stores', 'Farmácia', 'Papelaria'
    ];
    return this.chance.pickone(supermarketCategories);
  }

  private getSupermarketCategoryDescription(): string {
    const descriptions = [
      'Produtos alimentícios diversos',
      'Bebidas em geral',
      'Produtos de limpeza e higiene doméstica',
      'Cuidados pessoais e beleza',
      'Carnes frescas e processadas',
      'Leites, queijos e derivados',
      'Pães, bolos e produtos de confeitaria',
      'Frutas, verduras e legumes frescos',
      'Produtos congelados e sorvetes',
      'Eletrônicos e eletrodomésticos',
      'Utensílios para casa',
      'Produtos para animais de estimação',
      'Medicamentos e produtos farmacêuticos',
      'Material de escritório e escolar'
    ];
    return this.chance.pickone(descriptions);
  }
} 