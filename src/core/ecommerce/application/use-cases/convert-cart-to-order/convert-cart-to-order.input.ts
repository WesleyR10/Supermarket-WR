export type ConvertCartToOrderDeliveryAddressInputConstructorProps = {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
};

export class ConvertCartToOrderDeliveryAddressInput {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;

  constructor(props?: ConvertCartToOrderDeliveryAddressInputConstructorProps) {
    if (!props) return;
    this.street = props.street;
    this.number = props.number;
    this.complement = props.complement;
    this.neighborhood = props.neighborhood;
    this.city = props.city;
    this.state = props.state;
    this.zip_code = props.zip_code;
  }
}

export type ConvertCartToOrderPaymentMethodInputConstructorProps = {
  type: 'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX' | 'CASH';
  card_number?: string;
  card_holder_name?: string;
  card_expiry_date?: string;
  card_cvv?: string;
};

export class ConvertCartToOrderPaymentMethodInput {
  type: 'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX' | 'CASH';
  card_number?: string;
  card_holder_name?: string;
  card_expiry_date?: string;
  card_cvv?: string;

  constructor(props?: ConvertCartToOrderPaymentMethodInputConstructorProps) {
    if (!props) return;
    this.type = props.type;
    this.card_number = props.card_number;
    this.card_holder_name = props.card_holder_name;
    this.card_expiry_date = props.card_expiry_date;
    this.card_cvv = props.card_cvv;
  }
}

export type ConvertCartToOrderInputConstructorProps = {
  cart_id: string;
  client_id: string;
  delivery_address: ConvertCartToOrderDeliveryAddressInputConstructorProps;
  payment_methods: ConvertCartToOrderPaymentMethodInputConstructorProps[];
};

export class ConvertCartToOrderInput {
  cart_id: string;
  client_id: string;
  delivery_address: ConvertCartToOrderDeliveryAddressInput;
  payment_methods: ConvertCartToOrderPaymentMethodInput[];

  constructor(props?: ConvertCartToOrderInputConstructorProps) {
    if (!props) return;
    this.cart_id = props.cart_id;
    this.client_id = props.client_id;
    this.delivery_address = new ConvertCartToOrderDeliveryAddressInput(props.delivery_address);
    this.payment_methods = props.payment_methods?.map(pm => new ConvertCartToOrderPaymentMethodInput(pm)) || [];
  }

  // Validação manual simples
  validate(): string[] {
    const errors: string[] = [];
    
    if (!this.cart_id) errors.push('cart_id é obrigatório');
    if (!this.client_id) errors.push('client_id é obrigatório');
    
    if (!this.delivery_address) {
      errors.push('delivery_address é obrigatório');
    } else {
      if (!this.delivery_address.street) errors.push('street é obrigatório');
      if (!this.delivery_address.number) errors.push('number é obrigatório');
      if (!this.delivery_address.neighborhood) errors.push('neighborhood é obrigatório');
      if (!this.delivery_address.city) errors.push('city é obrigatório');
      if (!this.delivery_address.state) errors.push('state é obrigatório');
      if (!this.delivery_address.zip_code) errors.push('zip_code é obrigatório');
    }
    
    if (!this.payment_methods || this.payment_methods.length === 0) {
      errors.push('payment_methods é obrigatório');
    }
    
    return errors;
  }
}