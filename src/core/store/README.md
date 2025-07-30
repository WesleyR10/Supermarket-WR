# Store Domain

Este módulo implementa o domínio de **Lojas** para o sistema de supermercado, seguindo os princípios de Domain-Driven Design (DDD) e Arquitetura Hexagonal.

## 📋 Visão Geral

O domínio de lojas gerencia todas as informações e configurações das lojas do supermercado, incluindo funcionalidades específicas como:

- Gestão de informações básicas da loja (nome, CNPJ)
- Controle de status da loja (ativa, suspensa, cancelada)
- Configurações de funcionamento (horários, vendas, estoque)
- Gestão de assinaturas e planos (básico, premium, enterprise)
- Configurações fiscais e de notificações
- Controle de trial e pagamentos

## 🎯 Casos de Uso

### CreateStoreUseCase

Cria uma nova loja com validações de negócio.

**Input:**

- `name`: Nome da loja
- `cnpj`: CNPJ da loja
- `business_hours?`: Horários de funcionamento por dia da semana
- `sales_config?`: Configurações de vendas
- `inventory_config?`: Configurações de estoque
- `fiscal_config?`: Configurações fiscais
- `notification_config?`: Configurações de notificações
- `plan_type?`: Tipo de plano (BASIC, PREMIUM, ENTERPRISE)
- `is_trial?`: Se é período de trial

### UpdateStoreUseCase

Atualiza uma loja existente.

### GetStoreUseCase

Busca uma loja por ID.

### ListStoresUseCase

Lista lojas com filtros, paginação e ordenação.

**Filtros disponíveis:**

- Por nome
- Por CNPJ
- Por status
- Por tipo de plano
- Por trial ativo
- Por cidade
- Por estado

### DeleteStoreUseCase

Remove uma loja do sistema.

## 🏪 Campos Específicos do Supermercado

### status

Status atual da loja:

- `PENDING_ACTIVATION`: Aguardando ativação
- `ACTIVE`: Ativa e operacional
- `SUSPENDED`: Suspensa temporariamente
- `CANCELLED`: Cancelada definitivamente

### settings

Configurações operacionais da loja:

#### business_hours

Horários de funcionamento para cada dia da semana com campos `open`, `close` e `closed`.

#### sales_config

- `allow_negative_stock`: Permite vendas com estoque negativo
- `auto_approve_sales`: Aprovação automática de vendas
- `max_discount_percentage`: Percentual máximo de desconto
- `require_customer_identification`: Exige identificação do cliente

#### inventory_config

- `low_stock_threshold`: Limite para alerta de estoque baixo
- `auto_reorder`: Reposição automática de estoque
- `track_expiry_dates`: Rastreamento de datas de validade

#### fiscal_config

- `tax_regime`: Regime tributário (SIMPLES, LUCRO_PRESUMIDO, LUCRO_REAL)
- `issue_nfe`: Emissão de nota fiscal eletrônica
- `municipal_inscription`: Inscrição municipal
- `state_inscription`: Inscrição estadual

#### notification_config

- `email_notifications`: Notificações por email
- `sms_notifications`: Notificações por SMS
- `low_stock_alerts`: Alertas de estoque baixo
- `sales_reports`: Relatórios de vendas

### subscription

Informações da assinatura:

- `plan_type`: Tipo do plano (BASIC, PREMIUM, ENTERPRISE)
- `start_date` / `end_date`: Período da assinatura
- `is_trial`: Se está em período de trial
- `payment_status`: Status do pagamento
- `features`: Recursos disponíveis (max_products, max_employees, etc.)
- `billing_info`: Informações de cobrança

## 🔍 Métodos de Consulta Específicos

### findByCnpj(cnpj)

Busca loja por CNPJ.

### findActiveStores()

Busca apenas lojas ativas.

### findByStatus(status)

Busca lojas por status específico.

### findByPlanType(planType)

Busca lojas por tipo de plano.

### findTrialStores()

Busca lojas em período de trial.

### findExpiredSubscriptions()

Busca lojas com assinaturas expiradas.

### findStoresWithOverduePayment()

Busca lojas com pagamentos em atraso.

### findStoresByLocation(city, state?)

Busca lojas por localização.

## 🧪 Testes

O domínio possui cobertura completa de testes:

- **Testes de Domínio**: Validam o agregado e suas regras de negócio
- **Testes de Casos de Uso**: Validam a lógica de aplicação
- **Testes de Repositório**: Validam a implementação in-memory

```bash
# Executar testes do domínio store
npm test -- store
```

## 📝 Exemplos de Uso

### Criando uma loja básica

```typescript
const store = Store.create({
  name: "Supermercado Central",
  cnpj: "12.345.678/0001-90",
  plan_type: "BASIC",
  is_trial: true,
});
```

### Criando uma loja com configurações completas

```typescript
const store = Store.create({
  name: "Supermercado Premium",
  cnpj: "98.765.432/0001-10",
  business_hours: {
    monday: { open: "08:00", close: "22:00", closed: false },
    sunday: { open: "09:00", close: "18:00", closed: false },
  },
  sales_config: {
    allow_negative_stock: false,
    max_discount_percentage: 15.0,
  },
  plan_type: "PREMIUM",
});
```

### Buscando lojas com filtros

```typescript
const useCase = new ListStoresUseCase(repository);
const result = await useCase.execute({
  filter: {
    status: StoreStatus.ACTIVE,
    plan_type: "PREMIUM",
    city: "São Paulo",
  },
  sort: "name",
  sort_dir: "asc",
});
```

### Gerenciando status da loja

```typescript
// Ativar loja
store.activate();

// Suspender loja
store.suspend();

// Verificar se pode operar
if (store.canOperate()) {
  // Loja pode realizar operações
}
```

## 🔧 Validações

O domínio implementa validações robustas:

- **Nome**: Obrigatório, máximo 255 caracteres
- **CNPJ**: Obrigatório, formato válido
- **Horários**: Formato HH:MM válido
- **Percentuais**: Valores entre 0 e 100
- **Configurações**: Validação de tipos e valores permitidos

## 🏗️ Estrutura do Domínio

store/
├── domain/
│ ├── tests /
│ │ └── store.aggregate.spec.ts
│ ├── store.aggregate.ts # Agregado principal
│ ├── store.repository.interface.ts # Interface do repositório
│ ├── store.validator.ts # Validações de negócio
│ └── store-fake.builder.ts # Builder para testes
├── application/
│ ├── use-cases/
│ │ ├── create-store/
│ │ ├── update-store/
│ │ ├── get-store/
│ │ ├── list-stores/
│ │ └── delete-store/
│ ├── common/
│ │ └── store.output.ts
│ └── index.ts
└── infra/
└── db/
└── in-memory/
├── store-in-memory.repository.ts
└── store-in-memory.repository.spec.ts

_Este README.md visa fornecer uma visão clara e concisa do domínio Category, facilitando o entendimento e a colaboração entre os desenvolvedores._
