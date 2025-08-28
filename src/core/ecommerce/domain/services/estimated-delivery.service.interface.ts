import { DeliveryAddress } from '../online-order.aggregate';

export interface DeliveryCalculationParams {
  delivery_address: DeliveryAddress;
  store_id: string;
  tenant_id: string;
  requested_delivery_time?: Date;
  is_scheduled?: boolean;
  delivery_shift?: 'morning' | 'afternoon' | 'evening';
}

export interface DeliveryTimeEstimate {
  estimated_delivery: Date;
  delivery_window_start?: Date;
  delivery_window_end?: Date;
  is_express?: boolean;
  delivery_notes?: string;
}

export interface IEstimatedDeliveryService {
  /**
   * Calcula o tempo estimado de entrega baseado nas regras da empresa
   * @param params Parâmetros para cálculo do delivery
   * @returns Estimativa de tempo de entrega
   */
  calculateEstimatedDelivery(params: DeliveryCalculationParams): Promise<DeliveryTimeEstimate>;

  /**
   * Verifica se um horário de entrega está disponível
   * @param params Parâmetros para verificação
   * @returns Se o horário está disponível
   */
  isDeliveryTimeAvailable(params: DeliveryCalculationParams): Promise<boolean>;

  /**
   * Obtém os turnos disponíveis para entrega em uma data específica
   * @param date Data para verificar turnos
   * @param store_id ID da loja
   * @param tenant_id ID do tenant
   * @returns Lista de turnos disponíveis
   */
  getAvailableDeliveryShifts(date: Date, store_id: string, tenant_id: string): Promise<string[]>;
}