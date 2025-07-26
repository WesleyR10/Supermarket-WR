# Category Domain

Este módulo implementa o domínio de **Categorias** para o sistema de supermercado, seguindo os princípios de Domain-Driven Design (DDD) e Arquitetura Hexagonal.

## 📋 Visão Geral

O domínio de categorias gerencia a organização hierárquica de produtos no supermercado, incluindo funcionalidades específicas como:

- Gestão de categorias e subcategorias
- Configuração de alíquotas de impostos por categoria
- Definição de margens padrão para precificação
- Controle de produtos que requerem data de validade
- Ordenação para exibição no sistema
- Ícones para interface gráfica

## 🎯 Casos de Uso

### CreateCategoryUseCase

Cria uma nova categoria com validações de negócio.

**Input:**

- `store_id`: ID da loja
- `name`: Nome da categoria
- `description?`: Descrição opcional
- `parent_category_id?`: ID da categoria pai
- `tax_rate?`: Alíquota de imposto
- `default_margin_percentage?`: Margem padrão
- `requires_expiry_date?`: Se requer data de validade
- `display_order?`: Ordem de exibição
- `icon_name?`: Nome do ícone

### UpdateCategoryUseCase

Atualiza uma categoria existente.

### GetCategoryUseCase

Busca uma categoria por ID.

### ListCategoriesUseCase

Lista categorias com filtros, paginação e ordenação.

**Filtros disponíveis:**

- Por nome
- Por descrição
- Por ícone
- Categorias ativas
- Categorias raiz
- Por categoria pai
- Categorias que requerem validade

### DeleteCategoryUseCase

Remove uma categoria do sistema.

## 🏪 Campos Específicos do Supermercado

### tax_rate

Alíquota de imposto específica da categoria (ex: 18.5 para 18.5%).

### default_margin_percentage

Margem padrão para precificação de produtos desta categoria (ex: 30.0 para 30%).

### requires_expiry_date

Indica se produtos desta categoria precisam de data de validade:

- `true`: Para perecíveis (laticínios, carnes, etc.)
- `false`: Para não-perecíveis (produtos de limpeza, etc.)

### display_order

Ordem de exibição da categoria na interface do sistema.

### icon_name

Nome do ícone para exibição na interface gráfica.

### parent_category_id

Permite criar hierarquia de categorias (categoria pai).

## 🔍 Métodos de Consulta Específicos

### findActiveCategories()

Busca apenas categorias ativas.

### findRootCategories()

Busca categorias raiz (sem categoria pai).

### findByParentId(parentId)

Busca subcategorias de uma categoria específica.

### findPerishableCategories()

Busca categorias que requerem data de validade.

### findPromotionEligibleCategories()

Busca categorias elegíveis para promoções.

## 🧪 Testes

O domínio possui cobertura completa de testes:

- **Testes de Domínio**: Validam o agregado e suas regras de negócio
- **Testes de Casos de Uso**: Validam a lógica de aplicação
- **Testes de Repositório**: Validam a implementação in-memory

```bash
# Executar testes do domínio category
npm test -- category
```

## 📝 Exemplos de Uso

### Criando uma categoria raiz

```typescript
const category = Category.create({
  store_id: "store-123",
  name: "Bebidas",
  description: "Todas as bebidas",
  tax_rate: 18.0,
  default_margin_percentage: 25.0,
  display_order: 1,
  icon_name: "drinks-icon",
});
```

### Criando uma subcategoria

```typescript
const subcategory = Category.create({
  store_id: "store-123",
  name: "Refrigerantes",
  parent_category_id: parentCategory.category_id.id,
  requires_expiry_date: true,
  display_order: 2,
});
```

### Buscando categorias com filtros

```typescript
const useCase = new ListCategoriesUseCase(repository);
const result = await useCase.execute({
  filter: "Bebidas",
  sort: "display_order",
  sort_dir: "asc",
});
```

## 🔧 Validações

O domínio implementa validações robustas:

- **Nome**: Obrigatório, máximo 255 caracteres
- **Descrição**: Opcional, máximo 500 caracteres
- **Tax Rate**: Entre 0 e 100
- **Margin Percentage**: Entre 0 e 1000
- **Display Order**: Número positivo
- **Store ID**: Obrigatório

## 🏗️ Estrutura do Domínio

category/
├── domain/
│ ├── tests /
│ │ └── category.aggregate.spec.ts
│ ├── category.aggregate.ts # Agregado principal
│ ├── category.repository.interface.ts # Interface do repositório
│ ├── category.validator.ts # Validações de negócio
│ └── category-fake.builder.ts # Builder para testes
├── application/
│ ├── use-cases/
│ │ ├── create-category/
│ │ ├── update-category/
│ │ ├── get-category/
│ │ ├── list-categories/
│ │ └── delete-category/
│ ├── common/
│ │ └── category.output.ts
│ └── index.ts
└── infra/
└── db/
└── in-memory/
├── category-in-memory.repository.ts
└── category-in-memory.repository.spec.ts

_Este README.md visa fornecer uma visão clara e concisa do domínio Category, facilitando o entendimento e a colaboração entre os desenvolvedores._

