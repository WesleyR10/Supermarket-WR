# 🏠 Domínio Address

## Visão Geral

O domínio **Address** é responsável por gerenciar informações de endereço para diferentes entidades (clientes, lojas, fornecedores) dentro do sistema do supermercado. Ele garante a padronização, validação e fácil recuperação dos dados de localização.

## 🏗️ Arquitetura

Este domínio segue os princípios de **Domain-Driven Design (DDD)** e **Arquitetura Hexagonal**, com uma clara separação entre as camadas de Domínio, Aplicação e Infraestrutura.

## 📋 Campos da Entidade Address

| Campo          | Tipo          | Descrição                                 |
| -------------- | ------------- | ----------------------------------------- |
| `address_id`   | AddressId     | Identificador único do endereço           |
| `client_id`    | string        | ID do cliente associado (opcional)        |
| `store_id`     | string        | ID da loja associada (opcional)           |
| `supplier_id`  | string        | ID do fornecedor associado (opcional)     |
| `street`       | string        | Nome da rua                               |
| `number`       | string        | Número do imóvel                          |
| `complement`   | string        | Complemento (apto, sala, etc.) - opcional |
| `neighborhood` | string        | Bairro                                    |
| `city`         | string        | Cidade                                    |
| `state`        | string        | Estado (UF)                               |
| `zipcode`      | string        | Código de Endereçamento Postal (CEP)      |
| `address_type` | AddressType   | Tipo de endereço (enum)                   |
| `is_primary`   | boolean       | Indica se é o endereço principal          |
| `status`       | AddressStatus | Status do endereço (enum)                 |
| `created_at`   | Date          | Data de criação do registro               |
| `updated_at`   | Date          | Data da última atualização                |
| `deleted_at`   | Date          | Data de exclusão (exclusão lógica)        |

## 🏷️ Enums do Domínio

### AddressType

- `HOME` - Endereço residencial
- `WORK` - Endereço comercial
- `HEADQUARTERS` - Matriz
- `BRANCH` - Filial
- `WAREHOUSE` - Armazém
- `DELIVERY` - Endereço de entrega
- `BILLING` - Endereço de cobrança

### AddressStatus

- `ACTIVE` - Ativo
- `INACTIVE` - Inativo
- `DELETED` - Deletado

## 🔧 Funcionalidades Principais

### Casos de Uso (Use Cases)

Os casos de uso orquestram as operações de negócio e interagem com o domínio e a infraestrutura.

#### Gestão Básica de Endereços

- **Criar Endereço**: `CreateAddressUseCase`
- **Atualizar Endereço**: `UpdateAddressUseCase`
- **Listar Endereços**: `ListAddressesUseCase`
- **Obter Endereço por ID**: `GetAddressUseCase`
- **Deletar Endereço**: `DeleteAddressUseCase`

### Métodos da Entidade `Address`

A entidade `Address` encapsula a lógica de negócio e as regras de validação.

#### Métodos de Estado e Ação

- `activate()`: Ativa o endereço
- `deactivate()`: Desativa o endereço
- `markAsDeleted()`: Marca o endereço como deletado (exclusão lógica)
- `setAsPrimary()`: Define este endereço como principal
- `unsetAsPrimary()`: Remove o status de principal deste endereço
- `updateAddress(props)`: Atualiza as propriedades do endereço

#### Métodos de Validação e Regra de Negócio

- `validateSinglePrimaryAddress(addresses, clientId, newAddressIsPrimary)`: Valida que apenas um endereço seja primário por cliente
- `changePrimaryAddress(addresses, clientId, newPrimaryAddressId)`: Gerencia a mudança de endereço primário
- `isActive()`: Verifica se o endereço está ativo
- `isDeleted()`: Verifica se o endereço está marcado como deletado
- `isPrimary()`: Verifica se é o endereço principal
- `isDeliveryAddress()`: Verifica se é um endereço de entrega
- `isBillingAddress()`: Verifica se é um endereço de cobrança
- `isBusinessAddress()`: Verifica se é um endereço comercial (matriz, filial, armazém)
- `isResidentialAddress()`: Verifica se é um endereço residencial (casa, trabalho)
- `getFullAddress()`: Retorna o endereço completo formatado
- `canReceiveDelivery()`: Verifica se o endereço é apto para receber entregas
- `isValidForBilling()`: Verifica se o endereço é válido para cobrança

## 🗄️ Métodos do Repositório

O repositório `IAddressRepository` oferece métodos específicos para consultas de endereços:

### Métodos de Busca por Entidade

- `findByClientId(clientId)`: Retorna todos os endereços de um cliente
- `findByStoreId(storeId)`: Retorna todos os endereços de uma loja
- `findBySupplier(supplierId)`: Retorna todos os endereços de um fornecedor

### Métodos de Busca por Características

- `findByAddressType(addressType)`: Retorna endereços de um tipo específico
- `findByZipcode(zipcode)`: Retorna endereços com um CEP específico
- `findByCity(city)`: Retorna endereços de uma cidade específica
- `findByState(state)`: Retorna endereços de um estado específico

### Métodos de Endereço Principal

- `findPrimaryAddress(entityId, entityType)`: Retorna o endereço principal de uma entidade
- `findPrimaryAddressByClientId(clientId)`: Retorna o endereço principal de um cliente
- `changePrimaryAddress(clientId, newPrimaryAddressId)`: Altera o endereço principal

### Métodos de Status

- `findActiveAddressesByClientId(clientId)`: Retorna endereços ativos de um cliente

## 🔒 Validações de Negócio

As validações são aplicadas na camada de domínio para garantir a integridade dos dados.

### Validações Automáticas

- Um cliente/loja/fornecedor pode ter apenas um endereço principal (`is_primary = true`)
- Campos obrigatórios devem ser preenchidos
- Formato do CEP deve ser válido (padrão brasileiro)
- Estado deve ter exatamente 2 caracteres maiúsculos
- O status do endereço deve ser consistente com as operações

### Validações de Campos

- `street`: Mínimo 5, máximo 200 caracteres
- `number`: Máximo 20 caracteres
- `complement`: Máximo 100 caracteres (opcional)
- `neighborhood`: Mínimo 3, máximo 100 caracteres
- `city`: Mínimo 2, máximo 100 caracteres
- `state`: Exatamente 2 caracteres maiúsculos (padrão /^[A-Z]{2}$/)
- `zipcode`: Formato brasileiro (padrão /^(\d{5}-?\d{3})$/)

## 🧪 Testes

O domínio Address possui uma cobertura de testes abrangente, incluindo:

- **Testes de Unidade**: Para a entidade `Address`, seus métodos e validações
- **Testes de Integração**: Para os casos de uso, verificando a interação entre as camadas
- **Testes de Repositório**: Para garantir que as operações de persistência funcionem corretamente
- **Testes de Validação**: Para verificar as regras de negócio e validações de campo

## 📚 Padrões Utilizados

- **Domain-Driven Design (DDD)**: Foco no domínio e na linguagem ubíqua
- **Clean Architecture / Arquitetura Hexagonal**: Separação de preocupações e inversão de dependências
- **Repository Pattern**: Abstração da persistência de dados
- **Use Case Pattern**: Orquestração das operações de negócio
- **Aggregate Pattern**: Agrupamento de entidades e objetos de valor
- **Value Objects**: Para representar conceitos como `AddressId`
- **Factory Pattern**: Para a criação de validadores (`AddressValidatorFactory`)

## 🔄 Integração

O domínio Address é projetado para ser flexível e se integrar com outros domínios do sistema:

- **Client Domain**: Para associar endereços a clientes
- **Store Domain**: Para associar endereços a lojas
- **Supplier Domain**: Para associar endereços a fornecedores
- **Sale Domain**: Para endereços de entrega e cobrança em vendas

## 📁 Estrutura de Pastas

address/
├── application/ # Camada de Aplicação
│ ├── index.ts # Exports principais
│ └── use-cases/ # Casos de uso
│ ├── common/ # DTOs e mappers comuns
│ │ └── address-output.ts # Output padrão
│ ├── create-address/ # Criar endereço
│ ├── delete-address/ # Deletar endereço
│ ├── get-address/ # Obter endereço por ID
│ ├── list-addresses/ # Listar endereços
│ └── update-address/ # Atualizar endereço
├── domain/ # Camada de Domínio
│ ├── tests / # Testes da entidade
│ │ └── address.aggregate.spec.ts
│ ├── address-fake.builder.ts # Builder para dados de teste
│ ├── address.aggregate.ts # Entidade principal
│ ├── address.validator.ts # Validador de regras
│ └── repositories/ # Interfaces de repositório
│ └── address.repository.interface.ts
└── infra/ # Camada de Infraestrutura
└── db/
└── in-memory/ # Implementação em memória
└── address-in-memory.repository.ts

_Este README.md visa fornecer uma visão clara e concisa do domínio Address, facilitando o entendimento e a colaboração entre os desenvolvedores._
