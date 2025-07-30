# 🧾 Domínio Fiscal Config

## Visão Geral

O domínio **Fiscal Config** é responsável por gerenciar as configurações fiscais aplicáveis aos produtos no sistema de supermercado. Este domínio centraliza as regras tributárias, alíquotas de impostos e configurações específicas por tipo de produto, garantindo conformidade fiscal e cálculos precisos de tributos.

## 🏗️ Arquitetura

Implementa os padrões **Domain-Driven Design (DDD)** e **Arquitetura Hexagonal**, garantindo separação clara entre regras de negócio e infraestrutura.

## 📋 Campos da Entidade FiscalConfig

| Campo            | Tipo               | Descrição                                  |
| ---------------- | ------------------ | ------------------------------------------ |
| `id`             | `FiscalConfigId`   | Identificador único da configuração fiscal |
| `name`           | `string`           | Nome da configuração fiscal                |
| `description`    | `string`           | Descrição detalhada da configuração        |
| `type`           | `FiscalConfigType` | Tipo da configuração fiscal                |
| `tax_rate`       | `number`           | Alíquota do imposto (percentual)           |
| `ncm_codes`      | `string[]`         | Códigos NCM aplicáveis                     |
| `state_codes`    | `string[]`         | Códigos dos estados onde se aplica         |
| `is_active`      | `boolean`          | Status de ativação da configuração         |
| `effective_date` | `Date`             | Data de início de vigência                 |
| `expiry_date`    | `Date \| null`     | Data de expiração (opcional)               |
| `created_at`     | `Date`             | Data de criação                            |
| `updated_at`     | `Date`             | Data da última atualização                 |

### Enums

#### FiscalConfigType

- `ICMS` - Imposto sobre Circulação de Mercadorias e Serviços
- `IPI` - Imposto sobre Produtos Industrializados
- `PIS` - Programa de Integração Social
- `COFINS` - Contribuição para o Financiamento da Seguridade Social
- `ISS` - Imposto sobre Serviços
- `CSLL` - Contribuição Social sobre o Lucro Líquido
- `IRPJ` - Imposto de Renda Pessoa Jurídica
- `SIMPLES` - Regime tributário simplificado

## 🔧 Funcionalidades Principais

### Casos de Uso (Use Cases)

#### Gestão Básica

- **CreateFiscalConfigUseCase**: Criação de novas configurações fiscais
- **UpdateFiscalConfigUseCase**: Atualização de configurações existentes
- **GetFiscalConfigUseCase**: Busca de configuração por ID
- **ListFiscalConfigsUseCase**: Listagem com filtros e paginação
- **DeleteFiscalConfigUseCase**: Remoção de configurações

### Métodos da Entidade

#### Atualização de Propriedades

- `changeName(name: string)`: Altera o nome da configuração
- `changeDescription(description: string)`: Atualiza a descrição
- `changeTaxRate(rate: number)`: Modifica a alíquota
- `changeEffectiveDate(date: Date)`: Altera data de vigência
- `changeExpiryDate(date: Date | null)`: Define data de expiração

#### Gestão de Códigos

- `addNcmCode(code: string)`: Adiciona código NCM
- `removeNcmCode(code: string)`: Remove código NCM
- `addStateCode(code: string)`: Adiciona código de estado
- `removeStateCode(code: string)`: Remove código de estado

#### Regras de Negócio

- `activate()`: Ativa a configuração fiscal
- `deactivate()`: Desativa a configuração fiscal
- `isEffective(date?: Date)`: Verifica se está vigente
- `isApplicableToNcm(ncmCode: string)`: Verifica aplicabilidade por NCM
- `isApplicableToState(stateCode: string)`: Verifica aplicabilidade por estado

## 🔍 Métodos de Consulta Específicos

### findActiveConfigs()

Retorna todas as configurações fiscais ativas no momento atual.

### findByType(type: FiscalConfigType)

Busca configurações por tipo específico (ICMS, IPI, etc.).

### findByNcmCode(ncmCode: string)

Localiza configurações aplicáveis a um código NCM específico.

### findByStateCode(stateCode: string)

Busca configurações válidas para um estado específico.

### findEffectiveConfigs(date?: Date)

Retorna configurações vigentes em uma data específica.

## 🔒 Validações de Negócio

### Validações Automáticas

- **Nome obrigatório**: Configuração deve ter nome válido
- **Tipo válido**: Deve ser um dos tipos enum definidos
- **Alíquota válida**: Taxa deve estar entre 0 e 100%
- **Datas consistentes**: Data de expiração deve ser posterior à vigência
- **Códigos únicos**: NCM e estados não podem ser duplicados
- **Vigência válida**: Data de vigência não pode ser no passado

### Validações de Campos

- `name`: Mínimo 3, máximo 100 caracteres
- `description`: Máximo 500 caracteres
- `tax_rate`: Entre 0 e 100
- `ncm_codes`: Formato válido de NCM (8 dígitos)
- `state_codes`: Códigos de estado válidos (2 caracteres)

## 🧪 Testes

```bash
# Executar todos os testes do domínio
npm test src/core/fiscal-config

# Executar testes específicos
npm test fiscal-config.aggregate.spec.ts
npm test fiscal-calculation.service.spec.ts
```

## 🔧 Domain Services

### FiscalCalculationService

Serviço responsável por calcular impostos aplicáveis a produtos com base nas configurações fiscais vigentes.

**Métodos principais:**

- `calculateTaxes(product, configs)`: Calcula impostos para um produto
- `getApplicableConfigs(product)`: Retorna configurações aplicáveis
- `calculateTotalTaxRate(configs)`: Calcula alíquota total

## 📚 Padrões Utilizados

- **Repository Pattern**: Abstração para persistência de dados
- **Use Case Pattern**: Encapsulamento de regras de aplicação
- **Aggregate Pattern**: FiscalConfig como agregado principal
- **Value Objects**: FiscalConfigId como identificador tipado
- **Factory Pattern**: FiscalConfigValidatorFactory para validações
- **Domain Services**: FiscalCalculationService para cálculos complexos
- **Specification Pattern**: Validações de regras de negócio

## 🔄 Integração

O domínio **Fiscal Config** integra-se com:

- **Product Domain**: Fornece configurações fiscais para produtos
- **Inventory Domain**: Cálculos de custos com impostos
- **Sales Domain**: Aplicação de impostos em vendas
- **Reports Domain**: Relatórios fiscais e tributários

### Dependências Externas

- Serviços de consulta de NCM
- APIs de validação fiscal
- Sistemas de contabilidade

### Estrutura de Pastas

src/core/fiscal-config/
├── domain/
│ ├── fiscal-config.aggregate.ts # Agregado principal
│ ├── fiscal-config.repository.interface.ts # Interface do repositório
│ ├── fiscal-config.validator.ts # Validações de negócio
│ ├── fiscal-config-fake.builder.ts # Builder para testes
│ └── services/
│ └── fiscal-calculation.service.ts # Serviço de cálculos
├── application/
│ └── use-cases/ # Casos de uso da aplicação
└── infra/
└── db/ # Implementações de persistência
