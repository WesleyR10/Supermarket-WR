import { AggregateRoot } from '../../shared/domain/aggregate-root';
import { ValueObject } from '../../shared/domain/value-object';
import { Uuid } from '../../shared/domain/value-objects/uuid.vo';
import { InventoryFakeBuilder } from './inventory-fake.builder';
import { InventoryValidatorFactory } from './inventory.validator';

export type InventoryConstructorProps = {
  inventory_item_id?: InventoryId;
  store_id: string;
  product_id: string;
  quantity: number;
  min_stock: number;
  max_stock: number;
  
  // Campos específicos do domínio de supermercado
  location?: string | null; // Localização no estoque
  expiry_date?: Date | null; // Data de validade (para perecíveis)
  batch_number?: string | null; // Número do lote
  supplier_id?: string | null; // Fornecedor do produto
  cost_price?: number | null; // Preço de custo atual
  last_movement_date?: Date; // Data da última movimentação
  created_at?: Date;
  updated_at?: Date;
};

export type InventoryCreateCommand = {
  store_id: string;
  product_id: string;
  quantity: number;
  min_stock: number;
  max_stock: number;
  location?: string | null;
  expiry_date?: Date | null;
  batch_number?: string | null;
  supplier_id?: string | null;
  cost_price?: number | null;
};

export class InventoryId extends Uuid {}

export class Inventory extends AggregateRoot {
  inventory_item_id: InventoryId;
  store_id: string;
  product_id: string;
  quantity: number;
  min_stock: number;
  max_stock: number;
  
  // Campos específicos do domínio de supermercado
  location: string | null; // Localização no estoque
  expiry_date: Date | null; // Data de validade (para perecíveis)
  batch_number: string | null; // Número do lote
  supplier_id: string | null; // Fornecedor do produto
  cost_price: number | null; // Preço de custo atual
  last_movement_date: Date; // Data da última movimentação
  created_at: Date;
  updated_at: Date;

  constructor(props: InventoryConstructorProps) {
    super();
    this.inventory_item_id = props.inventory_item_id ?? new InventoryId();
    this.store_id = props.store_id;
    this.product_id = props.product_id;
    this.quantity = props.quantity;
    this.min_stock = props.min_stock;
    this.max_stock = props.max_stock;
    this.location = props.location ?? null;
    this.expiry_date = props.expiry_date ?? null;
    this.batch_number = props.batch_number ?? null;
    this.supplier_id = props.supplier_id ?? null;
    this.cost_price = props.cost_price ?? null;
    this.last_movement_date = props.last_movement_date ?? new Date();
    this.created_at = props.created_at ?? new Date();
    this.updated_at = props.updated_at ?? new Date();
  }

  get entity_id(): ValueObject {
    return this.inventory_item_id;
  }

  static create(props: InventoryCreateCommand): Inventory {
    const inventory = new Inventory(props);
    inventory.validate(['product_id', 'store_id', 'quantity', 'cost_price']);
    return inventory;
  }

  // REGRAS DE NEGÓCIO ESPECÍFICAS DO SUPERMERCADO

  addStock(quantity: number): void {
    // Regra de negócio: Adiciona estoque respeitando o máximo
    const newQuantity = this.quantity + quantity;
    if (newQuantity > this.max_stock) {
      throw new Error(`Cannot add stock. Maximum quantity (${this.max_stock}) would be exceeded`);
    }
    this.quantity = newQuantity;
    this.updated_at = new Date();
    this.validate(['quantity']);
  }

  removeStock(quantity: number): void {
    // Regra de negócio: Remove estoque respeitando o mínimo
    const newQuantity = this.quantity - quantity;
    if (newQuantity < 0) {
      throw new Error(`Cannot remove stock. Insufficient quantity available`);
    }
    this.quantity = newQuantity;
    this.updated_at = new Date();
    this.validate(['quantity']);
  }

  reserveStock(quantity: number): void {
    // Regra de negócio: Reserva estoque para vendas
    const availableQuantity = this.quantity - this.min_stock;
    if (quantity > availableQuantity) {
      throw new Error(`Cannot reserve stock. Only ${availableQuantity} units available for reservation`);
    }
    // Em um sistema real, aqui seria criada uma reserva
    this.quantity -= quantity;
    this.updated_at = new Date();
    this.validate(['quantity']);
  }

  updateCostPrice(newCost: number): void {
    // Regra de negócio: Atualiza custo unitário
    this.cost_price = newCost;
    this.updated_at = new Date();
    this.validate(['cost_price']);
  }

  setSupplier(supplierId: string | null): void {
    // Regra de negócio: Define fornecedor
    this.supplier_id = supplierId;
    this.updated_at = new Date();
  }

  setLocation(location: string | null): void {
    // Regra de negócio: Define localização no estoque
    this.location = location;
    this.updated_at = new Date();
  }

  setExpiryDate(expiryDate: Date | null): void {
    // Regra de negócio: Define data de validade
    this.expiry_date = expiryDate;
    this.updated_at = new Date();
  }

  setBatchNumber(batchNumber: string | null): void {
    // Regra de negócio: Define número do lote
    this.batch_number = batchNumber;
    this.updated_at = new Date();
  }

  // REGRAS DE NEGÓCIO ESPECÍFICAS DO DOMÍNIO DE SUPERMERCADO

  // Verifica se estoque está baixo (abaixo do mínimo)
  isLowStock(): boolean {
    return this.quantity <= this.min_stock;
  }

  // Verifica se estoque está vazio
  isOutOfStock(): boolean {
    return this.quantity === 0;
  }

  // Verifica se estoque está cheio (próximo ao máximo)
  isFullStock(): boolean {
    return this.quantity >= this.max_stock * 0.9; // 90% do máximo
  }

  // Verifica se produto está vencido
  isExpired(): boolean {
    if (!this.expiry_date) return false;
    return new Date() > this.expiry_date;
  }

  // Verifica se produto está próximo do vencimento (30 dias)
  isNearExpiry(): boolean {
    if (!this.expiry_date) return false;
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return this.expiry_date <= thirtyDaysFromNow;
  }

  // Calcula margem de lucro
  calculateProfitMargin(): number {
    if (!this.cost_price || this.cost_price <= 0) return 0;
    // Precisaria do preço de venda do produto para calcular margem
    return 0;
  }

  // Calcula valor total do estoque
  calculateTotalValue(): number {
    return this.quantity * (this.cost_price || 0);
  }

  // Calcula valor total de vendas
  calculateTotalSaleValue(): number {
    // Precisaria do preço de venda do produto para calcular valor total de vendas
    return 0;
  }

  // Verifica se precisa repor estoque
  needsRestock(): boolean {
    return this.quantity <= this.min_stock;
  }

  // Calcula quantidade necessária para reposição
  calculateRestockQuantity(): number {
    return Math.max(0, this.max_stock - this.quantity);
  }

  // Verifica se produto é perecível
  isPerishable(): boolean {
    return this.expiry_date !== null;
  }

  // Calcula dias até expiração
  getDaysUntilExpiry(): number | null {
    if (!this.expiry_date) return null;
    const today = new Date();
    const diffTime = this.expiry_date.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  validate(fields?: string[]) {
    const validator = InventoryValidatorFactory.create();
    return validator.validate(this.notification, this, fields);
  }

  static fake() {
    return InventoryFakeBuilder;
  }

  toJSON() {
    return {
      inventory_item_id: this.inventory_item_id.id,
      store_id: this.store_id,
      product_id: this.product_id,
      quantity: this.quantity,
      min_stock: this.min_stock,
      max_stock: this.max_stock,
      location: this.location,
      expiry_date: this.expiry_date,
      batch_number: this.batch_number,
      supplier_id: this.supplier_id,
      cost_price: this.cost_price,
      last_movement_date: this.last_movement_date,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
} 