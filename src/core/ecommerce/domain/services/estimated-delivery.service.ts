import { Injectable } from '@nestjs/common';
import {
  IEstimatedDeliveryService,
  DeliveryCalculationParams,
  DeliveryTimeEstimate,
} from './estimated-delivery.service.interface';
import {
  IGeolocationService,
  IDistanceCalculator,
  IDeliveryAreaService,
  Coordinates
} from './geolocation.service.interface';
import { DeliveryAddress } from '../online-order.aggregate';

@Injectable()
export class EstimatedDeliveryService implements IEstimatedDeliveryService {
  constructor(
    private readonly geolocationService?: IGeolocationService,
    private readonly distanceCalculator?: IDistanceCalculator,
    private readonly deliveryAreaService?: IDeliveryAreaService
  ) {}
  /**
   * Calcula o tempo estimado de entrega baseado nas regras da empresa
   * TODO: Implementar integração com APIs de geolocalização e configurações da empresa
   */
  async calculateEstimatedDelivery(
    params: DeliveryCalculationParams,
  ): Promise<DeliveryTimeEstimate> {
    const {
      delivery_address,
      store_id,
      tenant_id,
      requested_delivery_time,
      is_scheduled,
      delivery_shift,
    } = params;

    // Tempo base de preparação (em minutos)
    const basePreparationTime = 30;

    // Tempo estimado de entrega baseado na distância (simulado)
    const estimatedDeliveryTime = await this.calculateDeliveryTimeByDistance(
      delivery_address,
      store_id,
      tenant_id,
    );

    let estimated_delivery: Date;
    let delivery_window_start: Date | undefined;
    let delivery_window_end: Date | undefined;
    let is_express = false;
    let delivery_notes: string | undefined;

    if (is_scheduled && requested_delivery_time) {
      // Entrega agendada
      estimated_delivery = requested_delivery_time;
      delivery_window_start = new Date(requested_delivery_time.getTime() - 30 * 60 * 1000); // 30 min antes
      delivery_window_end = new Date(requested_delivery_time.getTime() + 30 * 60 * 1000); // 30 min depois
      delivery_notes = 'Entrega agendada';
    } else if (delivery_shift) {
      // Entrega por turno
      const shiftTimes = this.getShiftDeliveryTimes(delivery_shift);
      estimated_delivery = shiftTimes.start;
      delivery_window_start = shiftTimes.start;
      delivery_window_end = shiftTimes.end;
      delivery_notes = `Entrega no turno: ${delivery_shift}`;
    } else {
      // Entrega normal - tempo atual + preparação + entrega
      const totalMinutes = basePreparationTime + estimatedDeliveryTime;
      estimated_delivery = new Date(Date.now() + totalMinutes * 60 * 1000);
      
      // Se for menos de 60 minutos, é express
      if (totalMinutes <= 60) {
        is_express = true;
        delivery_notes = 'Entrega expressa';
      }
    }

    return {
      estimated_delivery,
      delivery_window_start,
      delivery_window_end,
      is_express,
      delivery_notes,
    };
  }

  /**
   * Verifica se um horário de entrega está disponível
   */
  async isDeliveryTimeAvailable(
    params: DeliveryCalculationParams,
  ): Promise<boolean> {
    const { requested_delivery_time, delivery_shift, store_id, tenant_id } = params;

    if (!requested_delivery_time && !delivery_shift) {
      return true; // Entrega normal sempre disponível
    }

    if (delivery_shift) {
      const availableShifts = await this.getAvailableDeliveryShifts(
        new Date(),
        store_id,
        tenant_id,
      );
      return availableShifts.includes(delivery_shift);
    }

    if (requested_delivery_time) {
      // Verificar se o horário está dentro do horário de funcionamento
      const hour = requested_delivery_time.getHours();
      return hour >= 8 && hour <= 22; // Horário de funcionamento: 8h às 22h
    }

    return false;
  }

  /**
   * Obtém os turnos disponíveis para entrega
   */
  async getAvailableDeliveryShifts(
    date: Date,
    store_id: string,
    tenant_id: string,
  ): Promise<string[]> {
    // TODO: Implementar lógica baseada na configuração da empresa e capacidade de entrega
    const dayOfWeek = date.getDay();
    const hour = date.getHours();

    const shifts: string[] = [];

    // Verificar se é dia útil (segunda a sábado)
    if (dayOfWeek >= 1 && dayOfWeek <= 6) {
      if (hour < 12) shifts.push('morning', 'afternoon', 'evening');
      else if (hour < 17) shifts.push('afternoon', 'evening');
      else if (hour < 18) shifts.push('evening'); // Mudança: limite para 18h
    }
    // Domingo - apenas manhã e tarde
    else if (dayOfWeek === 0) {
      if (hour < 12) shifts.push('morning', 'afternoon');
      else if (hour < 17) shifts.push('afternoon');
    }

    return shifts;
  }

  /**
   * Calcula tempo de entrega baseado na distância
   * Usa interfaces de geolocalização quando disponíveis, senão fallback para lógica CEP
   */
  private async calculateDeliveryTimeByDistance(
    delivery_address: any,
    store_id: string,
    tenant_id: string,
  ): Promise<number> {
    // Se os serviços de geolocalização estão disponíveis, usa cálculo preciso
    if (this.distanceCalculator && this.deliveryAreaService) {
      try {
        const deliveryAddr = this.convertToDeliveryAddress(delivery_address);
        const storeLocation = await this.getStoreLocation(store_id);
        
        if (storeLocation && deliveryAddr) {
          const distanceResult = await this.distanceCalculator.calculateDeliveryDistance(
            storeLocation,
            deliveryAddr,
            { consider_traffic: true, transport_mode: 'driving' }
          );
          
          if (distanceResult) {
            // Adiciona tempo de preparação ao tempo de rota
            return distanceResult.estimated_time_minutes + 15; // 15 min preparação
          }
        }
      } catch (error) {
        // Em caso de erro, usa fallback
        console.warn('Erro no cálculo de distância, usando fallback:', error);
      }
    }

    // Fallback: Simulação baseada no CEP (primeiros dígitos)
    const zipCode = delivery_address.zip_code.replace(/\D/g, '');
    const firstDigits = parseInt(zipCode.substring(0, 2));

    // Lógica simplificada baseada na região do CEP
    if (firstDigits >= 1 && firstDigits <= 5) {
      return 20; // Região próxima - 20 minutos
    } else if (firstDigits >= 6 && firstDigits <= 15) {
      return 35; // Região média - 35 minutos
    } else {
      return 50; // Região distante - 50 minutos
    }
  }

  /**
   * Converte endereço genérico para DeliveryAddress
   */
  private convertToDeliveryAddress(address: any): DeliveryAddress | null {
    try {
      return DeliveryAddress.create({
        street: address.street || '',
        number: address.number || '',
        complement: address.complement,
        neighborhood: address.neighborhood || '',
        city: address.city || '',
        state: address.state || '',
        zip_code: address.zip_code || '',
        latitude: address.latitude,
        longitude: address.longitude
      });
    } catch (error) {
      return null;
    }
  }

  /**
   * Obtém localização da loja (mock - futuramente vir do banco)
   */
  private async getStoreLocation(store_id: string): Promise<Coordinates | null> {
    // Mock de coordenadas de lojas
    const storeLocations: Record<string, Coordinates> = {
      'store-123': { latitude: -23.5505, longitude: -46.6333 }, // São Paulo
      'store-456': { latitude: -22.9068, longitude: -43.1729 }, // Rio de Janeiro
      'store-789': { latitude: -19.9167, longitude: -43.9345 }, // Belo Horizonte
    };
    
    return storeLocations[store_id] || null;
  }

  /**
   * Verifica se endereço está na área de entrega
   */
  async isAddressInDeliveryArea(
    delivery_address: any,
    store_id: string
  ): Promise<boolean> {
    if (this.deliveryAreaService) {
      try {
        const deliveryAddr = this.convertToDeliveryAddress(delivery_address);
        if (deliveryAddr) {
          return await this.deliveryAreaService.isAddressInDeliveryArea(store_id, deliveryAddr);
        }
      } catch (error) {
        console.warn('Erro na verificação de área de entrega:', error);
      }
    }
    
    // Fallback: validação básica por CEP
    const zipCode = delivery_address.zip_code?.replace(/\D/g, '') || '';
    const firstDigits = parseInt(zipCode.substring(0, 2));
    return firstDigits >= 1 && firstDigits <= 20; // CEPs válidos para entrega
  }

  /**
   * Calcula taxa de entrega baseada na distância
   */
  async calculateDeliveryFee(
    delivery_address: any,
    store_id: string
  ): Promise<number> {
    if (this.deliveryAreaService && this.distanceCalculator) {
      try {
        const deliveryAddr = this.convertToDeliveryAddress(delivery_address);
        const storeLocation = await this.getStoreLocation(store_id);
        
        if (deliveryAddr && storeLocation) {
          const distanceResult = await this.distanceCalculator.calculateDeliveryDistance(
            storeLocation,
            deliveryAddr
          );
          
          if (distanceResult) {
            return await this.deliveryAreaService.calculateDeliveryFee(
              store_id,
              distanceResult.distance_km
            );
          }
        }
      } catch (error) {
        console.warn('Erro no cálculo de taxa de entrega:', error);
      }
    }
    
    // Fallback: taxa fixa baseada na região
    const zipCode = delivery_address.zip_code?.replace(/\D/g, '') || '';
    const firstDigits = parseInt(zipCode.substring(0, 2));
    
    if (firstDigits >= 1 && firstDigits <= 5) {
      return 5.00; // Região próxima
    } else if (firstDigits >= 6 && firstDigits <= 15) {
      return 8.00; // Região média
    } else {
      return 12.00; // Região distante
    }
  }

  /**
   * Obtém horários de entrega por turno
   */
  private getShiftDeliveryTimes(shift: string): { start: Date; end: Date } {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    switch (shift) {
      case 'morning':
        return {
          start: new Date(tomorrow.setHours(8, 0, 0, 0)),
          end: new Date(tomorrow.setHours(12, 0, 0, 0)),
        };
      case 'afternoon':
        return {
          start: new Date(tomorrow.setHours(13, 0, 0, 0)),
          end: new Date(tomorrow.setHours(17, 0, 0, 0)),
        };
      case 'evening':
        return {
          start: new Date(tomorrow.setHours(18, 0, 0, 0)),
          end: new Date(tomorrow.setHours(22, 0, 0, 0)),
        };
      default:
        throw new Error(`Turno inválido: ${shift}`);
    }
  }
}