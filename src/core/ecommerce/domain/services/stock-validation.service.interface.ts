import { Uuid } from '../../../shared/domain/value-objects/uuid.vo';
import { Quantity } from '../../../shared/domain/value-objects/quantity.vo';

/**
 * Item de estoque com informações básicas
 */
export type StockItem = {
  product_id: Uuid;
  available_quantity: Quantity;
  reserved_quantity: Quantity;
  minimum_stock: Quantity;
  is_active: boolean;
  expiration_date?: Date;
};

/**
 * Resultado da validação de estoque
 */
export type StockValidationResult = {
  is_valid: boolean;
  errors: StockValidationError[];
  warnings: StockValidationWarning[];
  available_items: Array<{
    product_id: Uuid;
    requested_quantity: Quantity;
    available_quantity: Quantity;
    can_fulfill: boolean;
  }>;
};

/**
 * Erro de validação de estoque
 */
export type StockValidationError = {
  product_id: Uuid;
  error_type: 'insufficient_stock' | 'product_inactive' | 'product_not_found' | 'expired_product';
  message: string;
  requested_quantity: Quantity;
  available_quantity?: Quantity;
};

/**
 * Aviso de validação de estoque
 */
export type StockValidationWarning = {
  product_id: Uuid;
  warning_type: 'low_stock' | 'near_expiration' | 'high_demand';
  message: string;
  details?: any;
};

/**
 * Parâmetros para reserva de estoque
 */
export type StockReservationParams = {
  store_id: string;
  items: Array<{
    product_id: Uuid;
    quantity: Quantity;
  }>;
  reservation_duration_minutes?: number;
  order_id?: string;
  client_id?: string;
};

/**
 * Resultado da reserva de estoque
 */
export type StockReservationResult = {
  success: boolean;
  reservation_id?: string;
  reserved_items: Array<{
    product_id: Uuid;
    reserved_quantity: Quantity;
    reservation_expires_at: Date;
  }>;
  errors: StockValidationError[];
};

/**
 * Interface para validação e gestão de estoque no e-commerce
 * Abstrai a integração com o módulo de inventory
 */
export interface IStockValidationService {
  /**
   * Valida se há estoque suficiente para os itens do pedido
   */
  validateStockAvailability(
    store_id: string,
    items: Array<{
      product_id: Uuid;
      quantity: Quantity;
    }>
  ): Promise<StockValidationResult>;

  /**
   * Reserva estoque temporariamente para um pedido
   * Útil durante o processo de checkout
   */
  reserveStock(params: StockReservationParams): Promise<StockReservationResult>;

  /**
   * Confirma a reserva de estoque (converte em movimentação definitiva)
   */
  confirmStockReservation(
    reservation_id: string,
    order_id: string
  ): Promise<boolean>;

  /**
   * Cancela uma reserva de estoque
   */
  cancelStockReservation(reservation_id: string): Promise<boolean>;

  /**
   * Verifica estoque de um produto específico
   */
  getProductStock(
    store_id: string,
    product_id: Uuid
  ): Promise<StockItem | null>;

  /**
   * Verifica estoque de múltiplos produtos
   */
  getMultipleProductsStock(
    store_id: string,
    product_ids: Uuid[]
  ): Promise<StockItem[]>;

  /**
   * Verifica se um produto está disponível para venda online
   */
  isProductAvailableForOnlineSale(
    store_id: string,
    product_id: Uuid,
    quantity: Quantity
  ): Promise<boolean>;

  /**
   * Obtém produtos com baixo estoque
   */
  getLowStockProducts(
    store_id: string,
    threshold_percentage?: number
  ): Promise<StockItem[]>;

  /**
   * Obtém produtos próximos ao vencimento
   */
  getProductsNearExpiration(
    store_id: string,
    days_ahead?: number
  ): Promise<StockItem[]>;

  /**
   * Calcula quantidade máxima disponível para venda online
   * Considera estoque mínimo e reservas
   */
  getMaxAvailableQuantityForOnlineSale(
    store_id: string,
    product_id: Uuid
  ): Promise<Quantity>;
}

/**
 * Interface para eventos de estoque
 * Permite notificação de mudanças de estoque para o e-commerce
 */
export interface IStockEventHandler {
  /**
   * Notifica quando estoque de um produto muda
   */
  onStockChanged(
    store_id: string,
    product_id: Uuid,
    old_quantity: Quantity,
    new_quantity: Quantity
  ): Promise<void>;

  /**
   * Notifica quando produto fica sem estoque
   */
  onProductOutOfStock(
    store_id: string,
    product_id: Uuid
  ): Promise<void>;

  /**
   * Notifica quando produto volta ao estoque
   */
  onProductBackInStock(
    store_id: string,
    product_id: Uuid,
    new_quantity: Quantity
  ): Promise<void>;

  /**
   * Notifica quando produto está próximo ao vencimento
   */
  onProductNearExpiration(
    store_id: string,
    product_id: Uuid,
    expiration_date: Date,
    days_remaining: number
  ): Promise<void>;
}