# Módulo E-commerce

Este módulo gerencia o sistema de e-commerce do Supermarket-WR, permitindo a criação, gerenciamento e processamento de pedidos online.

## Visão Geral

O módulo de e-commerce foi desenvolvido seguindo os princípios de **Clean Architecture** e **Domain-Driven Design (DDD)**, garantindo:

- **Multi-tenancy**: Isolamento completo de dados por loja (store_id)
- **Offline-first**: Capacidade de operar offline e sincronizar posteriormente
- **Integração com PDV**: Sincronização em tempo real de catálogo, estoque e preços
- **Compliance fiscal**: Preparação para integração com sistemas fiscais

## Arquitetura

```
src/core/ecommerce/
├── domain/              # Entidades e regras de negócio
│   ├── cart.aggregate.ts            # Agregado do carrinho
│   ├── online-order.aggregate.ts    # Agregado raiz do pedido
│   ├── cart-fake.builder.ts         # Builder para testes do carrinho
│   ├── online-order-fake.builder.ts # Builder para testes
│   ├── events/          # Eventos de domínio
│   │   ├── cart-created.event.ts
│   │   ├── cart-item-added.event.ts
│   │   ├── cart-item-removed.event.ts
│   │   ├── cart-updated.event.ts
│   │   └── cart-cleared.event.ts
│   ├── repositories/    # Interfaces dos repositórios
│   │   ├── cart.repository.interface.ts
│   │   └── online-order.repository.interface.ts
│   └── __tests__/       # Testes unitários do domínio
├── application/         # Casos de uso e aplicação
│   └── use-cases/       # Implementações dos casos de uso
│       ├── create-cart/
│       ├── add-item-to-cart/
│       ├── remove-item-from-cart/
│       ├── update-item-quantity/
│       ├── clear-cart/
│       ├── get-cart/
│       ├── create-online-order/
│       ├── update-online-order/
│       ├── list-online-orders/
│       ├── get-online-order/
│       └── delete-online-order/
├── infra/              # Infraestrutura
│   └── db/
│       └── in-memory/  # Repositórios em memória para testes
│           ├── cart-in-memory.repository.ts
│           └── online-order-in-memory.repository.ts
├── docs/               # Documentação específica
│   ├── cart-module-guide.md         # Guia completo do módulo Cart
│   └── estimated-delivery-service.md # Documentação do serviço de entrega
└── validators/         # Validadores de domínio
```

## Entidades Principais

### Cart (Carrinho de Compras)

O módulo Cart gerencia carrinhos de compras com funcionalidades completas:

#### Características
- **Multi-tenant**: Isolamento por loja (`store_id`)
- **Event-driven**: Emite eventos para auditoria
- **Offline-first**: Funciona sem conectividade
- **Type-safe**: Validações rigorosas em TypeScript

#### Status do Carrinho
- `ACTIVE`: Carrinho ativo para modificações
- `ABANDONED`: Carrinho abandonado pelo cliente
- `CONVERTED`: Convertido em pedido
- `EXPIRED`: Expirado automaticamente

#### Use Cases Implementados
- **CreateCartUseCase**: Criar novo carrinho ou retornar ativo existente
- **AddItemToCartUseCase**: Adicionar itens com consolidação automática
- **RemoveItemFromCartUseCase**: Remover itens específicos
- **UpdateItemQuantityUseCase**: Atualizar quantidades
- **ClearCartUseCase**: Limpar todos os itens
- **GetCartUseCase**: Buscar carrinho por ID

> 📚 **Documentação Completa**: Consulte o [Guia do Módulo Cart](./docs/cart-module-guide.md) para informações detalhadas sobre implementação, arquitetura e exemplos de uso.

### OnlineOrder (Pedido Online)

Representa um pedido realizado através do e-commerce com as seguintes características:

#### Campos Obrigatórios
- `store_id`: Identificador da loja (multi-tenancy)
- `client_id`: Identificador do cliente
- `items`: Array de itens do pedido
  - `product_id`: ID do produto
  - `product_name`: Nome do produto
  - `quantity`: Quantidade (deve ser > 0)
  - `unit_price`: Preço unitário (deve ser > 0)
- `delivery_address`: Endereço de entrega
  - `street`, `number`, `neighborhood`, `city`, `state`, `zip_code`
  - `latitude`, `longitude` (para otimização de rotas)
- `delivery_fee`: Taxa de entrega (>= 0)
- `payment_method`: Método de pagamento

#### Campos Opcionais
- `notes`: Observações do pedido
- `estimated_delivery`: Data estimada de entrega

#### Status do Pedido
- `PENDING`: Aguardando confirmação
- `CONFIRMED`: Pedido confirmado
- `PREPARING`: Em preparação
- `OUT_FOR_DELIVERY`: Saiu para entrega
- `DELIVERED`: Entregue
- `CANCELLED`: Cancelado

#### Cálculos Automáticos
- `subtotal`: Soma dos valores dos itens
- `total`: subtotal + delivery_fee

## Casos de Uso

### 1. Create Online Order
```typescript
const useCase = new CreateOnlineOrderUseCase(repository);
const order = await useCase.execute({
  store_id: 'store-123',
  client_id: 'client-456',
  items: [{
    product_id: 'prod-123',
    product_name: 'Arroz 5kg',
    quantity: 2,
    unit_price: 15.99
  }],
  delivery_address: {
    street: 'Rua das Flores',
    number: '123',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    zip_code: '01234-567'
  },
  delivery_fee: 5.99,
  payment_method: 'credit_card'
});
```

### 2. Update Online Order
Permite atualizar observações, endereço de entrega e data estimada.

### 3. List Online Orders
Listagem com paginação e filtros:
- Por loja (store_id)
- Por cliente (client_id)
- Por status
- Ordenação por data ou valor

### 4. Get Online Order
Busca detalhada de um pedido específico.

### 5. Delete Online Order
Exclusão lógica de pedidos (soft delete).

## Validações

O sistema implementa validações rigorosas:

- **Multi-tenancy**: Todos os dados são filtrados por store_id
- **Quantidade**: Deve ser maior que 0
- **Preço**: Deve ser maior que 0
- **Endereço**: Campos obrigatórios validados
- **Status**: Transições válidas entre status
- **UUIDs**: Formato válido para IDs

## Integração com PDV

O módulo está preparado para:
- Sincronizar estoque em tempo real
- Atualizar preços automaticamente
- Reservar produtos no estoque
- Gerenciar disponibilidade de produtos

## Testes

O módulo inclui testes abrangentes:

- **Testes Unitários**: Cobertura completa das entidades e casos de uso
- **Testes de Integração**: Verificação dos fluxos completos
- **Testes de Multi-tenancy**: Isolamento de dados por loja
- **Testes de Validação**: Verificação de todas as regras de negócio

### Executando os Testes
```bash
# Testes unitários do domínio
npm test src/core/ecommerce/domain/__tests__

# Testes dos casos de uso
npm test src/core/ecommerce/application/use-cases

# Testes específicos do módulo Cart
npm test -- --testPathPattern=ecommerce.*cart

# Testes de integração
npm test tests/integration/ecommerce
```

## Uso Básico

### Instalação
```typescript
// Importações para Cart
import {
  CreateCartUseCase,
  AddItemToCartUseCase,
  RemoveItemFromCartUseCase,
  UpdateItemQuantityUseCase,
  ClearCartUseCase,
  GetCartUseCase,
  CartInMemoryRepository
} from '@core/ecommerce';

// Importações para Online Order
import { 
  CreateOnlineOrderUseCase,
  UpdateOnlineOrderUseCase,
  ListOnlineOrdersUseCase,
  GetOnlineOrderUseCase,
  DeleteOnlineOrderUseCase,
  OnlineOrderInMemoryRepository
} from '@core/ecommerce';

// Configuração dos repositórios
const cartRepository = new CartInMemoryRepository();
const orderRepository = new OnlineOrderInMemoryRepository();

// Criação dos casos de uso do Cart
const createCartUseCase = new CreateCartUseCase(cartRepository);
const addItemUseCase = new AddItemToCartUseCase(cartRepository);
const removeItemUseCase = new RemoveItemFromCartUseCase(cartRepository);
const updateQuantityUseCase = new UpdateItemQuantityUseCase(cartRepository);
const clearCartUseCase = new ClearCartUseCase(cartRepository);
const getCartUseCase = new GetCartUseCase(cartRepository);

// Criação dos casos de uso do Online Order
const createOrderUseCase = new CreateOnlineOrderUseCase(orderRepository);
const updateOrderUseCase = new UpdateOnlineOrderUseCase(orderRepository);
const listOrdersUseCase = new ListOnlineOrdersUseCase(orderRepository);
const getOrderUseCase = new GetOnlineOrderUseCase(orderRepository);
const deleteOrderUseCase = new DeleteOnlineOrderUseCase(orderRepository);
```

### Exemplos de Uso

#### Fluxo Completo: Carrinho → Pedido
```typescript
// 1. Criar carrinho
const cart = await createCartUseCase.execute({
  client_id: 'cliente-123',
  store_id: 'loja-001'
});

// 2. Adicionar itens ao carrinho
await addItemUseCase.execute({
  cart_id: cart.cart_id,
  product_id: 'prod-001',
  product_name: 'Leite Integral 1L',
  quantity: 3,
  unit_price: 4.99
});

// 3. Converter carrinho em pedido
const order = await createOrderUseCase.execute({
  store_id: cart.store_id,
  client_id: cart.client_id,
  items: cart.items.map(item => ({
    product_id: item.product_id,
    product_name: item.product_name,
    quantity: item.quantity.value,
    unit_price: item.unit_price.value
  })),
  delivery_address: {
    street: 'Av. Principal',
    number: '1000',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    zip_code: '01000-000'
  },
  delivery_fee: 8.50,
  payment_method: 'credit_card'
});
```

#### Criar um Pedido Direto
```typescript
const order = await createUseCase.execute({
  store_id: 'loja-001',
  client_id: 'cliente-123',
  items: [{
    product_id: 'prod-001',
    product_name: 'Leite Integral 1L',
    quantity: 3,
    unit_price: 4.99
  }],
  delivery_address: {
    street: 'Av. Principal',
    number: '1000',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    zip_code: '01000-000'
  },
  delivery_fee: 8.50,
  payment_method: 'credit_card',
  notes: 'Tocar interfone do apto 201'
});
```

#### Listar Pedidos com Filtros
```typescript
const orders = await listUseCase.execute({
  store_id: 'loja-001',
  client_id: 'cliente-123',
  status: 'PENDING',
  page: 1,
  per_page: 10
});
```

## Documentação Adicional

- 📚 **[Guia Completo do Módulo Cart](./docs/cart-module-guide.md)**: Documentação detalhada sobre arquitetura, implementação e uso do sistema de carrinho
- 🚚 **[Serviço de Entrega](./docs/estimated-delivery-service.md)**: Documentação do sistema de cálculo de tempo de entrega

## Próximos Passos

### Cart Module
- [x] ✅ Implementação completa dos use cases
- [x] ✅ Sistema de eventos de domínio
- [x] ✅ Validações e regras de negócio
- [x] ✅ Testes unitários abrangentes
- [x] ✅ Documentação completa
- [ ] Integração com módulo Product (validação de disponibilidade)
- [ ] Integração com módulo Inventory (reserva de estoque)
- [ ] Conversão automática carrinho → pedido

### Online Order Module
- [ ] Implementar repositório com Prisma
- [ ] Adicionar integração com serviços de pagamento
- [ ] Implementar sistema de notificações
- [ ] Adicionar rastreamento de entrega em tempo real
- [ ] Integração com sistemas de frete
- [ ] Implementar cupons de desconto
- [ ] Adicionar histórico de pedidos do cliente

## Suporte

Para dúvidas ou sugestões:
- 📚 Consulte a [documentação específica](./docs/) de cada módulo
- 🛠️ Verifique os exemplos de uso nos testes unitários
- 🐛 Abra uma issue no repositório para reportar problemas
- 💡 Contribua com melhorias através de pull requests