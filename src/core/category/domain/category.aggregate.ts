import { AggregateRoot } from '../../shared/domain/aggregate-root';
import { ValueObject } from '../../shared/domain/value-object';
import { Uuid } from '../../shared/domain/value-objects/uuid.vo';
import { CategoryFakeBuilder } from './category-fake.builder';
import { CategoryValidatorFactory } from './category.validator';

export type CategoryConstructorProps = {
  category_id?: CategoryId;
  store_id: string;
  name: string;
  description?: string | null;
  is_active?: boolean;
  
  // Campos específicos do domínio de supermercado
  parent_category_id?: CategoryId | null;
  tax_rate?: number | null; // Alíquota de imposto específica da categoria
  default_margin_percentage?: number | null; // Margem padrão para precificação
  requires_expiry_date?: boolean; // Se produtos desta categoria precisam de validade
  display_order?: number; // Ordem de exibição no sistema/site
  icon_name?: string | null; // Nome do ícone para exibição
  created_at?: Date;
  updated_at?: Date;
};

export type CategoryCreateCommand = {
  name: string;
  store_id: string;
  description?: string | null;
  is_active?: boolean;
  parent_category_id?: string | null;
  tax_rate?: number | null;
  default_margin_percentage?: number | null;
  requires_expiry_date?: boolean;
  display_order?: number;
  icon_name?: string | null;
};

export class CategoryId extends Uuid {}

export class Category extends AggregateRoot {
  category_id: CategoryId;
  store_id: string;
  name: string;
  description: string | null;
  is_active: boolean;

  // Campos específicos do domínio de supermercado
  parent_category_id: CategoryId | null;
  tax_rate: number | null; // Percentual de imposto (ex: 18.5 para 18.5%)
  default_margin_percentage: number | null; // Margem padrão (ex: 30.0 para 30%)
  requires_expiry_date: boolean; // true para perecíveis, false para não-perecíveis
  display_order: number; // Para ordenação na interface
  icon_name: string | null; // Para interface gráfica
  created_at: Date;
  updated_at: Date;

  constructor(props: CategoryConstructorProps) {
    super();
    this.category_id = props.category_id ?? new CategoryId();
    this.store_id = props.store_id;
    this.name = props.name;
    this.description = props.description ?? null;
    this.is_active = props.is_active ?? true;
    
    // Campos específicos do supermercado
    this.parent_category_id = props.parent_category_id ?? null;
    this.tax_rate = props.tax_rate ?? null;
    this.default_margin_percentage = props.default_margin_percentage ?? null;
    this.requires_expiry_date = props.requires_expiry_date ?? false;
    this.display_order = props.display_order ?? 0;
    this.icon_name = props.icon_name ?? null;
    
    this.created_at = props.created_at ?? new Date();
    this.updated_at = props.updated_at ?? new Date();
  }

  get entity_id(): ValueObject {
    return this.category_id;
  }

  static create(props: CategoryCreateCommand): Category {
    const category = new Category({
      ...props,
      parent_category_id: props.parent_category_id ? new CategoryId(props.parent_category_id) : null,
    });
    category.validate(['name', 'store_id']);
    return category;
  }

  changeName(name: string): void {
    this.name = name;
    this.updated_at = new Date();
    this.validate(['name']);
  }

  changeDescription(description: string | null): void {
    this.description = description;
    this.updated_at = new Date();
  }

  // Métodos específicos do domínio de supermercado
  // APENAS REGRAS DE NEGÓCIO - sem validações de sintaxe
  
  setParentCategory(parentCategoryId: CategoryId | null): void {
    this.parent_category_id = parentCategoryId;
    this.updated_at = new Date();
  }

  updateTaxRate(taxRate: number | null): void {
    // Regra de negócio: Tax rate é definido pela categoria
    this.tax_rate = taxRate;
    this.updated_at = new Date();
    this.validate(['tax_rate']);
  }

  updateDefaultMargin(marginPercentage: number | null): void {
    // Regra de negócio: Margem padrão é definida pela categoria
    this.default_margin_percentage = marginPercentage;
    this.updated_at = new Date();
    this.validate(['default_margin_percentage']);
  }

  setRequiresExpiryDate(requires: boolean): void {
    // Regra de negócio: Controle de validade é definido pela categoria
    this.requires_expiry_date = requires;
    this.updated_at = new Date();
    this.validate(['requires_expiry_date']);
  }

  updateDisplayOrder(order: number): void {
    // Regra de negócio: Ordem de exibição é definida pela categoria
    this.display_order = order;
    this.updated_at = new Date();
    this.validate(['display_order']);
  }

  setIcon(iconName: string | null): void {
    // Regra de negócio: Ícone é definido pela categoria
    this.icon_name = iconName;
    this.updated_at = new Date();
    this.validate(['icon_name']);
  }

  activate() {
    this.is_active = true;
    this.updated_at = new Date();
  }

  deactivate() {
    this.is_active = false;
    this.updated_at = new Date();
  }

  // REGRAS DE NEGÓCIO ESPECÍFICAS DO SUPERMERCADO

  // Verifica se é uma categoria raiz (sem parent)
  isRootCategory(): boolean {
    return this.parent_category_id === null;
  }

  // Verifica se é uma categoria que requer controle de validade
  needsExpiryControl(): boolean {
    return this.requires_expiry_date;
  }

  // Calcula preço sugerido baseado na margem padrão
  calculateSuggestedPrice(costPrice: number): number | null {
    if (!this.default_margin_percentage || costPrice <= 0) {
      return null;
    }
    
    return costPrice * (1 + this.default_margin_percentage / 100);
  }

  // Regra de negócio: Verifica se categoria é perecível baseado no nome
  isPerishableCategory(): boolean {
    const perishableKeywords = ['carnes', 'laticínios', 'hortifruti', 'padaria', 'congelados', 'bebidas'];
    return perishableKeywords.some(keyword => 
      this.name.toLowerCase().includes(keyword)
    );
  }

  // Regra de negócio: Verifica se categoria deve ter tax rate obrigatório
  shouldHaveTaxRate(): boolean {
    // Categorias que normalmente têm ICMS específico no Brasil
    const taxableKeywords = ['bebidas', 'eletrônicos', 'utilidades', 'limpeza'];
    return taxableKeywords.some(keyword => 
      this.name.toLowerCase().includes(keyword)
    );
  }

  // Regra de negócio: Verifica se categoria é adequada para promoções
  isPromotionEligible(): boolean {
    // Categorias que podem ter promoções (não medicamentos, por exemplo)
    const nonPromotionKeywords = ['medicamentos', 'farmácia', 'prescrição'];
    return !nonPromotionKeywords.some(keyword => 
      this.name.toLowerCase().includes(keyword)
    );
  }

  prepareForDeletion(subcategories: Category[], store_id: string) {
    if (this.store_id !== store_id) {
      this.notification.addError('Category does not belong to this store');
    }
    if (subcategories.length > 0) {
      this.notification.addError('Cannot delete category with subcategories');
    }
    // Aqui poderia marcar como deletado se for soft delete
  }

  validate(fields?: string[]) {
    const validator = CategoryValidatorFactory.create();
    return validator.validate(this.notification, this, fields);
  }

  static fake() {
    return CategoryFakeBuilder;
  }

  toJSON() {
    return {
      category_id: this.category_id.id,
      store_id: this.store_id,
      name: this.name,
      description: this.description,
      is_active: this.is_active,
      parent_category_id: this.parent_category_id ? this.parent_category_id.id : null,
      tax_rate: this.tax_rate,
      default_margin_percentage: this.default_margin_percentage,
      requires_expiry_date: this.requires_expiry_date,
      display_order: this.display_order,
      icon_name: this.icon_name,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}