import { DeliveryAddress } from '../online-order.aggregate';

/**
 * Coordenadas geográficas
 */
export type Coordinates = {
  latitude: number;
  longitude: number;
};

/**
 * Resultado do cálculo de distância
 */
export type DistanceResult = {
  distance_km: number;
  estimated_time_minutes: number;
  route_type: 'direct' | 'optimized' | 'traffic_aware';
};

/**
 * Configurações para cálculo de distância
 */
export type DistanceCalculationOptions = {
  consider_traffic?: boolean;
  route_optimization?: boolean;
  transport_mode?: 'driving' | 'walking' | 'cycling';
};

/**
 * Interface para serviços de geolocalização
 * Permite integração com diferentes provedores (Google Maps, OpenStreetMap, etc.)
 */
export interface IGeolocationService {
  /**
   * Converte endereço em coordenadas geográficas (geocoding)
   */
  geocodeAddress(address: DeliveryAddress): Promise<Coordinates | null>;

  /**
   * Converte coordenadas em endereço (reverse geocoding)
   */
  reverseGeocode(coordinates: Coordinates): Promise<DeliveryAddress | null>;

  /**
   * Valida se um endereço existe e é válido
   */
  validateAddress(address: DeliveryAddress): Promise<boolean>;

  /**
   * Obtém sugestões de endereços baseado em texto parcial
   */
  suggestAddresses(partialAddress: string, storeLocation?: Coordinates): Promise<DeliveryAddress[]>;
}

/**
 * Interface para cálculo de distâncias e rotas
 * Abstrai diferentes algoritmos e provedores de rota
 */
export interface IDistanceCalculator {
  /**
   * Calcula distância entre dois pontos
   */
  calculateDistance(
    origin: Coordinates,
    destination: Coordinates,
    options?: DistanceCalculationOptions
  ): Promise<DistanceResult>;

  /**
   * Calcula distância entre loja e endereço de entrega
   */
  calculateDeliveryDistance(
    storeLocation: Coordinates,
    deliveryAddress: DeliveryAddress,
    options?: DistanceCalculationOptions
  ): Promise<DistanceResult | null>;

  /**
   * Verifica se um endereço está dentro da área de entrega
   */
  isWithinDeliveryRadius(
    storeLocation: Coordinates,
    deliveryAddress: DeliveryAddress,
    maxRadiusKm: number
  ): Promise<boolean>;

  /**
   * Calcula múltiplas rotas para otimização de entrega
   */
  calculateMultipleRoutes(
    origin: Coordinates,
    destinations: Coordinates[],
    options?: DistanceCalculationOptions
  ): Promise<DistanceResult[]>;
}

/**
 * Interface para configuração de áreas de entrega por loja
 */
export interface IDeliveryAreaService {
  /**
   * Verifica se um endereço está na área de entrega da loja
   */
  isAddressInDeliveryArea(storeId: string, address: DeliveryAddress): Promise<boolean>;

  /**
   * Obtém o raio máximo de entrega para uma loja
   */
  getMaxDeliveryRadius(storeId: string): Promise<number>;

  /**
   * Calcula taxa de entrega baseada na distância
   */
  calculateDeliveryFee(storeId: string, distance: number): Promise<number>;

  /**
   * Obtém zonas de entrega com taxas diferenciadas
   */
  getDeliveryZones(storeId: string): Promise<Array<{
    zone_name: string;
    max_distance_km: number;
    base_fee: number;
    per_km_fee: number;
  }>>;
}