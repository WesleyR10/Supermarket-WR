import { 
  IStockValidationService, 
  StockValidationItem, 
  StockValidationResult,
  StockValidationError
} from '../../domain/stock-validation.service.interface';

export class MockStockValidationService implements IStockValidationService {
  private stockData: Map<string, Map<string, number>> = new Map();
  private reservations: Map<string, StockValidationItem[]> = new Map();

  constructor() {
    // Dados de estoque mock para testes
    this.setStockData('store-1', 'product-1', 100);
    this.setStockData('store-1', 'product-2', 50);
    this.setStockData('store-1', 'product-3', 0);
    this.setStockData('store-2', 'product-1', 200);
  }

  setStockData(storeId: string, productId: string, quantity: number): void {
    if (!this.stockData.has(storeId)) {
      this.stockData.set(storeId, new Map());
    }
    this.stockData.get(storeId)!.set(productId, quantity);
  }

  getAvailableStock(storeId: string, productId: string): number {
    return this.stockData.get(storeId)?.get(productId) || 0;
  }

  async validateStock(store_id: string, items: StockValidationItem[]): Promise<void> {
    const result = await this.checkStockAvailability(store_id, items);
    
    if (!result.is_valid) {
      const errorMessages = result.errors.map(error => error.message).join('; ');
      throw new Error(`Estoque insuficiente: ${errorMessages}`);
    }
  }

  async checkStockAvailability(store_id: string, items: StockValidationItem[]): Promise<StockValidationResult> {
    const errors: StockValidationError[] = [];
    
    for (const item of items) {
      const availableStock = this.getAvailableStock(store_id, item.product_id);
      
      if (availableStock < item.quantity) {
        errors.push({
          product_id: item.product_id,
          requested_quantity: item.quantity,
          available_quantity: availableStock,
          message: `Produto ${item.product_id}: solicitado ${item.quantity}, disponível ${availableStock}`
        });
      }
    }

    return {
      is_valid: errors.length === 0,
      errors
    };
  }

  async reserveStock(store_id: string, items: StockValidationItem[], reservation_id: string): Promise<void> {
    // Validar estoque antes de reservar
    await this.validateStock(store_id, items);
    
    // Reduzir estoque disponível
    for (const item of items) {
      const currentStock = this.getAvailableStock(store_id, item.product_id);
      this.setStockData(store_id, item.product_id, currentStock - item.quantity);
    }
    
    // Armazenar reserva
    this.reservations.set(reservation_id, items.map(item => ({ ...item, store_id })));
  }

  async releaseReservation(reservation_id: string): Promise<void> {
    const reservation = this.reservations.get(reservation_id);
    
    if (!reservation) {
      throw new Error(`Reserva ${reservation_id} não encontrada`);
    }
    
    // Restaurar estoque
    for (const item of reservation) {
      const storeId = (item as any).store_id;
      const currentStock = this.getAvailableStock(storeId, item.product_id);
      this.setStockData(storeId, item.product_id, currentStock + item.quantity);
    }
    
    // Remover reserva
    this.reservations.delete(reservation_id);
  }

  // Métodos auxiliares para testes
  clearAllStock(): void {
    this.stockData.clear();
  }

  clearAllReservations(): void {
    this.reservations.clear();
  }

  getReservations(): Map<string, StockValidationItem[]> {
    return new Map(this.reservations);
  }
}