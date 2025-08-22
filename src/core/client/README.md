# Domínio Client

## Visão Geral

O domínio **Client** é responsável por gerenciar todas as informações e comportamentos relacionados aos clientes do supermercado. Este domínio implementa funcionalidades avançadas de segmentação, análise de fidelidade e validação de crédito, seguindo os princípios de Domain-Driven Design (DDD) e Clean Architecture.

## Características Principais

- **Segmentação Inteligente**: Classificação automática de clientes usando análise RFM (Recency, Frequency, Monetary)
- **Análise de Fidelidade**: Cálculo de scores de lealdade baseado em múltiplos fatores
- **Validação de Crédito**: Sistema de avaliação de risco e limites de crédito
- **Multi-tenant**: Suporte completo para múltiplas lojas
- **Offline-first**: Funciona sem conexão com sincronização posterior

## Estrutura do Domínio

```
client/
├── domain/
│   ├── client.aggregate.ts          # Aggregate Root principal
│   ├── client.validator.ts          # Validações de domínio
│   ├── client-fake.builder.ts       # Builder para testes
│   ├── repositories/
│   │   └── client.repository.ts     # Interface do repositório
│   └── services/
│       ├── client-segmentation.domain-service.ts
│       ├── credit-validation.domain-service.ts
│       └── loyalty-calculation.domain-service.ts
├── application/
│   └── use-cases/                   # Casos de uso da aplicação
└── infra/
    └── db/                          # Implementações de infraestrutura
```

## Aggregate Root: Client

### Propriedades Principais

- **Identificação**: `client_id`, `user_id`, `stores_id`
- **Fidelidade**: `loyalty_points`, `loyalty_level`, `loyalty_card_number`
- **Perfil**: `customer_type`, `avg_monthly_spending`, `total_purchases`
- **Crédito**: `credit_limit`
- **Preferências**: `preferred_contact_method`, `payment_preference`, `delivery_preference`
- **Comunicação**: `allows_promotions`, `allows_sms`, `allows_email`
- **Histórico**: `last_purchase_date`, `registration_source`
- **Auditoria**: `created_at`, `updated_at`, `deleted_at`, `is_active`

### Enums Utilizados

- **LoyaltyLevel**: `BRONZE`, `SILVER`, `GOLD`, `PLATINUM`, `DIAMOND`
- **CustomerType**: `INDIVIDUAL`, `BUSINESS`, `VIP`
- **ContactMethod**: `EMAIL`, `SMS`, `PHONE`, `WHATSAPP`
- **PaymentPreference**: `CASH`, `CREDIT_CARD`, `DEBIT_CARD`, `PIX`
- **DeliveryPreference**: `PICKUP`, `HOME_DELIVERY`, `BOTH`

## Domain Services

### 1. ClientSegmentationDomainService

**Propósito**: Segmentação automática de clientes baseada em comportamento de compra.

**Características**:
- Análise RFM (Recency, Frequency, Monetary)
- 11 tipos de segmentos diferentes
- Predição de risco de churn
- Recomendações de ações personalizadas
- Análise de padrões comportamentais

**Segmentos Disponíveis**:
- `CHAMPIONS`: Melhores clientes (alta recência, frequência e valor)
- `LOYAL_CUSTOMERS`: Clientes fiéis
- `POTENTIAL_LOYALISTS`: Potenciais clientes fiéis
- `NEW_CUSTOMERS`: Novos clientes
- `PROMISING`: Clientes promissores
- `NEED_ATTENTION`: Precisam de atenção
- `ABOUT_TO_SLEEP`: Prestes a se tornarem inativos
- `AT_RISK`: Em risco de churn
- `CANNOT_LOSE_THEM`: Não podemos perder
- `HIBERNATING`: Clientes hibernando
- `LOST`: Clientes perdidos

**Fatores de Cálculo**:
- Recência da última compra
- Frequência de compras
- Valor monetário total
- Tempo como cliente
- Padrões sazonais

**Parâmetros Configuráveis**:
- Thresholds para recência, frequência e valor monetário
- Pesos para cálculo de LTV
- Limites para detecção de churn
- Valores para classificação de alto/médio valor

### 2. LoyaltyCalculationDomainService

**Propósito**: Cálculo de scores de fidelidade e determinação de níveis de lealdade.

**Características**:
- Algoritmo multi-fatorial para cálculo de fidelidade
- Classificação automática em níveis de lealdade
- Pesos configuráveis para diferentes fatores
- Suporte a diferentes tipos de cliente

**Fatores de Cálculo**:
- **Recência** (40%): Quão recente foi a última compra
- **Frequência** (30%): Frequência de compras
- **Valor Monetário** (20%): Valor total gasto
- **Tempo como Cliente** (10%): Tenure do cliente

**Thresholds de Score**:
- Bronze: 0-25
- Silver: 26-50
- Gold: 51-75
- Platinum: 76-90
- Diamond: 91-100

**Parâmetros Configuráveis**:
- Pesos dos fatores de cálculo
- Thresholds para cada nível de fidelidade
- Fatores de ajuste por tipo de cliente

### 3. CreditValidationDomainService

**Propósito**: Validação de crédito e determinação de limites baseados em risco.

**Características**:
- Análise de risco multi-dimensional
- Limites de crédito por tipo de cliente
- Validação de elegibilidade
- Classificação de risco em 5 níveis

**Fatores de Score**:
- **Histórico de Pagamento** (35%): Pontualidade nos pagamentos
- **Utilização de Crédito** (30%): Percentual do limite utilizado
- **Histórico de Crédito** (15%): Tempo de relacionamento
- **Tipos de Crédito** (10%): Diversidade de produtos
- **Novas Consultas** (10%): Consultas recentes ao CPF

**Níveis de Risco**:
- `VERY_LOW`: Score 81-100
- `LOW`: Score 61-80
- `MEDIUM`: Score 41-60
- `HIGH`: Score 21-40
- `VERY_HIGH`: Score 0-20

**Limites por Tipo de Cliente**:
- Individual: R$ 500 - R$ 5.000
- Business: R$ 1.000 - R$ 20.000
- VIP: R$ 2.000 - R$ 50.000

## Validações de Domínio

### ClientValidator

**Validações Implementadas**:
- Email válido e único por loja
- CPF/CNPJ válido conforme tipo de cliente
- Telefone no formato brasileiro
- Limite de crédito não negativo
- Pontos de fidelidade não negativos
- Data de nascimento válida (maior de idade para pessoa física)
- Consistência entre tipo de cliente e documento

## Testes

### Cobertura de Testes

- **Domain Services**: 100% de cobertura
- **Aggregate**: Testes de invariantes e comportamentos
- **Validators**: Testes de todas as regras de validação
- **Builders**: Testes de construção de objetos para cenários específicos

### Estrutura de Testes

```
__tests__/
├── client.aggregate.spec.ts
└── services/
    ├── client-segmentation.domain-service.spec.ts
    ├── credit-validation.domain-service.spec.ts
    └── loyalty-calculation.domain-service.spec.ts
```

### Cenários de Teste Cobertos

**ClientSegmentationDomainService**:
- Segmentação de diferentes tipos de cliente
- Cálculo de scores para segmentos específicos
- Predição de risco de churn
- Análise de padrões comportamentais
- Casos extremos e edge cases
- Parâmetros customizados

**LoyaltyCalculationDomainService**:
- Cálculo de scores para diferentes perfis
- Determinação de níveis de fidelidade
- Validação de pesos dos fatores
- Casos extremos de valores

**CreditValidationDomainService**:
- Validação para diferentes tipos de cliente
- Cálculo de scores de crédito
- Determinação de limites
- Validação de elegibilidade
- Casos de risco alto e baixo

## Fake Builder

### ClientFakeBuilder

**Propósito**: Facilitar a criação de objetos Client para testes com dados realistas.

**Métodos Principais**:
- `withChampionClient()`: Cliente campeão
- `withVipClient()`: Cliente VIP
- `withNewClient()`: Cliente novo
- `withInactiveClient()`: Cliente inativo
- `withAtRiskClient()`: Cliente em risco
- `withLostClient()`: Cliente perdido
- `withOccasionalBuyer()`: Comprador ocasional
- `withFrequentBuyer()`: Comprador frequente
- `withHighCreditScoreClient()`: Cliente com alto score de crédito
- `withLowCreditScoreClient()`: Cliente com baixo score de crédito

**Características**:
- Dados realistas usando biblioteca Chance.js
- Métodos fluentes para configuração
- Suporte a criação em lote
- Configuração específica por cenário de teste

## Considerações de Performance

### Otimizações Implementadas

1. **Cálculos Lazy**: Scores são calculados apenas quando necessário
2. **Cache de Resultados**: Resultados de segmentação podem ser cacheados
3. **Validação Eficiente**: Validações são executadas em ordem de complexidade
4. **Bulk Operations**: Suporte a operações em lote para múltiplos clientes

### Métricas de Performance

- **Segmentação Individual**: < 10ms
- **Segmentação em Lote (100 clientes)**: < 500ms
- **Cálculo de Fidelidade**: < 5ms
- **Validação de Crédito**: < 15ms

## Integração com Outros Domínios

### Sales (Vendas)
- Atualização automática de métricas de compra
- Cálculo de RFM baseado no histórico de vendas
- Integração com sistema de pontos de fidelidade

### E-commerce
- Sincronização de preferências de entrega
- Histórico de navegação para segmentação
- Carrinho abandonado para análise de churn

### Fiscal
- Validação de documentos fiscais
- Integração com sistemas de crédito externos
- Compliance com LGPD

## Roadmap

### Próximas Implementações

1. **Machine Learning**: Algoritmos avançados para segmentação
2. **Real-time Analytics**: Análise em tempo real de comportamento
3. **Personalização**: Recomendações personalizadas de produtos
4. **Integração CRM**: Conectores para sistemas externos
5. **API Analytics**: Endpoints para dashboards e relatórios

### Melhorias Planejadas

1. **Cache Distribuído**: Redis para cache de segmentações
2. **Event Sourcing**: Histórico completo de mudanças
3. **CQRS**: Separação de comandos e consultas
4. **Webhooks**: Notificações em tempo real de mudanças

## Conclusão

O domínio Client representa uma implementação robusta e escalável para gerenciamento de clientes em um ambiente de supermercado. Com funcionalidades avançadas de segmentação, fidelidade e crédito, oferece uma base sólida para estratégias de CRM e marketing direcionado.

A arquitetura modular e os testes abrangentes garantem manutenibilidade e confiabilidade, enquanto as otimizações de performance asseguram uma experiência fluida mesmo com grandes volumes de dados.