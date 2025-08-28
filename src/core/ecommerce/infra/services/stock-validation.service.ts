import { 
  IStockValidationService, 
  StockValidationItem, 
  StockValidationResult,
  StockValidationError
} from '../../domain/stock-validation.service.interface';
import { IInventoryRepository } from '../../../inventory/domain/repositories/inventory.repository.interface';

export class StockValidationService implements IStockValidationService {
  private reservations: Map<string, StockValidationItem[]> = new Map();

  constructor(private readonly inventoryRepo: IInventoryRepository) {}

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
      const inventoryItems = await this.inventoryRepo.findByProduct(store_id, item.product_id);
      
      // Somar todas as quantidades disponíveis para o produto (diferentes lotes/localizações)
      const totalAvailableStock = inventoryItems
        .filter(inv => inv.is_active) // Apenas itens ativos
        .reduce((total, inv) => total + inv.quantity.value, 0);
      
      // Subtrair reservas existentes
      const reservedQuantity = this.getReservedQuantity(store_id, item.product_id);
      const availableStock = Math.max(0, totalAvailableStock - reservedQuantity);
      
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
    
    // Armazenar reserva
    this.reservations.set(reservation_id, items.map(item => ({ ...item, store_id } as any)));
  }

  async releaseReservation(reservation_id: string): Promise<void> {
    const reservation = this.reservations.get(reservation_id);
    
    if (!reservation) {
      throw new Error(`Reserva ${reservation_id} não encontrada`);
    }
    
    // Remover reserva
    this.reservations.delete(reservation_id);
  }

  private getReservedQuantity(store_id: string, product_id: string): number {
    let totalReserved = 0;
    
    for (const [, reservation] of this.reservations) {
      for (const item of reservation) {
        const itemWithStore = item as any;
        if (itemWithStore.store_id === store_id && item.product_id === product_id) {
          totalReserved += item.quantity;
        }
      }
    }
    
    return totalReserved;
  }

  // Métodos auxiliares para testes e debugging
  clearAllReservations(): void {
    this.reservations.clear();
  }

  getReservations(): Map<string, StockValidationItem[]> {
    return new Map(this.reservations);
  }
}