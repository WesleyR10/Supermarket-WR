import { AggregateRoot } from '../../shared/domain/aggregate-root';
import { ValueObject } from '../../shared/domain/value-object';
import { Uuid } from '../../shared/domain/value-objects/uuid.vo';
import { Quantity } from '../../shared/domain/value-objects/quantity.vo';
import { Location } from '../../shared/domain/value-objects/location.vo';
import { ExpiryDate } from '../../shared/domain/value-objects/expiry-date.vo';
import { Money } from '../../shared/domain/value-objects/money.vo';
import { InventoryFakeBuilder } from './inventory-fake.builder';
import { InventoryValidatorFactory } from './inventory.validator';

export type InventoryConstructorProps = {
  inventory_item_id?: InventoryId; // ID único do item no inventário
  store_id: string; // ID da loja/filial onde o produto está localizado
  product_id: string; // ID do produto/SKU que está sendo rastreado
  quantity: Quantity; // Quantidade atual em estoque
  min_stock: Quantity; // Quantidade mínima antes de precisar reabastece
  max_stock: Quantity; // Quantidade máxima que pode ser armazenada
  
  // Campos específicos do domínio de supermercado
  location?: Location | null; // Localização física no estoque (ex: "A1-B2-C3", "Corredor 5")
  expiry_date?: ExpiryDate | null; // Data de validade para produtos perecíveis
  batch_number?: string | null; // Número do lote para rastreabilidade
  supplier_id?: string | null; // ID do fornecedor que vendeu o produto
  cost_price?: Money | null; // Preço de custo/compra para cálculo de margem
  unit_price?: Money | null; // Preço unitário de venda do produto
  is_active?: boolean; // Indica se o item está ativo no sistema
  last_movement_date?: Date; // Data da última movimentação (entrada/saída)
  created_at?: Date; // Data de criação do registro
  updated_at?: Date; // Data da última atualização
};

export type InventoryCreateCommand = {
  store_id: string; // ID da loja/filial onde o produto está localizado
  product_id: string; // ID do produto/SKU que está sendo rastreado
  quantity: number; // Quantidade atual em estoque
  min_stock: number; // Quantidade mínima antes de precisar reabastecer
  max_stock: number; // Quantidade máxima que pode ser armazenada
  location?: string | null; // Localização física no estoque
  expiry_date?: Date | null; // Data de validade para produtos perecíveis
  batch_number?: string | null; // Número do lote para rastreabilidade
  supplier_id?: string | null; // ID do fornecedor que vendeu o produto
  cost_price?: number | null; // Preço de custo/compra para cálculo de margem
  unit_price?: number | null; // Preço unitário de venda do produto
  unit_cost?: number | null; // Alias para cost_price (compatibilidade)
  is_active?: boolean; // Indica se o item está ativo no sistema
};

export class InventoryId extends Uuid {}

export class Inventory extends AggregateRoot {
  inventory_item_id: InventoryId;
  store_id: string;
  product_id: string;
  quantity: Quantity;
  min_stock: Quantity;
  max_stock: Quantity;
  
  // Campos específicos do domínio de supermercado
  location: Location | null;
  expiry_date: ExpiryDate | null;
  batch_number: string | null;
  supplier_id: string | null;
  unit_price: Money | null;
  cost_price: Money | null;
  is_active: boolean;
  last_movement_date: Date;
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
    this.unit_price = props.unit_price ?? null;
    this.cost_price = props.cost_price ?? null;
    this.is_active = props.is_active ?? true;
    this.last_movement_date = props.last_movement_date ?? new Date();
    this.created_at = props.created_at ?? new Date();
    this.updated_at = props.updated_at ?? new Date();
  }

  get entity_id(): ValueObject {
    return this.inventory_item_id;
  }

  static create(props: InventoryCreateCommand): Inventory {
    const costPrice = props.cost_price ?? props.unit_cost;
    const inventory = new Inventory({
      ...props,
      quantity: new Quantity(props.quantity),
      min_stock: new Quantity(props.min_stock),
      max_stock: new Quantity(props.max_stock),
      location: props.location ? Location.fromString(props.location) : null,
      expiry_date: props.expiry_date ? new ExpiryDate(props.expiry_date) : null,
      cost_price: costPrice ? new Money(costPrice) : null,
      unit_price: props.unit_price ? new Money(props.unit_price) : null,
    });
    // Seguindo padrão base: validar apenas campos de "forma", não VOs
    inventory.validate(['store_id', 'product_id',]);
    return inventory;
  }

  addStock(quantityToAdd: number): void {
    // Criar VO sem try/catch - deixa InvalidQuantityError subir se inválido
    const addQuantity = new Quantity(quantityToAdd);
    const newQuantity = this.quantity.add(addQuantity);
    if (newQuantity.isGreaterThan(this.max_stock)) {
      throw new Error(`Cannot add stock. Maximum quantity (${this.max_stock.value}) would be exceeded`);
    }
    this.quantity = newQuantity;
    this.updated_at = new Date();
    // Validar apenas campos de "forma" após mudanças
    this.validate();
  }

  removeStock(quantityToRemove: number): void {
    // Criar VO sem try/catch - deixa InvalidQuantityError subir se inválido
    const removeQuantity = new Quantity(quantityToRemove);
    if (!this.quantity.canSubtract(removeQuantity)) {
      throw new Error(`Cannot remove stock. Insufficient quantity available`);
    }
    this.quantity = this.quantity.subtract(removeQuantity);
    this.updated_at = new Date();
    this.validate();
  }

  reserveStock(quantityToReserve: number): void {
    // Criar VO sem try/catch - deixa InvalidQuantityError subir se inválido
    const reserveQuantity = new Quantity(quantityToReserve);
    const availableQuantity = this.quantity.subtract(this.min_stock);
    if (reserveQuantity.isGreaterThan(availableQuantity)) {
      throw new Error(`Cannot reserve stock. Only ${availableQuantity.value} units available for reservation`);
    }
    this.quantity = this.quantity.subtract(reserveQuantity);
    this.updated_at = new Date();
    this.validate();
  }

  updateCostPrice(newCost: number): void {
    // Criar VO sem try/catch - deixa InvalidMoneyError subir se inválido
    this.cost_price = new Money(newCost);
    this.updated_at = new Date();
    this.validate();
  }

  updateUnitPrice(newPrice: number): void {
    // Criar VO sem try/catch - deixa InvalidMoneyError subir se inválido
    this.unit_price = new Money(newPrice);
    this.updated_at = new Date();
    this.validate();
  }

  setLocation(location: string | null): void {
    // Criar VO sem try/catch - deixa InvalidLocationError subir se inválido
    this.location = location ? Location.fromString(location) : null;
    this.updated_at = new Date();
    this.validate();
  }

  setExpiryDate(expiryDate: Date | null): void {
    // Criar VO sem try/catch - deixa InvalidExpiryDateError subir se inválido
    this.expiry_date = expiryDate ? new ExpiryDate(expiryDate) : null;
    this.updated_at = new Date();
    this.validate();
  }

  setSupplier(supplierId: string | null): void {
    // Regra de negócio: Define fornecedor
    this.supplier_id = supplierId;
    this.updated_at = new Date();
  }

  setLocationCode(locationCode: string): void {
    // Alias para compatibilidade com use-cases existentes
    this.setLocation(locationCode);
  }

  setBatchNumber(batchNumber: string | null): void {
    // Regra de negócio: Define número do lote
    this.batch_number = batchNumber;
    this.updated_at = new Date();
  }

  // REGRAS DE NEGÓCIO ESPECÍFICAS DO DOMÍNIO DE SUPERMERCADO

  // Verifica se estoque está baixo (abaixo do mínimo)
  isLowStock(): boolean {
    return this.quantity.isLessThan(this.min_stock) || this.quantity.isEqualTo(this.min_stock);
  }

  // Verifica se estoque está vazio
  isOutOfStock(): boolean {
    return this.quantity.isZero();
  }

  // Verifica se estoque está cheio (próximo ao máximo)
  isFullStock(): boolean {
    const threshold = this.max_stock.multiply(0.9); // 90% do máximo
    return this.quantity.isGreaterThan(threshold) || this.quantity.isEqualTo(threshold);
  }

  // Verifica se produto está vencido
  isExpired(): boolean {
    if (!this.expiry_date) return false;
    return this.expiry_date.isExpired();
  }

  // Verifica se produto está próximo do vencimento (30 dias)
  isNearExpiry(): boolean {
    if (!this.expiry_date) return false;
    return this.expiry_date.isExpiringSoon(30);
  }

  // Calcula margem de lucro
  calculateProfitMargin(): number {
    if (!this.cost_price || !this.unit_price || this.cost_price.isZero()) return 0;
    const profit = this.unit_price.subtract(this.cost_price);
    return (profit.value / this.cost_price.value) * 100;
  }

  // Calcula valor total do estoque
  calculateTotalValue(): number {
    if (!this.cost_price) return 0;
    return this.quantity.value * this.cost_price.value;
  }

  // Calcula valor total de vendas
  calculateTotalSaleValue(): number {
    if (!this.unit_price) return 0;
    return this.quantity.value * this.unit_price.value;
  }

  // Verifica se precisa repor estoque
  needsRestock(): boolean {
    return this.quantity.isLessThan(this.min_stock) || this.quantity.isEqualTo(this.min_stock);
  }

  // Calcula quantidade necessária para reposição
  calculateRestockQuantity(): number {
    if (this.quantity.isGreaterThan(this.max_stock) || this.quantity.isEqualTo(this.max_stock)) {
      return 0;
    }
    return this.max_stock.subtract(this.quantity).value;
  }

  // Verifica se produto é perecível
  isPerishable(): boolean {
    return this.expiry_date !== null;
  }

  // Calcula dias até expiração
  getDaysUntilExpiry(): number | null {
    if (!this.expiry_date) return null;
    return this.expiry_date.daysUntilExpiry();
  }

  // Getters para compatibilidade com código existente
  get location_code(): string | null {
    // Retorna apenas corredor-seção (ex.: A1-B2) para compatibilidade
    return this.location ? this.location.getAisleSectionCode() : null;
  }

  get unit_cost(): number | null {
    return this.cost_price ? this.cost_price.value : null;
  }

  activate(): void {
    this.is_active = true;
    this.updated_at = new Date();
  }

  deactivate(): void {
    this.is_active = false;
    this.updated_at = new Date();
  }

  isActive(): boolean {
    return this.is_active;
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
      quantity: this.quantity.value,
      min_stock: this.min_stock.value,
      max_stock: this.max_stock.value,
      location: this.location ? this.location.toString() : null,
      expiry_date: this.expiry_date ? this.expiry_date.value : null,
      batch_number: this.batch_number,
      supplier_id: this.supplier_id,
      unit_price: this.unit_price ? this.unit_price.value : null,
      cost_price: this.cost_price ? this.cost_price.value : null,
      is_active: this.is_active,
      last_movement_date: this.last_movement_date,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}
