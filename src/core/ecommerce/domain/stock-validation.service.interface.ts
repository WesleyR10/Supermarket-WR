export interface StockValidationItem {
  product_id: string;
  quantity: number;
}

export interface StockValidationResult {
  is_valid: boolean;
  errors: StockValidationError[];
}

export interface StockValidationError {
  product_id: string;
  requested_quantity: number;
  available_quantity: number;
  message: string;
}

export interface IStockValidationService {
  /**
   * Valida se há estoque suficiente para os itens solicitados
   * @param store_id ID da loja para verificar o estoque
   * @param items Lista de itens para validar
   * @throws Error se não houver estoque suficiente
   */
  validateStock(store_id: string, items: StockValidationItem[]): Promise<void>;

  /**
   * Verifica disponibilidade de estoque sem lançar exceção
   * @param store_id ID da loja para verificar o estoque
   * @param items Lista de itens para validar
   * @returns Resultado da validação com detalhes dos erros
   */
  checkStockAvailability(store_id: string, items: StockValidationItem[]): Promise<StockValidationResult>;

  /**
   * Reserva estoque para os itens especificados
   * @param store_id ID da loja
   * @param items Lista de itens para reservar
   * @param reservation_id ID único da reserva
   */
  reserveStock(store_id: string, items: StockValidationItem[], reservation_id: string): Promise<void>;

  /**
   * Libera reserva de estoque
   * @param reservation_id ID da reserva a ser liberada
   */
  releaseReservation(reservation_id: string): Promise<void>;
}