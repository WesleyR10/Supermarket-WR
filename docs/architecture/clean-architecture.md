# 🏗️ Clean Architecture - Supermarket WR

Este documento descreve a implementação da **Clean Architecture** no projeto Supermarket WR, seguindo os princípios de Robert C. Martin (Uncle Bob).

## 🎯 Princípios Fundamentais

### 1. **Independência de Frameworks**

- O domínio não depende de frameworks externos
- Frameworks são detalhes de implementação
- Mudanças em frameworks não afetam a lógica de negócio

### 2. **Testabilidade**

- Toda a lógica de negócio é testável
- Dependências externas são injetadas
- Testes unitários sem necessidade de frameworks

### 3. **Independência de UI**

- Interface do usuário pode ser alterada facilmente
- Lógica de negócio não conhece detalhes da UI
- Múltiplas interfaces podem usar a mesma lógica

### 4. **Independência de Banco de Dados**

- Regras de negócio não dependem do banco
- Banco de dados é um detalhe de implementação
- Pode-se trocar de SQLite para PostgreSQL sem afetar o domínio

### 5. **Independência de Agentes Externos**

- APIs externas são detalhes de implementação
- Lógica de negócio não conhece serviços externos
- Facilita testes e manutenção

## 🏛️ Estrutura de Camadas

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
│  Controllers, DTOs, HTTP/WebSocket handlers                │
│  Responsável por: Receber requests e retornar responses    │
├─────────────────────────────────────────────────────────────┤
│                    Application Layer                        │
│  Use Cases, Application Services, Command/Query handlers   │
│  Responsável por: Orquestrar casos de uso                  │
├─────────────────────────────────────────────────────────────┤
│                      Domain Layer                           │
│  Entities, Value Objects, Domain Services, Events          │
│  Responsável por: Regras de negócio e lógica do domínio    │
├─────────────────────────────────────────────────────────────┤
│                   Infrastructure Layer                      │
│  Repositories, External Services, Database, Messaging      │
│  Responsável por: Detalhes técnicos e implementações       │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Organização do Código

```
src/
├── core/                           # Camada de Domínio
│   ├── shared/                     # Componentes compartilhados
│   │   ├── domain/                 # Entidades e Value Objects base
│   │   ├── application/            # Serviços de aplicação base
│   │   └── infra/                  # Infraestrutura base
│   ├── address/                    # Bounded Context: Address
│   │   ├── domain/                 # Entidades e regras de negócio
│   │   ├── application/            # Use Cases
│   │   └── infra/                  # Implementações técnicas
│   ├── category/                   # Bounded Context: Category
│   ├── inventory/                  # Bounded Context: Inventory
│   ├── sale/                       # Bounded Context: Sale
│   └── client/                     # Bounded Context: Client
├── presentation/                   # Camada de Apresentação
│   ├── controllers/                # Controllers HTTP
│   ├── dto/                        # Data Transfer Objects
│   └── middleware/                 # Middlewares
└── infrastructure/                 # Camada de Infraestrutura
    ├── database/                   # Configuração do banco
    ├── messaging/                  # Sistema de mensageria
    └── external/                   # Serviços externos
```

## 🔄 Fluxo de Dependências

### Regra da Dependência

As dependências apontam **sempre** para dentro, em direção ao domínio:

```
Presentation → Application → Domain ← Infrastructure
```

### Inversão de Dependência

- Interfaces são definidas na camada de domínio
- Implementações são fornecidas pela camada de infraestrutura
- Dependências são injetadas via construtor

## 🎯 Exemplos Práticos

### 1. Entity (Domínio)

```typescript
// src/core/sale/domain/sale.aggregate.ts
export class Sale extends AggregateRoot {
  constructor(
    private readonly id: SaleId,
    private readonly items: SaleItem[],
    private readonly total: Price,
    private readonly paymentMethod: PaymentMethod
  ) {
    super();
  }

  // Regras de negócio aqui
  addItem(item: SaleItem): void {
    // Lógica de negócio
  }
}
```

### 2. Repository Interface (Domínio)

```typescript
// src/core/sale/domain/repositories/sale.repository.interface.ts
export interface SaleRepository {
  save(sale: Sale): Promise<void>;
  findById(id: SaleId): Promise<Sale | null>;
  search(params: SearchParams): Promise<SearchResult<Sale>>;
}
```

### 3. Use Case (Aplicação)

```typescript
// src/core/sale/application/use-cases/create-sale/create-sale.use-case.ts
export class CreateSaleUseCase
  implements UseCase<CreateSaleInput, CreateSaleOutput>
{
  constructor(
    private readonly saleRepository: SaleRepository,
    private readonly unitOfWork: UnitOfWork
  ) {}

  async execute(input: CreateSaleInput): Promise<CreateSaleOutput> {
    // Orquestração do caso de uso
  }
}
```

### 4. Repository Implementation (Infraestrutura)

```typescript
// src/core/sale/infra/db/prisma/prisma-sale.repository.ts
export class PrismaSaleRepository implements SaleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(sale: Sale): Promise<void> {
    // Implementação com Prisma
  }
}
```

## 🧪 Testabilidade

### Testes Unitários

- Domínio testável sem dependências externas
- Use Cases testáveis com mocks
- Value Objects imutáveis e testáveis

### Testes de Integração

- Repositories testáveis com banco em memória
- Use Cases testáveis com dependências reais
- Controllers testáveis com HTTP requests

## 🔧 Configuração de Dependências

### Dependency Injection

```typescript
// src/core/sale/infra/di/sale.module.ts
@Module({
  providers: [
    {
      provide: "SaleRepository",
      useClass: PrismaSaleRepository,
    },
    CreateSaleUseCase,
    UpdateSaleUseCase,
  ],
  exports: [CreateSaleUseCase, UpdateSaleUseCase],
})
export class SaleModule {}
```

## 📋 Benefícios

### 1. **Manutenibilidade**

- Código organizado e fácil de entender
- Mudanças isoladas em camadas específicas
- Refatoração segura

### 2. **Testabilidade**

- Testes unitários rápidos
- Mocks fáceis de criar
- Cobertura de código alta

### 3. **Flexibilidade**

- Troca de tecnologias sem afetar domínio
- Múltiplas interfaces para mesma lógica
- Evolução independente das camadas

### 4. **Escalabilidade**

- Novos bounded contexts fáceis de adicionar
- Reutilização de componentes
- Separação clara de responsabilidades

## 🚀 Próximos Passos

1. **Implementar CQRS** para separar comandos e consultas
2. **Adicionar Event Sourcing** para auditoria completa
3. **Implementar Saga Pattern** para transações distribuídas
4. **Adicionar API Gateway** para múltiplas interfaces

---

**Referências:**

- [Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Domain-Driven Design - Eric Evans](https://domainlanguage.com/ddd/)
