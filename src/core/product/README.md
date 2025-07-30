# 🛒 Domínio Product

## Visão Geral

O domínio **Product** é o núcleo central do sistema de supermercado, responsável por gerenciar todas as informações relacionadas aos produtos comercializados. Este domínio abrange desde dados básicos como nome e preço até informações complexas como configurações fiscais, controle de estoque e validações de conformidade.

## 🏗️ Arquitetura

Implementa os padrões **Domain-Driven Design (DDD)** e **Arquitetura Hexagonal**, garantindo separação clara entre regras de negócio e infraestrutura.

## 📋 Campos da Entidade Product

| Campo               | Tipo             | Descrição                              |
| ------------------- | ---------------- | -------------------------------------- |
| `id`                | `ProductId`      | Identificador único do produto         |
| `name`              | `string`         | Nome do produto                        |
| `description`       | `string`         | Descrição detalhada do produto         |
| `sku`               | `string`         | Código SKU único                       |
| `barcode`           | `string`         | Código de barras                       |
| `category_id`       | `CategoryId`     | Referência à categoria                 |
| `unit_type`         | `UnitType`       | Tipo de unidade de medida              |
| `unit_weight`       | `number \| null` | Peso unitário (para produtos pesáveis) |
| `unit_volume`       | `number \| null` | Volume unitário (para bebidas)         |
| `cost_price`        | `number`         | Preço de custo                         |
| `sale_price`        | `number`         | Preço de venda                         |
| `ncm_code`          | `string`         | Código NCM para classificação fiscal   |
| `is_active`         | `boolean`        | Status de ativação do produto          |
| `requires_weighing` | `boolean`        | Indica se requer pesagem               |
| `is_beverage`       | `boolean`        | Indica se é bebida                     |
| `created_at`        | `Date`           | Data de criação                        |
| `updated_at`        | `Date`           | Data da última atualização             |

### Enums

#### UnitType

- `UNIT` - Unidade (produtos vendidos por unidade)
- `KILOGRAM` - Quilograma (produtos pesáveis)
- `GRAM` - Grama (produtos leves)
- `LITER` - Litro (líquidos)
- `MILLILITER` - Mililitro (pequenos volumes)
- `METER` - Metro (produtos lineares)
- `CENTIMETER` - Centímetro (pequenas medidas)
- `PACKAGE` - Pacote (produtos embalados)

## 🔧 Funcionalidades Principais

### Casos de Uso (Use Cases)

#### Gestão Básica

- **CreateProductUseCase**: Criação de novos produtos
- **UpdateProductUseCase**: Atualização de produtos existentes
- **GetProductUseCase**: Busca de produto por ID
- **ListProductsUseCase**: Listagem com filtros e paginação
- **DeleteProductUseCase**: Remoção de produtos

### Métodos da Entidade

#### Atualização de Propriedades

- `changeName(name: string)`: Altera o nome do produto
- `changeDescription(description: string)`: Atualiza a descrição
- `changeSku(sku: string)`: Modifica o código SKU
- `changeBarcode(barcode: string)`: Altera o código de barras
- `changeCategoryId(categoryId: CategoryId)`: Muda a categoria
- `changeUnitType(unitType: UnitType)`: Altera tipo de unidade

#### Gestão de Preços

- `changeCostPrice(price: number)`: Atualiza preço de custo
- `changeSalePrice(price: number)`: Modifica preço de venda
- `calculateMargin()`: Calcula margem de lucro
- `calculateMarkup()`: Calcula markup aplicado

#### Gestão de Medidas

- `changeUnitWeight(weight: number | null)`: Define peso unitário
- `changeUnitVolume(volume: number | null)`: Define volume unitário
- `setRequiresWeighing(requires: boolean)`: Configura necessidade de pesagem
- `setIsBeverage(isBeverage: boolean)`: Define como bebida

#### Regras de Negócio

- `activate()`: Ativa o produto
- `deactivate()`: Desativa o produto
- `isWeighable()`: Verifica se é produto pesável
- `isBeverageProduct()`: Verifica se é bebida
- `hasValidMargin()`: Valida margem mínima

## 🔍 Métodos de Consulta Específicos

### findActiveProducts()

Retorna todos os produtos ativos no sistema.

### findByCategoryId(categoryId: CategoryId)

Busca produtos de uma categoria específica.

### findByUnitType(unitType: UnitType)

Localiza produtos por tipo de unidade de medida.

### findWeighableProducts()

Retorna produtos que requerem pesagem.

### findBeverageProducts()

Busca produtos classificados como bebidas.

### findByNcmCode(ncmCode: string)

Localiza produtos por código NCM.

### findBySku(sku: string)

Busca produto por código SKU único.

### findByBarcode(barcode: string)

Localiza produto por código de barras.

## 🔒 Validações de Negócio

### Validações Automáticas

- **Nome obrigatório**: Produto deve ter nome válido
- **SKU único**: Código SKU deve ser único no sistema
- **Preços válidos**: Preços devem ser maiores que zero
- **Margem mínima**: Preço de venda deve ser maior que custo
- **NCM válido**: Código NCM deve ter formato correto
- **Peso para pesáveis**: Produtos pesáveis devem ter peso definido
- **Volume para bebidas**: Bebidas devem ter volume definido

### Validações de Campos

- `name`: Mínimo 3, máximo 100 caracteres
- `description`: Máximo 500 caracteres
- `sku`: Formato alfanumérico, máximo 20 caracteres
- `barcode`: Formato válido de código de barras
- `cost_price`: Maior que 0
- `sale_price`: Maior que cost_price
- `ncm_code`: Formato NCM válido (8 dígitos)
- `unit_weight`: Maior que 0 (quando aplicável)
- `unit_volume`: Maior que 0 (quando aplicável)

## 🧪 Testes

```bash
# Executar todos os testes do domínio
npm test src/core/product

# Executar testes específicos
npm test product.aggregate.spec.ts
npm test fiscal-validation.domain-service.spec.ts
```

## 🔧 Domain Services

### FiscalValidationDomainService

Serviço responsável por validar a conformidade fiscal de produtos, integrando com configurações fiscais.

**Métodos principais:**

- `validateFiscalCompliance(product)`: Valida conformidade fiscal
- `validateNcmCode(ncmCode)`: Valida código NCM
- `validateWeighableProduct(product)`: Valida produtos pesáveis
- `validateBeverageProduct(product)`: Valida produtos bebidas
- `validateMinimumMargin(product)`: Valida margem mínima

**Tipos de Retorno:**

- `FiscalValidationResult`: Resultado da validação com status e erros
- `FiscalConfigSummary`: Resumo das configurações fiscais aplicáveis

## 📚 Padrões Utilizados

- **Repository Pattern**: Abstração para persistência de dados
- **Use Case Pattern**: Encapsulamento de regras de aplicação
- **Aggregate Pattern**: Product como agregado principal
- **Value Objects**: ProductId como identificador tipado
- **Factory Pattern**: ProductValidatorFactory para validações
- **Domain Services**: FiscalValidationDomainService para validações complexas
- **Specification Pattern**: Validações de regras de negócio

## 🔄 Integração

O domínio **Product** integra-se com:

- **Category Domain**: Classificação e organização de produtos
- **Fiscal Config Domain**: Configurações fiscais e tributárias
- **Inventory Domain**: Controle de estoque e movimentações
- **Sales Domain**: Processamento de vendas
- **Pricing Domain**: Gestão de preços e promoções

### Dependências Externas

- Serviços de validação de códigos de barras
- APIs de consulta NCM
- Sistemas de precificação
- Integrações com fornecedores

### Estrutura de Pastas

src/core/product/
├── domain/
│ ├── product.aggregate.ts # Agregado principal
│ ├── product.repository.interface.ts # Interface do repositório
│ ├── product.validator.ts # Validações de negócio
│ ├── product-fake.builder.ts # Builder para testes
│ └── services/
│ └── fiscal-validation.domain-service.ts # Validações fiscais
├── application/
│ └── use-cases/ # Casos de uso da aplicação
└── infra/
└── db/ # Implementações de persistência
