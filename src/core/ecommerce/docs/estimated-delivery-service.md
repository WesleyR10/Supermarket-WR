# EstimatedDeliveryService - Documentação

## Visão Geral

O `EstimatedDeliveryService` é responsável por calcular o tempo estimado de entrega baseado nas regras de negócio da empresa, considerando diferentes modalidades de entrega como entrega normal, agendada e por turnos.

## Funcionalidades

### 1. Cálculo de Tempo de Entrega

#### Entrega Normal

- **Tempo base de preparação**: 30 minutos
- **Tempo de entrega**: Calculado baseado na distância (simulado via CEP)
- **Entrega expressa**: Pedidos com tempo total ≤ 60 minutos

#### Entrega Agendada

- Permite ao cliente escolher um horário específico
- **Janela de entrega**: ±30 minutos do horário solicitado
- **Horário de funcionamento**: 8h às 22h

#### Entrega por Turnos

- **Manhã**: 8h às 12h
- **Tarde**: 13h às 17h
- **Noite**: 18h às 22h

### 2. Disponibilidade de Turnos

#### Dias Úteis (Segunda a Sábado)

- **Antes das 12h**: Todos os turnos disponíveis
- **12h às 17h**: Tarde e noite disponíveis
- **17h às 18h**: Apenas noite disponível
- **Após 18h**: Nenhum turno disponível

#### Domingo

- **Antes das 12h**: Manhã e tarde disponíveis
- **12h às 17h**: Apenas tarde disponível
- **Após 17h**: Nenhum turno disponível

### 3. Cálculo de Distância (Simulado)

Baseado nos primeiros dígitos do CEP:

- **01-05**: Região próxima (20 minutos)
- **06-15**: Região média (35 minutos)
- **16+**: Região distante (50 minutos)

## Interface do Service

```typescript
export interface IEstimatedDeliveryService {
  calculateEstimatedDelivery(
    params: DeliveryCalculationParams
  ): Promise<DeliveryTimeEstimate>;
  isDeliveryTimeAvailable(params: DeliveryCalculationParams): Promise<boolean>;
  getAvailableDeliveryShifts(
    date: Date,
    store_id: string,
    tenant_id: string
  ): Promise<string[]>;
}
```

## Parâmetros de Entrada

```typescript
export interface DeliveryCalculationParams {
  delivery_address: DeliveryAddress;
  store_id: string;
  tenant_id: string;
  requested_delivery_time?: Date;
  is_scheduled?: boolean;
  delivery_shift?: "morning" | "afternoon" | "evening";
}
```

## Resposta do Cálculo

```typescript
export interface DeliveryTimeEstimate {
  estimated_delivery: Date;
  delivery_window_start?: Date;
  delivery_window_end?: Date;
  is_express?: boolean;
  delivery_notes?: string;
}
```

## Configurações Futuras

### Integrações Planejadas

1. **APIs de Geolocalização**: Google Maps, HERE, etc.
2. **Configurações por Empresa**: Horários personalizados, capacidade de entrega
3. **Integração com Estoque**: Verificar disponibilidade de produtos
4. **Otimização de Rotas**: Algoritmos para otimizar entregas

### Configurações Multi-tenant

- Cada empresa pode ter suas próprias regras de entrega
- Horários de funcionamento personalizados
- Áreas de cobertura específicas
- Taxas de entrega diferenciadas

## Exemplos de Uso

### Entrega Normal

```typescript
const params = {
  delivery_address: address,
  store_id: "store-123",
  tenant_id: "tenant-123",
};

const estimate = await service.calculateEstimatedDelivery(params);
// Resultado: entrega em ~50 minutos, pode ser expressa
```

### Entrega Agendada

```typescript
const params = {
  delivery_address: address,
  store_id: "store-123",
  tenant_id: "tenant-123",
  requested_delivery_time: new Date("2024-01-15T14:30:00Z"),
  is_scheduled: true,
};

const estimate = await service.calculateEstimatedDelivery(params);
// Resultado: entrega às 14:30 com janela de ±30 min
```

### Entrega por Turno

```typescript
const params = {
  delivery_address: address,
  store_id: "store-123",
  tenant_id: "tenant-123",
  delivery_shift: "afternoon",
};

const estimate = await service.calculateEstimatedDelivery(params);
// Resultado: entrega entre 13h e 17h do próximo dia
```

## Considerações de Arquitetura

### Clean Architecture

- **Interface no Domínio**: `IEstimatedDeliveryService`
- **Implementação na Infraestrutura**: `EstimatedDeliveryService`
- **Injeção de Dependência**: Via NestJS

### Multi-tenant

- Todas as operações consideram `tenant_id`
- Configurações isoladas por empresa
- Dados segregados por tenant

### Offline-first

- Cálculos básicos funcionam offline
- Sincronização de configurações quando online
- Cache de dados de geolocalização

## Testes

O service possui cobertura completa de testes unitários:

- ✅ Cálculo de entrega normal
- ✅ Cálculo de entrega agendada
- ✅ Cálculo de entrega por turno
- ✅ Detecção de entrega expressa
- ✅ Verificação de disponibilidade de horários
- ✅ Obtenção de turnos disponíveis
- ✅ Validação de horários de funcionamento

## Roadmap

1. **Fase 1** ✅: Implementação básica com simulação
2. **Fase 2**: Integração com APIs de geolocalização
3. **Fase 3**: Configurações avançadas por empresa
4. **Fase 4**: Otimização de rotas e capacidade
5. **Fase 5**: Machine Learning para previsões mais precisas
