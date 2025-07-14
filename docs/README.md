# 📚 Documentação - Supermarket WR

Bem-vindo à documentação do projeto **Supermarket WR** - Sistema Integrado de Gestão e E-commerce para Supermercados.

## 🗂️ Estrutura da Documentação

```
docs/
├── README.md                    # Este arquivo - Navegação principal
├── workflow/                    # Workflows e processos
│   ├── git-workflow.md         # Git Flow e Git Lintzen
│   └── development-process.md   # Processo de desenvolvimento
├── architecture/               # Arquitetura e design
│   ├── clean-architecture.md   # Princípios da Clean Architecture
│   ├── domain-model.md         # Modelo de domínio
│   └── bounded-contexts.md     # Contextos delimitados
├── development/                # Guias de desenvolvimento
│   ├── setup.md               # Configuração do ambiente
│   ├── coding-standards.md    # Padrões de código
│   └── testing.md             # Estratégias de teste
└── deployment/                # Deploy e infraestrutura
    ├── docker.md              # Configuração Docker
    └── production.md          # Deploy em produção
```

## 🚀 Início Rápido

### Para Desenvolvedores

1. [Configuração do Ambiente](development/setup.md)
2. [Workflow Git](workflow/git-workflow.md)
3. [Padrões de Código](development/coding-standards.md)

### Para Arquitetos

1. [Clean Architecture](architecture/clean-architecture.md)
2. [Modelo de Domínio](architecture/domain-model.md)
3. [Contextos Delimitados](architecture/bounded-contexts.md)

### Para DevOps

1. [Configuração Docker](deployment/docker.md)
2. [Deploy em Produção](deployment/production.md)

## 🏗️ Visão Geral da Arquitetura

O projeto segue **Clean Architecture** com **Domain-Driven Design (DDD)**:

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
│  (Controllers, DTOs, HTTP/WebSocket handlers)              │
├─────────────────────────────────────────────────────────────┤
│                    Application Layer                        │
│  (Use Cases, Application Services, Command/Query handlers) │
├─────────────────────────────────────────────────────────────┤
│                      Domain Layer                           │
│  (Entities, Value Objects, Domain Services, Events)        │
├─────────────────────────────────────────────────────────────┤
│                   Infrastructure Layer                      │
│  (Repositories, External Services, Database, Messaging)    │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Bounded Contexts

1. **Address**: Gestão de endereços
2. **Category**: Categorização de produtos
3. **Inventory**: Controle de estoque
4. **Sale**: Sistema de vendas
5. **Client**: Gestão de clientes
6. **Employee**: Gestão de funcionários
7. **E-commerce**: Pedidos online

## 🔄 Workflow de Desenvolvimento

- **Git Flow** para controle de versão
- **Git Lintzen** para padronização de commits
- **Clean Architecture** para organização do código
- **DDD** para modelagem do domínio
- **TDD** para desenvolvimento de testes

## 📋 Contribuição

Para contribuir com a documentação:

1. Siga o [workflow Git](workflow/git-workflow.md)
2. Use o padrão de commits do Git Lintzen
3. Mantenha a documentação atualizada
4. Adicione exemplos práticos quando possível

## 🔗 Links Úteis

- [Repositório do Projeto](https://github.com/seu-usuario/supermarket-wr)
- [Issues](https://github.com/seu-usuario/supermarket-wr/issues)
- [Pull Requests](https://github.com/seu-usuario/supermarket-wr/pulls)

---

**Última atualização**: $(date)
**Versão da documentação**: 1.0.0
