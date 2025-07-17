import { AggregateRoot } from '../../shared/domain/aggregate-root';
import { Uuid } from '../../shared/domain/value-objects/uuid.vo';
import { AddressValidatorFactory } from './address.validator';
import { AddressFakeBuilder } from './address-fake.builder';

export class AddressId extends Uuid {}

export enum AddressType {
  HOME = 'HOME', // Endereço residencial
  WORK = 'WORK', // Endereço comercial
  HEADQUARTERS = 'HEADQUARTERS', // Matriz
  BRANCH = 'BRANCH', // Filial
  WAREHOUSE = 'WAREHOUSE', // Armazém
  DELIVERY = 'DELIVERY', // Endereço de entrega
  BILLING = 'BILLING' // Endereço de cobrança
}

export enum AddressStatus {
  ACTIVE = 'ACTIVE', // Ativo
  INACTIVE = 'INACTIVE', // Inativo
  DELETED = 'DELETED' // Deletado
}

export type AddressConstructorProps = {
  address_id?: AddressId;
  client_id?: string | null;
  store_id?: string | null;
  supplier_id?: string | null;

  street: string;
  number: string;
  complement?: string | null;
  neighborhood: string;
  city: string;
  state: string;
  zipcode: string;

  address_type: AddressType;
  is_primary?: boolean;
  status?: AddressStatus;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
};

export type AddressCreateCommand = {
  client_id?: string | null;
  store_id?: string | null;
  supplier_id?: string | null;
  
  street: string;
  number: string;
  complement?: string | null;
  neighborhood: string;
  city: string;
  state: string;
  zipcode: string;
  
  address_type: AddressType;
  is_primary?: boolean;
  status?: AddressStatus;

  created_at?: Date;
};

export class Address extends AggregateRoot {
  address_id: AddressId;
  client_id: string | null;
  store_id: string | null;
  supplier_id: string | null;

  street: string;
  number: string;
  complement: string | null;
  neighborhood: string;
  city: string;
  state: string;
  zipcode: string;

  address_type: AddressType;
  is_primary: boolean;
  status: AddressStatus;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;

  constructor(props: AddressConstructorProps) {
    super();
    this.address_id = props.address_id ?? new AddressId();
    this.client_id = props.client_id ?? null;
    this.store_id = props.store_id ?? null;
    this.supplier_id = props.supplier_id ?? null;
    this.street = props.street;
    this.number = props.number;
    this.complement = props.complement ?? null;
    this.neighborhood = props.neighborhood;
    this.city = props.city;
    this.state = props.state;
    this.zipcode = props.zipcode;
    this.address_type = props.address_type;
    this.is_primary = props.is_primary ?? false;
    this.status = props.status ?? AddressStatus.ACTIVE;
    this.created_at = props.created_at ?? new Date();
    this.updated_at = props.updated_at ?? new Date();
    this.deleted_at = props.deleted_at ?? null;
  }

  static create(props: AddressCreateCommand): Address {
    const address = new Address(props);
    address.validate(['street', 'number', 'neighborhood', 'city', 'state', 'zipcode']);
    return address;
  }

  get entity_id(): AddressId {
    return this.address_id;
  }

  // Métodos de negócio específicos do domínio de supermercado
  
  activate(): void {
    this.status = AddressStatus.ACTIVE;
    this.updated_at = new Date();
  }

  deactivate(): void {
    this.status = AddressStatus.INACTIVE;
    this.updated_at = new Date();
  }

  markAsDeleted(): void {
    this.status = AddressStatus.DELETED;
    this.deleted_at = new Date();
    this.updated_at = new Date();
  }

  setAsPrimary(): void {
    this.is_primary = true;
    this.updated_at = new Date();
  }

  // Não é mais Endereço Principal
  unsetAsPrimary(): void { 
    this.is_primary = false;
    this.updated_at = new Date();
  }

  updateAddress(props: {
    street?: string;
    number?: string;
    complement?: string | null;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipcode?: string;
  }): void {
    if (props.street !== undefined) this.street = props.street;
    if (props.number !== undefined) this.number = props.number;
    if (props.complement !== undefined) this.complement = props.complement;
    if (props.neighborhood !== undefined) this.neighborhood = props.neighborhood;
    if (props.city !== undefined) this.city = props.city;
    if (props.state !== undefined) this.state = props.state;
    if (props.zipcode !== undefined) this.zipcode = props.zipcode;
    
    this.updated_at = new Date();
  }

  // Regras de negócio específicas do domínio de supermercado

  isActive(): boolean {
    return this.status === AddressStatus.ACTIVE;
  }

  isDeleted(): boolean {
    return this.status === AddressStatus.DELETED;
  }

  isPrimary(): boolean {
    return this.is_primary;
  }

  isDeliveryAddress(): boolean {
    return this.address_type === AddressType.DELIVERY;
  }

  isBillingAddress(): boolean {
    return this.address_type === AddressType.BILLING;
  }

  isBusinessAddress(): boolean {
    return [AddressType.HEADQUARTERS, AddressType.BRANCH, AddressType.WAREHOUSE].includes(this.address_type);
  }

  isResidentialAddress(): boolean {
    return [AddressType.HOME, AddressType.WORK].includes(this.address_type);
  }

  getFullAddress(): string {
    const complement = this.complement ? `, ${this.complement}` : '';
    return `${this.street}, ${this.number}${complement}, ${this.neighborhood}, ${this.city} - ${this.state}, ${this.zipcode}`;
  }

  // Regras de negócio específicas do supermercado

  canReceiveDelivery(): boolean {
    return this.isActive() && (this.isDeliveryAddress() || this.isResidentialAddress());
  }

  isValidForBilling(): boolean {
    return this.isActive() && !this.isDeleted();
  }

  // Validação seguindo o padrão DDD do projeto
  validate(fields?: string[]) {
    const validator = AddressValidatorFactory.create();
    return validator.validate(this.notification, this, fields);
  }

  toJSON() {
    return {
      address_id: this.address_id.id,
      client_id: this.client_id,
      store_id: this.store_id,
      supplier_id: this.supplier_id,
      street: this.street,
      number: this.number,
      complement: this.complement,
      neighborhood: this.neighborhood,
      city: this.city,
      state: this.state,
      zipcode: this.zipcode,
      address_type: this.address_type,
      is_primary: this.is_primary,
      status: this.status,
      created_at: this.created_at,
      updated_at: this.updated_at,
      deleted_at: this.deleted_at,
    };
  }

  static fake() {
    return AddressFakeBuilder;
  }
}