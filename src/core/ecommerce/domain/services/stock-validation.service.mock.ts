import { Uuid } from '../../../shared/domain/value-objects/uuid.vo';
import { Quantity } from '../../../shared/domain/value-objects/quantity.vo';
import {
  IStockValidationService,
  IStockEventHandler,
  StockItem,
  StockValidationResult,
  StockValidationError,
  StockValidationWarning,
  StockReservationParams,
  StockReservationResult,
} from './stock-validation.service.interface';

/**
 * Mock implementation do serviço de validação de estoque
 * Simula comportamentos para desenvolvimento e testes
 */
export class MockStockValidationService implements IStockValidationService {
  private mockStock: Map<string, StockItem> = new Map();
  private reservations: Map<string, any> = new Map();
  private reservationCounter = 1;

  constructor() {
    this.initializeMockData();
  }

  private initializeMockData(): void {
    // Simula alguns produtos em estoque
    const products = [
      { id: '123e4567-e89b-12d3-a456-426614174001', quantity: 100, min_stock: 10 },
      { id: '123e4567-e89b-12d3-a456-426614174002', quantity: 50, min_stock: 5 },
      { id: '123e4567-e89b-12d3-a456-426614174003', quantity: 5, min_stock: 10 }, // Baixo estoque
      { id: '123e4567-e89b-12d3-a456-426614174004', quantity: 0, min_stock: 5 }, // Sem estoque
    ];

    // Adiciona produtos para múltiplas lojas para suportar diferentes store_ids
    const storeIds = ['store1', '123e4567-e89b-12d3-a456-426614174000'];
    
    products.forEach(product => {
      const stockItem: StockItem = {
        product_id: new Uuid(product.id),
        available_quantity: new Quantity(product.quantity),
        reserved_quantity: new Quantity(0),
        minimum_stock: new Quantity(product.min_stock),
        is_active: true,
        expiration_date: product.quantity > 0 ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : undefined,
      };
      
      // Adiciona o mesmo produto para todas as lojas
      storeIds.forEach(storeId => {
        this.mockStock.set(`${storeId}_${product.id}`, stockItem);
      });
    });
  }

  async validateStockAvailability(
    store_id: string,
    items: Array<{ product_id: Uuid; quantity: Quantity }>
  ): Promise<StockValidationResult> {
    const errors: StockValidationError[] = [];
    const warnings: StockValidationWarning[] = [];
    const available_items: any[] = [];

    for (const item of items) {
      const stockKey = `${store_id}_${item.product_id.id}`;
      const stockItem = this.mockStock.get(stockKey);

      if (!stockItem) {
        errors.push({
          product_id: item.product_id,
          error_type: 'product_not_found',
          message: `Produto ${item.product_id.id} não encontrado no estoque`,
          requested_quantity: item.quantity,
        });
        continue;
      }

      if (!stockItem.is_active) {
        errors.push({
          product_id: item.product_id,
          error_type: 'product_inactive',
          message: `Produto ${item.product_id.id} está inativo`,
          requested_quantity: item.quantity,
          available_quantity: stockItem.available_quantity,
        });
        continue;
      }

      const availableForSale = stockItem.available_quantity.value - stockItem.reserved_quantity.value;
      const canFulfill = availableForSale >= item.quantity.value;

      if (!canFulfill) {
        errors.push({
          product_id: item.product_id,
          error_type: 'insufficient_stock',
          message: `Estoque insuficiente para produto ${item.product_id.id}. Disponível: ${availableForSale}, Solicitado: ${item.quantity.value}`,
          requested_quantity: item.quantity,
          available_quantity: new Quantity(availableForSale),
        });
      }

      // Verifica se está com baixo estoque
      if (availableForSale <= stockItem.minimum_stock.value * 1.2) {
        warnings.push({
          product_id: item.product_id,
          warning_type: 'low_stock',
          message: `Produto ${item.product_id.id} com estoque baixo`,
          details: { available: availableForSale, minimum: stockItem.minimum_stock.value },
        });
      }

      // Verifica se está próximo ao vencimento
      if (stockItem.expiration_date) {
        const daysToExpiration = Math.ceil(
          (stockItem.expiration_date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        if (daysToExpiration <= 7) {
          warnings.push({
            product_id: item.product_id,
            warning_type: 'near_expiration',
            message: `Produto ${item.product_id.id} próximo ao vencimento (${daysToExpiration} dias)`,
            details: { expiration_date: stockItem.expiration_date, days_remaining: daysToExpiration },
          });
        }
      }

      available_items.push({
        product_id: item.product_id,
        requested_quantity: item.quantity,
        available_quantity: new Quantity(availableForSale),
        can_fulfill: canFulfill,
      });
    }

    return {
      is_valid: errors.length === 0,
      errors,
      warnings,
      available_items,
    };
  }

  async reserveStock(params: StockReservationParams): Promise<StockReservationResult> {
    const validation = await this.validateStockAvailability(params.store_id, params.items);
    
    if (!validation.is_valid) {
      return {
        success: false,
        reserved_items: [],
        errors: validation.errors,
      };
    }

    const reservationId = `reservation_${this.reservationCounter++}`;
    const expiresAt = new Date(Date.now() + (params.reservation_duration_minutes || 30) * 60 * 1000);
    const reservedItems: any[] = [];

    // Simula a reserva
    for (const item of params.items) {
      const stockKey = `${params.store_id}_${item.product_id.id}`;
      const stockItem = this.mockStock.get(stockKey);
      
      if (stockItem) {
        stockItem.reserved_quantity = new Quantity(
          stockItem.reserved_quantity.value + item.quantity.value
        );
        
        reservedItems.push({
          product_id: item.product_id,
          reserved_quantity: item.quantity,
          reservation_expires_at: expiresAt,
        });
      }
    }

    this.reservations.set(reservationId, {
      store_id: params.store_id,
      items: params.items,
      expires_at: expiresAt,
      order_id: params.order_id,
      client_id: params.client_id,
    });

    return {
      success: true,
      reservation_id: reservationId,
      reserved_items: reservedItems,
      errors: [],
    };
  }

  async confirmStockReservation(reservation_id: string, order_id: string): Promise<boolean> {
    const reservation = this.reservations.get(reservation_id);
    if (!reservation) return false;

    // Simula confirmação da reserva (movimentação definitiva)
    for (const item of reservation.items) {
      const stockKey = `${reservation.store_id}_${item.product_id.value}`;
      const stockItem = this.mockStock.get(stockKey);
      
      if (stockItem) {
        stockItem.available_quantity = new Quantity(
          stockItem.available_quantity.value - item.quantity.value
        );
        stockItem.reserved_quantity = new Quantity(
          stockItem.reserved_quantity.value - item.quantity.value
        );
      }
    }

    this.reservations.delete(reservation_id);
    return true;
  }

  async cancelStockReservation(reservation_id: string): Promise<boolean> {
    const reservation = this.reservations.get(reservation_id);
    if (!reservation) return false;

    // Libera a reserva
    for (const item of reservation.items) {
      const stockKey = `${reservation.store_id}_${item.product_id.value}`;
      const stockItem = this.mockStock.get(stockKey);
      
      if (stockItem) {
        stockItem.reserved_quantity = new Quantity(
          stockItem.reserved_quantity.value - item.quantity.value
        );
      }
    }

    this.reservations.delete(reservation_id);
    return true;
  }

  async getProductStock(store_id: string, product_id: Uuid): Promise<StockItem | null> {
    const stockKey = `${store_id}_${product_id.id}`;
    return this.mockStock.get(stockKey) || null;
  }

  async getMultipleProductsStock(store_id: string, product_ids: Uuid[]): Promise<StockItem[]> {
    const stocks: StockItem[] = [];
    
    for (const product_id of product_ids) {
      const stock = await this.getProductStock(store_id, product_id);
      if (stock) {
        stocks.push(stock);
      }
    }
    
    return stocks;
  }

  async isProductAvailableForOnlineSale(
    store_id: string,
    product_id: Uuid,
    quantity: Quantity
  ): Promise<boolean> {
    const validation = await this.validateStockAvailability(store_id, [
      { product_id, quantity }
    ]);
    
    return validation.is_valid;
  }

  async getLowStockProducts(
    store_id: string,
    threshold_percentage: number = 20
  ): Promise<StockItem[]> {
    const lowStockProducts: StockItem[] = [];
    
    for (const [key, stockItem] of this.mockStock.entries()) {
      if (key.startsWith(store_id)) {
        const availableForSale = stockItem.available_quantity.value - stockItem.reserved_quantity.value;
        const threshold = stockItem.minimum_stock.value * (1 + threshold_percentage / 100);
        
        if (availableForSale <= threshold) {
          lowStockProducts.push(stockItem);
        }
      }
    }
    
    return lowStockProducts;
  }

  async getProductsNearExpiration(
    store_id: string,
    days_ahead: number = 7
  ): Promise<StockItem[]> {
    const nearExpirationProducts: StockItem[] = [];
    const cutoffDate = new Date(Date.now() + days_ahead * 24 * 60 * 60 * 1000);
    
    for (const [key, stockItem] of this.mockStock.entries()) {
      if (key.startsWith(store_id) && stockItem.expiration_date) {
        if (stockItem.expiration_date <= cutoffDate) {
          nearExpirationProducts.push(stockItem);
        }
      }
    }
    
    return nearExpirationProducts;
  }

  async getMaxAvailableQuantityForOnlineSale(
    store_id: string,
    product_id: Uuid
  ): Promise<Quantity> {
    const stockItem = await this.getProductStock(store_id, product_id);
    
    if (!stockItem || !stockItem.is_active) {
      return new Quantity(0);
    }
    
    const availableForSale = Math.max(
      0,
      stockItem.available_quantity.value - stockItem.reserved_quantity.value - stockItem.minimum_stock.value
    );
    
    return new Quantity(availableForSale);
  }
}

/**
 * Mock implementation do handler de eventos de estoque
 */
export class MockStockEventHandler implements IStockEventHandler {
  private eventLog: Array<{ event: string; data: any; timestamp: Date }> = [];

  async onStockChanged(
    store_id: string,
    product_id: Uuid,
    old_quantity: Quantity,
    new_quantity: Quantity
  ): Promise<void> {
    this.eventLog.push({
      event: 'stock_changed',
      data: { store_id, product_id: product_id.id, old_quantity: old_quantity.value, new_quantity: new_quantity.value },
      timestamp: new Date(),
    });
    
    console.log(`[MOCK] Estoque alterado - Loja: ${store_id}, Produto: ${product_id.id}, De: ${old_quantity.value} Para: ${new_quantity.value}`);
  }

  async onProductOutOfStock(store_id: string, product_id: Uuid): Promise<void> {
    this.eventLog.push({
      event: 'product_out_of_stock',
      data: { store_id, product_id: product_id.id },
      timestamp: new Date(),
    });
    
    console.log(`[MOCK] Produto sem estoque - Loja: ${store_id}, Produto: ${product_id.id}`);
  }

  async onProductBackInStock(
    store_id: string,
    product_id: Uuid,
    new_quantity: Quantity
  ): Promise<void> {
    this.eventLog.push({
      event: 'product_back_in_stock',
      data: { store_id, product_id: product_id.id, new_quantity: new_quantity.value },
      timestamp: new Date(),
    });
    
    console.log(`[MOCK] Produto voltou ao estoque - Loja: ${store_id}, Produto: ${product_id.id}, Quantidade: ${new_quantity.value}`);
  }

  async onProductNearExpiration(
    store_id: string,
    product_id: Uuid,
    expiration_date: Date,
    days_remaining: number
  ): Promise<void> {
    this.eventLog.push({
      event: 'product_near_expiration',
      data: { store_id, product_id: product_id.id, expiration_date, days_remaining },
      timestamp: new Date(),
    });
    
    console.log(`[MOCK] Produto próximo ao vencimento - Loja: ${store_id}, Produto: ${product_id.id}, Vence em: ${days_remaining} dias`);
  }

  getEventLog(): Array<{ event: string; data: any; timestamp: Date }> {
    return [...this.eventLog];
  }

  clearEventLog(): void {
    this.eventLog = [];
  }
}