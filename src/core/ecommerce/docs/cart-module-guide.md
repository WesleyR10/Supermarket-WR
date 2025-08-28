# 🛒 Cart Module - Guia Completo para Desenvolvedores

## 📋 Visão Geral

O módulo **Cart** é responsável por gerenciar carrinhos de compras no sistema de e-commerce, implementando todas as regras de negócio para criação, manipulação e controle de estado dos carrinhos.

### 🎯 Características Principais

- **Multi-tenant**: Isolamento completo por loja (`store_id`)
- **Offline-first**: Funciona independente de conectividade
- **Event-driven**: Emite eventos de domínio para auditoria
- **Type-safe**: TypeScript com validações rigorosas
- **DDD compliant**: Segue Domain-Driven Design

---

## 🏗️ Arquitetura

### Estrutura de Diretórios

```
src/core/ecommerce/
├── domain/
│   ├── cart.aggregate.ts           # Agregado principal
│   ├── cart.validator.ts           # Validações de domínio
│   ├── events/                     # Eventos de domínio
│   │   ├── cart-created.event.ts
│   │   ├── cart-item-added.event.ts
│   │   ├── cart-item-removed.event.ts
│   │   ├── cart-updated.event.ts
│   │   └── cart-cleared.event.ts
│   ├── fake-builders/
│   │   └── cart-fake.builder.ts    # Builder para testes
│   └── repositories/
│       └── cart.repository.interface.ts
├── application/
│   └── use-cases/
│       ├── create-cart/
│       ├── add-item-to-cart/
│       ├── remove-item-from-cart/
│       ├── update-item-quantity/
│       ├── clear-cart/
│       ├── get-cart/
│       └── common/
│           └── cart-output.ts      # DTOs de saída
└── infra/
    └── db/
        └── in-memory/
            └── cart-in-memory.repository.ts
```

---

## 🎯 Entidades e Value Objects

### Cart (Agregado Raiz)

```typescript
export class Cart extends AggregateRoot {
  cart_id: CartId;           // Identificador único
  client_id: Uuid;           // ID do cliente
  store_id: string;          // ID da loja (multi-tenant)
  items: CartItem[];         // Itens do carrinho
  status: CartStatus;        // Status atual
  subtotal: Money;           // Subtotal calculado
  expires_at: Date;          // Data de expiração
  created_at: Date;          // Data de criação
  updated_at: Date;          // Última atualização
}
```

### CartItem (Value Object)

```typescript
export class CartItem {
  product_id: Uuid;          // ID do produto
  product_name: string;      // Nome do produto
  quantity: Quantity;        // Quantidade
  unit_price: Price;         // Preço unitário
  subtotal: Money;           // Subtotal do item
}
```

### CartStatus (Enum)

```typescript
export enum CartStatus {
  ACTIVE = 'ACTIVE',         // Carrinho ativo
  ABANDONED = 'ABANDONED',   // Carrinho abandonado
  CONVERTED = 'CONVERTED',   // Convertido em pedido
  EXPIRED = 'EXPIRED'        // Expirado
}
```

---

## 🔧 Use Cases Implementados

### 1. CreateCartUseCase

**Localização**: `application/use-cases/create-cart/`

**Responsabilidade**: Criar novo carrinho ou retornar carrinho ativo existente

```typescript
// Exemplo de uso
const useCase = new CreateCartUseCase(cartRepository);
const result = await useCase.execute({
  client_id: 'uuid-client',
  store_id: 'store-123',
  expires_at: '2025-02-01T10:00:00Z' // Opcional
});
```

**Regras de Negócio**:
- ✅ Verifica se já existe carrinho ativo para cliente/loja
- ✅ Retorna carrinho existente se encontrado
- ✅ Cria novo carrinho com expiração padrão (7 dias)
- ✅ Emite evento `CartCreatedEvent`

### 2. AddItemToCartUseCase

**Localização**: `application/use-cases/add-item-to-cart/`

**Responsabilidade**: Adicionar item ao carrinho

```typescript
// Exemplo de uso
const useCase = new AddItemToCartUseCase(cartRepository);
const result = await useCase.execute({
  cart_id: 'uuid-cart',
  product_id: 'uuid-product',
  product_name: 'Arroz 5kg',
  quantity: 2,
  unit_price: 15.99
});
```

**Regras de Negócio**:
- ✅ Carrinho deve estar `ACTIVE`
- ✅ Carrinho não pode estar expirado
- ✅ Consolida itens duplicados (soma quantidades)
- ✅ Recalcula subtotal automaticamente
- ✅ Emite eventos `CartItemAddedEvent` e `CartUpdatedEvent`

### 3. RemoveItemFromCartUseCase

**Localização**: `application/use-cases/remove-item-from-cart/`

**Responsabilidade**: Remover item do carrinho

```typescript
// Exemplo de uso
const useCase = new RemoveItemFromCartUseCase(cartRepository);
const result = await useCase.execute({
  cart_id: 'uuid-cart',
  product_id: 'uuid-product'
});
```

**Regras de Negócio**:
- ✅ Carrinho deve estar `ACTIVE`
- ✅ Item deve existir no carrinho
- ✅ Recalcula subtotal automaticamente
- ✅ Emite eventos `CartItemRemovedEvent` e `CartUpdatedEvent`

### 4. UpdateItemQuantityUseCase

**Localização**: `application/use-cases/update-item-quantity/`

**Responsabilidade**: Atualizar quantidade de item

```typescript
// Exemplo de uso
const useCase = new UpdateItemQuantityUseCase(cartRepository);
const result = await useCase.execute({
  cart_id: 'uuid-cart',
  product_id: 'uuid-product',
  quantity: 5
});
```

**Regras de Negócio**:
- ✅ Carrinho deve estar `ACTIVE`
- ✅ Item deve existir no carrinho
- ✅ Quantidade ≤ 0 remove o item automaticamente
- ✅ Recalcula subtotal automaticamente

### 5. ClearCartUseCase

**Localização**: `application/use-cases/clear-cart/`

**Responsabilidade**: Limpar todos os itens do carrinho

```typescript
// Exemplo de uso
const useCase = new ClearCartUseCase(cartRepository);
const result = await useCase.execute({
  cart_id: 'uuid-cart'
});
```

**Regras de Negócio**:
- ✅ Carrinho deve estar `ACTIVE`
- ✅ Remove todos os itens
- ✅ Zera subtotal
- ✅ Emite eventos `CartClearedEvent` e `CartUpdatedEvent`

### 6. GetCartUseCase

**Localização**: `application/use-cases/get-cart/`

**Responsabilidade**: Buscar carrinho por ID

```typescript
// Exemplo de uso
const useCase = new GetCartUseCase(cartRepository);
const result = await useCase.execute({
  cart_id: 'uuid-cart'
});
```

---

## 🎭 Eventos de Domínio

### CartCreatedEvent

```typescript
export class CartCreatedEvent implements IDomainEvent {
  readonly aggregate_id: ValueObject;
  readonly occurred_on: Date;
  readonly event_version: number;
}
```

**Quando é emitido**: Criação de novo carrinho

### CartItemAddedEvent

```typescript
export class CartItemAddedEvent implements IDomainEvent {
  readonly aggregate_id: ValueObject;
  readonly product_id: Uuid;
  readonly occurred_on: Date;
  readonly event_version: number;
}
```

**Quando é emitido**: Adição de item ao carrinho

### CartItemRemovedEvent

```typescript
export class CartItemRemovedEvent implements IDomainEvent {
  readonly aggregate_id: ValueObject;
  readonly product_id: Uuid;
  readonly occurred_on: Date;
  readonly event_version: number;
}
```

**Quando é emitido**: Remoção de item do carrinho

### CartUpdatedEvent

```typescript
export class CartUpdatedEvent implements IDomainEvent {
  readonly aggregate_id: ValueObject;
  readonly occurred_on: Date;
  readonly event_version: number;
}
```

**Quando é emitido**: Qualquer atualização no carrinho

### CartClearedEvent

```typescript
export class CartClearedEvent implements IDomainEvent {
  readonly aggregate_id: ValueObject;
  readonly occurred_on: Date;
  readonly event_version: number;
}
```

**Quando é emitido**: Limpeza completa do carrinho

---

## 🗄️ Repository Interface

### ICartRepository

```typescript
export interface ICartRepository extends ISearchableRepository<
  Cart,
  CartId,
  CartFilter,
  CartSearchParams,
  CartSearchResult
> {
  // Métodos específicos do carrinho
  findByClientAndStore(client_id: Uuid, store_id: string): Promise<Cart | null>;
  findActiveByClient(client_id: Uuid, store_id: string): Promise<Cart | null>;
  findExpiredCarts(store_id: string): Promise<Cart[]>;
  countByStatus(store_id: string, status: CartStatus): Promise<number>;
}
```

### Filtros Disponíveis

```typescript
export type CartFilter = {
  store_id?: string;
  client_id?: Uuid;
  status?: CartStatus;
  expires_before?: Date;
  expires_after?: Date;
};
```

---

## 🧪 Testes

### Estrutura de Testes

Cada use case possui testes abrangentes em `__tests__/`:

```
__tests__/
├── create-cart.use-case.spec.ts
├── add-item-to-cart.use-case.spec.ts
├── remove-item-from-cart.use-case.spec.ts
├── update-item-quantity.use-case.spec.ts
├── clear-cart.use-case.spec.ts
└── get-cart.use-case.spec.ts
```

### Fake Builder para Testes

```typescript
// Exemplo de uso do CartFakeBuilder
const cart = CartFakeBuilder.aCart()
  .withClientId(new Uuid('client-123'))
  .withStoreId('store-456')
  .withActiveStatus()
  .withEmptyCart()
  .build();
```

### Executar Testes

```bash
# Todos os testes do módulo cart
npm test -- --testPathPattern=ecommerce.*cart

# Teste específico
npm test -- create-cart.use-case.spec.ts
```

---

## 🔒 Validações e Regras de Negócio

### Validações Automáticas

- ✅ **Multi-tenancy**: Todos os dados filtrados por `store_id`
- ✅ **UUIDs válidos**: Formato correto para IDs
- ✅ **Quantidades positivas**: `quantity > 0`
- ✅ **Preços positivos**: `unit_price > 0`
- ✅ **Status válidos**: Apenas transições permitidas
- ✅ **Datas válidas**: Expiração no futuro

### Invariantes do Domínio

- ✅ **Carrinho ativo**: Apenas carrinhos `ACTIVE` podem ser modificados
- ✅ **Não expirado**: Operações bloqueadas em carrinhos expirados
- ✅ **Subtotal consistente**: Sempre recalculado automaticamente
- ✅ **Itens únicos**: Um produto por entrada (quantidades consolidadas)

### Transições de Status

```
ACTIVE → ABANDONED    ✅ (abandono manual)
ACTIVE → CONVERTED    ✅ (conversão para pedido)
ACTIVE → EXPIRED      ✅ (expiração automática)
ABANDONED → ACTIVE    ❌ (não permitido)
CONVERTED → *         ❌ (estado final)
EXPIRED → *           ❌ (estado final)
```

---

## 🚀 Como Usar

### 1. Injeção de Dependência

```typescript
// Configuração do container DI
container.bind<ICartRepository>('CartRepository')
  .to(CartInMemoryRepository);

container.bind<CreateCartUseCase>('CreateCartUseCase')
  .toDynamicValue((context) => {
    const repo = context.container.get<ICartRepository>('CartRepository');
    return new CreateCartUseCase(repo);
  });
```

### 2. Exemplo de Controller

```typescript
@Controller('/carts')
export class CartController {
  constructor(
    private createCartUseCase: CreateCartUseCase,
    private addItemUseCase: AddItemToCartUseCase
  ) {}

  @Post()
  async createCart(@Body() input: CreateCartInput) {
    return await this.createCartUseCase.execute(input);
  }

  @Post(':id/items')
  async addItem(
    @Param('id') cartId: string,
    @Body() input: Omit<AddItemToCartInput, 'cart_id'>
  ) {
    return await this.addItemUseCase.execute({
      ...input,
      cart_id: cartId
    });
  }
}
```

### 3. Exemplo de Integração

```typescript
// Fluxo completo de carrinho
class CartService {
  async createShoppingFlow(clientId: string, storeId: string) {
    // 1. Criar carrinho
    const cart = await this.createCartUseCase.execute({
      client_id: clientId,
      store_id: storeId
    });

    // 2. Adicionar itens
    await this.addItemUseCase.execute({
      cart_id: cart.cart_id,
      product_id: 'product-123',
      product_name: 'Arroz 5kg',
      quantity: 2,
      unit_price: 15.99
    });

    // 3. Buscar carrinho atualizado
    return await this.getCartUseCase.execute({
      cart_id: cart.cart_id
    });
  }
}
```

---

## 🔄 Integrações Futuras

### Com Módulo Product

- ✅ Validação de disponibilidade de produtos
- ✅ Sincronização de preços em tempo real
- ✅ Verificação de produtos ativos

### Com Módulo Inventory

- ✅ Reserva de estoque ao adicionar itens
- ✅ Liberação de estoque ao remover itens
- ✅ Validação de quantidade disponível

### Com Módulo Sales

- ✅ Conversão de carrinho para venda
- ✅ Transferência de itens e totais
- ✅ Marcação como `CONVERTED`

---

## 📊 Métricas e Monitoramento

### Eventos para Analytics

```typescript
// Exemplos de métricas derivadas dos eventos
- Taxa de abandono de carrinho
- Tempo médio de vida do carrinho
- Produtos mais adicionados/removidos
- Valor médio do carrinho
- Conversão carrinho → pedido
```

### Queries Úteis

```typescript
// Carrinhos abandonados (para remarketing)
const abandonedCarts = await cartRepo.search(new CartSearchParams({
  filter: {
    store_id: 'store-123',
    status: CartStatus.ABANDONED
  }
}));

// Carrinhos próximos do vencimento
const expiringCarts = await cartRepo.search(new CartSearchParams({
  filter: {
    store_id: 'store-123',
    status: CartStatus.ACTIVE,
    expires_before: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h
  }
}));
```

---

## 🛠️ Troubleshooting

### Problemas Comuns

**1. Erro: "Cannot add items to inactive cart"**
- ✅ Verificar se carrinho está `ACTIVE`
- ✅ Verificar se não está expirado

**2. Erro: "Item not found in cart"**
- ✅ Verificar se `product_id` existe no carrinho
- ✅ Usar `hasItem()` antes de operações

**3. Erro: "EntityValidationError"**
- ✅ Verificar validações de entrada (UUIDs, quantidades, preços)
- ✅ Consultar logs de validação

### Debug

```typescript
// Verificar estado do carrinho
console.log('Cart status:', cart.status);
console.log('Is expired:', cart.isExpired());
console.log('Can be modified:', cart.canBeModified());
console.log('Items count:', cart.getItemCount());
```

---

## 📚 Referências

- **Domain Model**: `src/core/ecommerce/domain/cart.aggregate.ts`
- **Use Cases**: `src/core/ecommerce/application/use-cases/`
- **Tests**: `src/core/ecommerce/application/use-cases/*/__tests__/`
- **Repository**: `src/core/ecommerce/domain/repositories/cart.repository.interface.ts`
- **Events**: `src/core/ecommerce/domain/events/`

---

**📝 Última atualização**: Janeiro 2025  
**👥 Mantenedores**: Equipe de Desenvolvimento Supermarket-WR  
**🔗 Versão**: 1.0.0