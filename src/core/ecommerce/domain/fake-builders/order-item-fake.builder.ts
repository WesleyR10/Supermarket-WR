import { Chance } from 'chance';
import { Uuid } from '../../../shared/domain/value-objects/uuid.vo';
import { OrderItem } from '../online-order.aggregate';
import { Quantity } from '../../../shared/domain/value-objects/quantity.vo';
import { Price } from '../../../shared/domain/value-objects/price.vo';

type PropOrFactory<T> = T | ((index: number) => T);

export class OrderItemFakeBuilder<TBuild = any> {
  private _product_id: PropOrFactory<Uuid> = (_index) => new Uuid();
  private _product_name: PropOrFactory<string> = (_index) => this.getSupermarketProductName();
  private _quantity: PropOrFactory<Quantity> = (_index) => new Quantity(this.chance.integer({ min: 1, max: 10 }));
  private _unit_price: PropOrFactory<Price> = (_index) => new Price(this.chance.floating({ min: 1, max: 100, fixed: 2 }));

  private countObjs: number;
  private chance: Chance.Chance;

  static aOrderItem() {
    return new OrderItemFakeBuilder<OrderItem>();
  }

  static theOrderItems(countObjs: number) {
    return new OrderItemFakeBuilder<OrderItem[]>(countObjs);
  }

  private constructor(countObjs: number = 1) {
    this.countObjs = countObjs;
    this.chance = Chance();
  }

  withProductId(valueOrFactory: PropOrFactory<Uuid>) {
    this._product_id = valueOrFactory;
    return this;
  }

  withProductName(valueOrFactory: PropOrFactory<string>) {
    this._product_name = valueOrFactory;
    return this;
  }

  withQuantity(valueOrFactory: PropOrFactory<Quantity>) {
    this._quantity = valueOrFactory;
    return this;
  }

  withUnitPrice(valueOrFactory: PropOrFactory<Price>) {
    this._unit_price = valueOrFactory;
    return this;
  }

  build(): TBuild {
    const items = new Array(this.countObjs)
      .fill(undefined)
      .map((_, index) => {
        return OrderItem.create({
          product_id: this.callFactory(this._product_id, index),
          product_name: this.callFactory(this._product_name, index),
          quantity: this.callFactory(this._quantity, index),
          unit_price: this.callFactory(this._unit_price, index)
        });
      });
    return (this.countObjs === 1 ? items[0] : items) as TBuild;
  }

  private callFactory(factoryOrValue: PropOrFactory<any>, index: number) {
    return typeof factoryOrValue === 'function' ? factoryOrValue(index) : factoryOrValue;
  }

  private getSupermarketProductName(): string {
    const products = [
      'Arroz Branco 5kg', 'Feijão Preto 1kg', 'Açúcar Cristal 1kg', 'Óleo de Soja 900ml',
      'Macarrão Espaguete 500g', 'Leite Integral 1L', 'Pão de Forma', 'Ovos Brancos Dúzia',
      'Banana Prata kg', 'Tomate kg', 'Cebola kg', 'Batata kg',
      'Refrigerante Cola 2L', 'Água Mineral 1.5L', 'Suco de Laranja 1L',
      'Sabão em Pó 1kg', 'Detergente 500ml', 'Papel Higiênico 4 rolos'
    ];
    return this.chance.pickone(products);
  }
}