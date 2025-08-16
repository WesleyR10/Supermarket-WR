# 🛒 Domínio Sale

## Visão Geral

O domínio **Sale** é responsável por gerenciar todas as operações de vendas do sistema de supermercado, incluindo vendas no PDV (Ponto de Venda) e integração com e-commerce. Este domínio abrange desde a criação de vendas até o processamento de pagamentos, aplicação de descontos e controle de status, garantindo operação offline-first e multi-tenant.

## 🏗️ Arquitetura

Implementa os padrões **Domain-Driven Design (DDD)** e **Arquitetura Hexagonal**, garantindo separação clara entre regras de negócio e infraestrutura, com foco em operação offline e sincronização posterior.

## 📋 Campos da Entidade Sale

| Campo             | Tipo            | Descrição                                    |
| ----------------- | --------------- | -------------------------------------------- |
| `sale_id`         | `SaleId`        | Identificador único da venda                 |
| `store_id`        | `string`        | Identificador da loja (multi-tenant)         |
| `customer_id`     | `string \| null` | Identificador do cliente (opcional)          |
| `cashier_id`      | `string`        | Identificador do operador de caixa           |
| `total_amount`    | `number`        | Valor total da venda                         |
| `discount_amount` | `number`        | Valor do desconto aplicado                   |
| `tax_amount`      | `number`        | Valor dos impostos calculados                |
| `tax_rate`        | `number`        | Taxa de imposto aplicada (0-1)               |
| `payment_method`  | `PaymentMethod` | Método de pagamento utilizado                |
| `sale_status`     | `SaleStatus`    | Status atual da venda                        |
| `items`           | `SaleItem[]`    | Lista de itens da venda                      |
| `register_number` | `number`        | Número do caixa/registradora                 |
| `sale_date`       | `Date`          | Data e hora da venda                         |
| `created_at`      | `Date`          | Data de criação do registro                  |
| `updated_at`      | `Date`          | Data da última atualização                   |

### Campos da Entidade SaleItem

| Campo                | Tipo     | Descrição                           |
| -------------------- | -------- | ----------------------------------- |
| `product_id`         | `string` | Identificador do produto            |
| `quantity`           | `number` | Quantidade vendida                  |
| `unit_price`         | `number` | Preço unitário no momento da venda  |
| `discount_percentage`| `number` | Percentual de desconto (0-100)      |
| `total_price`        | `number` | Valor total do item (calculado)     |

### Enums

#### PaymentMethod

- `CASH` - Dinheiro
- `CREDIT_CARD` - Cartão de crédito
- `DEBIT_CARD` - Cartão de débito
- `PIX` - PIX
- `BANK_TRANSFER` - Transferência bancária
- `FOOD_VOUCHER` - Vale alimentação
- `MEAL_VOUCHER` - Vale refeição

#### SaleStatus

- `PENDING` - Venda em andamento
- `COMPLETED` - Venda finalizada
- `CANCELLED` - Venda cancelada
- `REFUNDED` - Venda estornada

## 🔧 Funcionalidades Principais

### Casos de Uso (Use Cases)

#### Gestão Básica

- **CreateSaleUseCase**: Criação de novas vendas
- **UpdateSaleUseCase**: Atualização de vendas pendentes
- **GetSaleUseCase**: Busca de venda por ID
- **ListSalesUseCase**: Listagem com filtros e paginação
- **DeleteSaleUseCase**: Remoção de vendas (apenas pendentes)

### Métodos da Entidade Sale

#### Gestão de Itens

- `addItem(item: SaleItemCreateCommand)`: Adiciona item à venda
- `removeItem(productId: string)`: Remove item da venda
- `updateItemQuantity(productId: string, quantity: number)`: Atualiza quantidade

#### Gestão de Pagamento e Status

- `setPaymentMethod(paymentMethod: PaymentMethod)`: Define método de pagamento
- `completeSale()`: Finaliza a venda
- `cancelSale()`: Cancela a venda
- `refundSale()`: Estorna a venda
- `canBeCancelled()`: Verifica se pode ser cancelada

#### Cálculos e Descontos

- `applyDiscount(discountAmount: number)`: Aplica desconto à venda
- `getSubtotalWithDiscount()`: Calcula subtotal com desconto
- `getFinalTotal()`: Calcula total final com impostos
- `recalculateTotals()`: Recalcula todos os totais

### Métodos da Entidade SaleItem

- `updateQuantity(quantity: number)`: Atualiza quantidade do item
- `updateUnitPrice(unitPrice: number)`: Atualiza preço unitário
- `updateDiscountPercentage(percentage: number)`: Atualiza desconto
- `calculateTotalPrice()`: Calcula preço total do item

## 🔒 Validações de Negócio

### Invariantes do Aggregate Sale

- **Store ID obrigatório**: Toda venda deve pertencer a uma loja
- **Cashier ID obrigatório**: Toda venda deve ter um operador
- **Pelo menos um item**: Venda deve conter ao menos um item
- **Register number válido**: Número do caixa deve ser maior que zero
- **Desconto não negativo**: Desconto não pode ser negativo
- **Taxa de imposto válida**: Taxa deve estar entre 0 e 1 (0% a 100%)
- **Desconto não excede total**: Desconto não pode ser maior que o total

### Invariantes do SaleItem

- **Product ID obrigatório**: Item deve ter produto válido
- **Quantidade positiva**: Quantidade deve ser maior que zero
- **Preço unitário positivo**: Preço deve ser maior que zero
- **Desconto válido**: Percentual entre 0 e 100

### Validações de Status

- **Atualização apenas pendentes**: Só vendas PENDING podem ser atualizadas
- **Finalização com pagamento**: Venda deve ter método de pagamento para finalizar
- **Cancelamento válido**: Apenas vendas PENDING ou COMPLETED podem ser canceladas
- **Estorno válido**: Apenas vendas COMPLETED podem ser estornadas

### Validações Multi-Tenant

- **Segregação por loja**: Todas as operações respeitam o store_id
- **Validação de propriedade**: Verificação se venda pertence à loja informada
- **Isolamento de dados**: Dados são filtrados por tenant

## 🔍 Métodos de Consulta Específicos

### findByStoreId(storeId: string)

Retorna todas as vendas de uma loja específica.

### findByStatus(status: SaleStatus)

Busca vendas por status específico.

### findByCashierId(cashierId: string)

Localiza vendas de um operador específico.

### findByCustomerId(customerId: string)

Busca vendas de um cliente específico.

### findByDateRange(startDate: Date, endDate: Date)

Localiza vendas em um período específico.

### findByRegisterNumber(registerNumber: number)

Busca vendas de um caixa específico.

### findByPaymentMethod(paymentMethod: PaymentMethod)

Localiza vendas por método de pagamento.

## 🧪 Testes

```bash
# Executar todos os testes do domínio
npm test src/core/sale

# Executar testes específicos
npm test sale.aggregate.spec.ts
npm test create-sale.use-case.spec.ts
```

## 📚 Padrões Utilizados

- **Repository Pattern**: Abstração para persistência de dados
- **Use Case Pattern**: Encapsulamento de regras de aplicação
- **Aggregate Pattern**: Sale como agregado principal com SaleItem
- **Value Objects**: SaleId, Money para cálculos precisos
- **Factory Pattern**: SaleValidatorFactory para validações
- **Multi-Tenant Pattern**: Segregação de dados por store_id
- **Offline-First Pattern**: Operação local com sincronização posterior

## 🔄 Integração

O domínio **Sale** integra-se com:

- **Product Domain**: Validação de produtos e preços
- **Inventory Domain**: Controle de estoque e reservas
- **Customer Domain**: Informações de clientes
- **Employee Domain**: Validação de operadores
- **Store Domain**: Configurações da loja
- **Fiscal Domain**: Cálculo de impostos e emissão de notas

### Dependências Externas

- Sistemas de pagamento (PIX, cartões)
- Gateways de pagamento
- Sistemas fiscais (NFC-e)
- Sincronização com e-commerce

### Estrutura de Pastas

```
src/core/sale/
├── domain/
│   ├── sale.aggregate.ts              # Agregado principal
│   ├── sale.repository.interface.ts   # Interface do repositório
│   ├── sale.validator.ts              # Validações de negócio
│   └── sale-fake.builder.ts           # Builder para testes
├── application/
│   └── use-cases/                     # Casos de uso da aplicação
│       ├── create-sale/
│       ├── update-sale/
│       ├── get-sale/
│       ├── list-sales/
│       └── delete-sale/
└── infra/
    └── db/                            # Implementações de persistência
```

## 🚀 Características Especiais

### Offline-First

- Operação completa sem conexão
- Sincronização automática ao reconectar
- Resolução de conflitos
- Cache local de dados essenciais

### Multi-Tenant

- Isolamento completo por loja
- Validação de propriedade em todas as operações
- Configurações específicas por tenant
- Segurança de dados entre lojas

### Integração PDV/E-commerce

- Sincronização de catálogo em tempo real
- Reserva de estoque para pedidos online
- Unificação de histórico de vendas
- Processamento híbrido de pagamentos