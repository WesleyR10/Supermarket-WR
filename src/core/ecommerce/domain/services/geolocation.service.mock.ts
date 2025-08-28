import { DeliveryAddress } from '../online-order.aggregate';
import {
  IGeolocationService,
  IDistanceCalculator,
  IDeliveryAreaService,
  Coordinates,
  DistanceResult,
  DistanceCalculationOptions
} from './geolocation.service.interface';

/**
 * Implementação mock do serviço de geolocalização para testes e desenvolvimento
 */
export class MockGeolocationService implements IGeolocationService {
  private readonly mockCoordinates: Map<string, Coordinates> = new Map();

  constructor() {
    // Coordenadas mock para endereços comuns de teste
    this.mockCoordinates.set('São Paulo, SP', { latitude: -23.5505, longitude: -46.6333 });
    this.mockCoordinates.set('Rio de Janeiro, RJ', { latitude: -22.9068, longitude: -43.1729 });
    this.mockCoordinates.set('Belo Horizonte, MG', { latitude: -19.9167, longitude: -43.9345 });
  }

  async geocodeAddress(address: DeliveryAddress): Promise<Coordinates | null> {
    // Simula delay de API
    await this.simulateDelay(100, 300);

    const addressKey = `${address.city}, ${address.state}`;
    const baseCoords = this.mockCoordinates.get(addressKey);
    
    if (!baseCoords) {
      return null;
    }

    // Adiciona variação pequena baseada no endereço específico
    const variation = this.generateAddressVariation(address.street + address.number);
    
    return {
      latitude: baseCoords.latitude + variation.lat,
      longitude: baseCoords.longitude + variation.lng
    };
  }

  async reverseGeocode(coordinates: Coordinates): Promise<DeliveryAddress | null> {
    await this.simulateDelay(100, 300);

    // Retorna endereço mock baseado nas coordenadas
    return DeliveryAddress.create({
      street: 'Rua Mock',
      number: '123',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zip_code: '01000-000',
      latitude: coordinates.latitude,
      longitude: coordinates.longitude
    });
  }

  async validateAddress(address: DeliveryAddress): Promise<boolean> {
    await this.simulateDelay(50, 150);
    
    // Validação básica mock
    return address.street.length > 0 && 
           address.city.length > 0 && 
           address.state.length === 2 &&
           /^\d{5}-?\d{3}$/.test(address.zip_code);
  }

  async suggestAddresses(partialAddress: string, storeLocation?: Coordinates): Promise<DeliveryAddress[]> {
    await this.simulateDelay(100, 200);

    const suggestions: DeliveryAddress[] = [];
    
    if (partialAddress.toLowerCase().includes('rua')) {
      suggestions.push(
        DeliveryAddress.create({
          street: 'Rua das Flores',
          number: '100',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          zip_code: '01000-000'
        }),
        DeliveryAddress.create({
          street: 'Rua dos Jardins',
          number: '200',
          neighborhood: 'Jardins',
          city: 'São Paulo',
          state: 'SP',
          zip_code: '01400-000'
        })
      );
    }

    return suggestions;
  }

  private async simulateDelay(minMs: number, maxMs: number): Promise<void> {
    const delay = Math.random() * (maxMs - minMs) + minMs;
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  private generateAddressVariation(seed: string): { lat: number; lng: number } {
    // Gera variação determinística baseada no seed
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    const variation = (hash % 1000) / 100000; // Variação de até 0.01 graus
    return {
      lat: variation,
      lng: variation * 1.5
    };
  }
}

/**
 * Implementação mock do calculador de distâncias
 */
export class MockDistanceCalculator implements IDistanceCalculator {
  async calculateDistance(
    origin: Coordinates,
    destination: Coordinates,
    options?: DistanceCalculationOptions
  ): Promise<DistanceResult> {
    await this.simulateDelay(100, 300);

    // Cálculo de distância usando fórmula de Haversine (aproximada)
    const distance = this.haversineDistance(origin, destination);
    
    // Estima tempo baseado no modo de transporte
    const avgSpeed = this.getAverageSpeed(options?.transport_mode || 'driving');
    const estimatedTime = Math.round((distance / avgSpeed) * 60); // em minutos

    return {
      distance_km: Math.round(distance * 100) / 100, // 2 casas decimais
      estimated_time_minutes: estimatedTime,
      route_type: options?.route_optimization ? 'optimized' : 'direct'
    };
  }

  async calculateDeliveryDistance(
    storeLocation: Coordinates,
    deliveryAddress: DeliveryAddress,
    options?: DistanceCalculationOptions
  ): Promise<DistanceResult | null> {
    if (!deliveryAddress.latitude || !deliveryAddress.longitude) {
      return null;
    }

    const destination: Coordinates = {
      latitude: deliveryAddress.latitude,
      longitude: deliveryAddress.longitude
    };

    return this.calculateDistance(storeLocation, destination, options);
  }

  async isWithinDeliveryRadius(
    storeLocation: Coordinates,
    deliveryAddress: DeliveryAddress,
    maxRadiusKm: number
  ): Promise<boolean> {
    const distanceResult = await this.calculateDeliveryDistance(storeLocation, deliveryAddress);
    return distanceResult ? distanceResult.distance_km <= maxRadiusKm : false;
  }

  async calculateMultipleRoutes(
    origin: Coordinates,
    destinations: Coordinates[],
    options?: DistanceCalculationOptions
  ): Promise<DistanceResult[]> {
    const results: DistanceResult[] = [];
    
    for (const destination of destinations) {
      const result = await this.calculateDistance(origin, destination, options);
      results.push(result);
    }
    
    return results;
  }

  private haversineDistance(coord1: Coordinates, coord2: Coordinates): number {
    const R = 6371; // Raio da Terra em km
    const dLat = this.toRadians(coord2.latitude - coord1.latitude);
    const dLon = this.toRadians(coord2.longitude - coord1.longitude);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(coord1.latitude)) * Math.cos(this.toRadians(coord2.latitude)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private getAverageSpeed(mode: string): number {
    switch (mode) {
      case 'walking': return 5; // km/h
      case 'cycling': return 15; // km/h
      case 'driving': return 30; // km/h (considerando trânsito urbano)
      default: return 30;
    }
  }

  private async simulateDelay(minMs: number, maxMs: number): Promise<void> {
    const delay = Math.random() * (maxMs - minMs) + minMs;
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}

/**
 * Implementação mock do serviço de área de entrega
 */
export class MockDeliveryAreaService implements IDeliveryAreaService {
  private readonly storeConfigs = new Map<string, {
    maxRadius: number;
    zones: Array<{
      zone_name: string;
      max_distance_km: number;
      base_fee: number;
      per_km_fee: number;
    }>;
  }>();

  constructor() {
    // Configurações mock para lojas
    this.storeConfigs.set('store-123', {
      maxRadius: 15,
      zones: [
        { zone_name: 'Centro', max_distance_km: 5, base_fee: 5.00, per_km_fee: 1.00 },
        { zone_name: 'Próximo', max_distance_km: 10, base_fee: 8.00, per_km_fee: 1.50 },
        { zone_name: 'Distante', max_distance_km: 15, base_fee: 12.00, per_km_fee: 2.00 }
      ]
    });
  }

  async isAddressInDeliveryArea(storeId: string, address: DeliveryAddress): Promise<boolean> {
    await this.simulateDelay(50, 150);
    
    const config = this.storeConfigs.get(storeId);
    if (!config) return false;

    // Simulação simples baseada no CEP
    const zipCode = address.zip_code.replace('-', '');
    const zipNumber = parseInt(zipCode.substring(0, 5));
    
    // CEPs de São Paulo (01000-05999) estão na área de entrega
    return zipNumber >= 1000 && zipNumber <= 5999;
  }

  async getMaxDeliveryRadius(storeId: string): Promise<number> {
    await this.simulateDelay(10, 50);
    
    const config = this.storeConfigs.get(storeId);
    return config?.maxRadius || 10; // Default 10km
  }

  async calculateDeliveryFee(storeId: string, distance: number): Promise<number> {
    await this.simulateDelay(20, 100);
    
    const zones = await this.getDeliveryZones(storeId);
    
    for (const zone of zones) {
      if (distance <= zone.max_distance_km) {
        return zone.base_fee + (distance * zone.per_km_fee);
      }
    }
    
    // Se não encontrar zona, retorna taxa padrão alta
    return 15.00 + (distance * 2.50);
  }

  async getDeliveryZones(storeId: string): Promise<Array<{
    zone_name: string;
    max_distance_km: number;
    base_fee: number;
    per_km_fee: number;
  }>> {
    await this.simulateDelay(10, 50);
    
    const config = this.storeConfigs.get(storeId);
    return config?.zones || [];
  }

  private async simulateDelay(minMs: number, maxMs: number): Promise<void> {
    const delay = Math.random() * (maxMs - minMs) + minMs;
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}