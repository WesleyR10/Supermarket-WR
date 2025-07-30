# 📦 Domínio Inventory

## Visão Geral

O domínio **Inventory** é responsável pelo gerenciamento de estoque de produtos nas lojas do supermercado, controlando quantidades, custos, preços e regras de negócio relacionadas ao inventário.

## 🏗️ Arquitetura

## 📋 Campos da Entidade Inventory

| Campo           | Tipo        | Descrição                              |
| --------------- | ----------- | -------------------------------------- |
| `id`            | InventoryId | Identificador único do inventário      |
| `product_id`    | ProductId   | Referência ao produto                  |
| `store_id`      | StoreId     | Referência à loja                      |
| `quantity`      | number      | Quantidade atual em estoque            |
| `min_stock`     | number      | Estoque mínimo (ponto de reposição)    |
| `max_stock`     | number      | Estoque máximo permitido               |
| `unit_cost`     | number      | Custo unitário do produto              |
| `unit_price`    | number      | Preço unitário de venda                |
| `supplier_id`   | SupplierId  | Fornecedor do produto                  |
| `location_code` | string      | Código da localização no estoque       |
| `expiry_date`   | Date        | Data de validade (produtos perecíveis) |
| `batch_number`  | string      | Número do lote                         |
| `is_active`     | boolean     | Status ativo/inativo                   |
| `created_at`    | Date        | Data de criação                        |
| `updated_at`    | Date        | Data da última atualização             |

## 🔧 Funcionalidades Principais

### Casos de Uso (Use Cases)

#### Gestão Básica

- **Criar Inventário**: `CreateInventoryUseCase`
- **Atualizar Inventário**: `UpdateInventoryUseCase`
- **Listar Inventários**: `ListInventoriesUseCase`
- **Ativar/Desativar**: `ActivateInventoryUseCase`

#### Gestão de Estoque

- **Adicionar Estoque**: `AddStockUseCase`
- **Remover Estoque**: `RemoveStockUseCase`
- **Reservar Estoque**: `ReserveStockUseCase`

#### Gestão de Custos

- **Atualizar Custo**: `UpdateUnitCostUseCase`
- **Atualizar Preço**: `UpdateUnitPriceUseCase`

### Métodos da Entidade

#### Atualização de Propriedades

- `changeProduct(productId)` - Alterar produto
- `changeStore(storeId)` - Alterar loja
- `updateQuantity(quantity)` - Atualizar quantidade
- `updateMinStock(minStock)` - Atualizar estoque mínimo
- `updateMaxStock(maxStock)` - Atualizar estoque máximo
- `updateUnitCost(cost)` - Atualizar custo unitário
- `updateUnitPrice(price)` - Atualizar preço unitário

#### Gestão de Estoque

- `addStock(quantity)` - Adicionar ao estoque
- `removeStock(quantity)` - Remover do estoque
- `reserveStock(quantity)` - Reservar estoque

#### Regras de Negócio

- `isLowStock()` - Verifica se está com estoque baixo
- `isOutOfStock()` - Verifica se está sem estoque
- `isFullStock()` - Verifica se está com estoque cheio
- `isExpired()` - Verifica se está vencido
- `isNearExpiry(days)` - Verifica se está próximo do vencimento
- `calculateProfitMargin()` - Calcula margem de lucro
- `needsRestock()` - Verifica se precisa reposição
- `isPerishable()` - Verifica se é perecível
- `requiresBatchNumber()` - Verifica se requer número de lote
- `isHighValueProduct()` - Verifica se é produto de alto valor

## 🔒 Validações de Negócio

### Validações Automáticas

- Margem de lucro mínima (20%)
- Data de validade obrigatória para produtos perecíveis
- Número de lote obrigatório para produtos com data de validade
- Localização obrigatória para produtos de alto valor
- Fornecedor obrigatório para produtos de alto valor
- Estoque não pode ser negativo
- Estoque máximo deve ser maior que mínimo

### Validações de Campos

- Quantidade: mínimo 0
- Estoque mínimo/máximo: mínimo 0
- Custo/Preço: valores positivos
- Código de localização: formato específico
- Número de lote: formato alfanumérico

## 🧪 Testes

Cada caso de uso possui testes abrangentes cobrindo:

- Cenários de sucesso
- Validações de negócio
- Tratamento de erros
- Casos extremos

## 📚 Padrões Utilizados

- **Domain-Driven Design (DDD)**
- **Clean Architecture**
- **Repository Pattern**
- **Use Case Pattern**
- **Aggregate Pattern**
- **Value Objects**
- **Factory Pattern** (para validadores)

## 🔄 Integração

O domínio Inventory integra-se com:

- **Product Domain**: Para validações de produto
- **Store Domain**: Para validações de loja
- **Supplier Domain**: Para gestão de fornecedores

---

_Este domínio segue as melhores práticas de arquitetura empresarial, garantindo baixo acoplamento, alta coesão e facilidade de manutenção._

### Estrutura de Pastas

```
inventory/
├── domain/
│   ├── entities/
│   │   └── inventory.aggregate.ts
│   ├── repositories/
│   │   └── inventory.repository.interface.ts
│   └── validators/
│       └── inventory.validator.ts
├── application/
│   ├── use-cases/
│   │   ├── create-inventory/
│   │   ├── update-inventory/
│   │   ├── get-inventory/
│   │   ├── list-inventories/
│   │   ├── activate-inventory/
│   │   ├── add-stock/
│   │   ├── remove-stock/
│   │   └── set-location/
│   │   └── update-unit-cost/
│   │   └── update-unit-price/
│   │   └── common/ (Mapper)
└── infra/
└── repositories/
```
