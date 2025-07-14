import { AggregateRoot } from '../../shared/domain/aggregate-root';
import { ValueObject } from '../../shared/domain/value-object';
import { Uuid } from '../../shared/domain/value-objects/uuid.vo';
import { ProductFakeBuilder } from './product-fake.builder';
import { ProductValidatorFactory } from './product.validator';

export type ProductConstructorProps = {
  product_id?: ProductId;
  category_id: string;
  name: string;
  description?: string | null;
  barcode: string;
  price: number;
  cost_price?: number | null;
  is_active?: boolean;
  
  // Campos específicos do domínio de supermercado
  brand?: string | null;
  unit_type?: UnitType;
  weight?: number | null; // em gramas
  volume?: number | null; // em ml
  dimensions?: string | null; // LxAxP
  supplier_code?: string | null;
  ncm_code?: string | null; // Código NCM para fiscal
  requires_weighing?: boolean; // Produtos pesáveis (açougue)
  
  created_at?: Date;
  updated_at?: Date;
};

export enum UnitType {
  UNIT = 'unit',       // Unidade
  KG = 'kg',           // Quilograma
  LITER = 'liter',     // Litro
  PACK = 'pack',       // Pacote
  BOX = 'box',         // Caixa
  BOTTLE = 'bottle',   // Garrafa
  CAN = 'can',         // Lata
  TUBE = 'tube',       // Tubo
  METER = 'meter',     // Metro
  DOZEN = 'dozen',     // Dúzia
}

export class ProductId extends Uuid {}

export class Product extends AggregateRoot {
  product_id: ProductId;
  category_id: string;
  name: string;
  description: string | null;
  barcode: string;
  price: number;
  cost_price: number | null;
  is_active: boolean;
  
  // Campos específicos do domínio de supermercado
  brand: string | null;
  unit_type: UnitType;
  weight: number | null; // em gramas
  volume: number | null; // em ml
  dimensions: string | null; // LxAxP
  supplier_code: string | null;
  ncm_code: string | null; // Código NCM para fiscal
  requires_weighing: boolean; // Produtos pesáveis (açougue)
  
  created_at: Date;
  updated_at: Date;

  constructor(props: ProductConstructorProps) {
    super();
    this.product_id = props.product_id ?? new ProductId();
    this.category_id = props.category_id;
    this.name = props.name;
    this.description = props.description ?? null;
    this.barcode = props.barcode;
    this.price = props.price;
    this.cost_price = props.cost_price ?? null;
    this.is_active = props.is_active ?? true;
    
    // Campos específicos do supermercado
    this.brand = props.brand ?? null;
    this.unit_type = props.unit_type ?? UnitType.UNIT;
    this.weight = props.weight ?? null;
    this.volume = props.volume ?? null;
    this.dimensions = props.dimensions ?? null;
    this.supplier_code = props.supplier_code ?? null;
    this.ncm_code = props.ncm_code ?? null;
    this.requires_weighing = props.requires_weighing ?? false;
    
    this.created_at = props.created_at ?? new Date();
    this.updated_at = props.updated_at ?? new Date();
  }

  // Factory method para criar produto
  static create(props: ProductConstructorProps): Product {
    const product = new Product(props);
    product.validate();
    return product;
  }

  // Validação usando ProductValidator
  validate(fields?: string[]): boolean {
    const validator = ProductValidatorFactory.create();
    return validator.validate(this.notification, this, fields);
  }

  // Métodos de negócio específicos do supermercado
  
  // Calcular margem de lucro
  calculateMargin(): number | null {
    if (!this.cost_price || this.cost_price <= 0) return null;
    return ((this.price - this.cost_price) / this.cost_price) * 100;
  }

  // Verificar se produto tem margem adequada
  hasAdequateMargin(minimumMargin: number = 20): boolean {
    const margin = this.calculateMargin();
    return margin !== null && margin >= minimumMargin;
  }

  // Verificar se produto é perecível (baseado em categoria ou peso)
  isPerishable(): boolean {
    return this.requires_weighing || this.weight !== null;
  }

  // Verificar se produto precisa de código NCM
  requiresNcmCode(): boolean {
    return this.price > 50; // Produtos acima de R$ 50 precisam de NCM
  }

  // Verificar se produto é pesável (açougue, frios)
  isWeighable(): boolean {
    return this.requires_weighing || this.unit_type === UnitType.KG;
  }

  // Calcular preço por unidade base (para comparação)
  getPricePerBaseUnit(): number {
    switch (this.unit_type) {
      case UnitType.KG:
        return this.price; // já está por kg
      case UnitType.LITER:
        return this.price; // já está por litro
      case UnitType.PACK:
        return this.weight ? this.price / (this.weight / 1000) : this.price;
      default:
        return this.price;
    }
  }

  // Verificar se produto está em categoria de bebidas
  isBeverage(): boolean {
    return this.volume !== null && this.unit_type === UnitType.LITER;
  }

  // Verificar se produto precisa de refrigeração
  needsRefrigeration(): boolean {
    return this.isPerishable() && (
      this.name.toLowerCase().includes('leite') ||
      this.name.toLowerCase().includes('iogurte') ||
      this.name.toLowerCase().includes('queijo') ||
      this.name.toLowerCase().includes('carne')
    );
  }

  // Atualizar preço com validação
  updatePrice(newPrice: number): void {
    if (newPrice <= 0) {
      this.notification.addError('Price must be greater than zero', 'price');
      return;
    }
    
    this.price = newPrice;
    this.updated_at = new Date();
  }

  // Atualizar estoque (método para integração com inventory)
  updateStock(quantity: number): void {
    // Este método seria usado para integração com o bounded context de inventory
    // Por enquanto, apenas validamos
    if (quantity < 0) {
      this.notification.addError('Stock quantity cannot be negative', 'stock');
    }
  }

  // Ativar/desativar produto
  activate(): void {
    this.is_active = true;
    this.updated_at = new Date();
  }

  deactivate(): void {
    this.is_active = false;
    this.updated_at = new Date();
  }

  // Método para compliance fiscal
  validateFiscalCompliance(): boolean {
    const errors: string[] = [];
    
    if (this.requiresNcmCode() && !this.ncm_code) {
      errors.push('NCM code is required for products above R$ 50');
    }
    
    if (this.isPerishable() && !this.weight && !this.volume) {
      errors.push('Perishable products must have weight or volume specified');
    }
    
    if (this.isBeverage() && !this.volume) {
      errors.push('Beverages must have volume specified');
    }
    
    errors.forEach(error => this.notification.addError(error, 'fiscal'));
    
    return errors.length === 0;
  }

  // Método para auditoria de precificação
  getPricingAudit(): {
    hasMargin: boolean;
    margin: number | null;
    pricePerUnit: number;
    fiscalCompliant: boolean;
  } {
    return {
      hasMargin: this.hasAdequateMargin(),
      margin: this.calculateMargin(),
      pricePerUnit: this.getPricePerBaseUnit(),
      fiscalCompliant: this.validateFiscalCompliance()
    };
  }

  // Implementação obrigatória do Entity
  get entity_id(): ValueObject {
    return this.product_id;
  }

  toJSON() {
    return {
      product_id: this.product_id.id,
      category_id: this.category_id,
      name: this.name,
      description: this.description,
      barcode: this.barcode,
      price: this.price,
      cost_price: this.cost_price,
      is_active: this.is_active,
      brand: this.brand,
      unit_type: this.unit_type,
      weight: this.weight,
      volume: this.volume,
      dimensions: this.dimensions,
      supplier_code: this.supplier_code,
      ncm_code: this.ncm_code,
      requires_weighing: this.requires_weighing,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }

  // Método estático para fake builder
  static fake(): ProductFakeBuilder {
    return ProductFakeBuilder.aProduct();
  }
} 