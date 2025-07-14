import { Address } from '../../../domain/address.aggregate';

export type AddressOutput = {
  id: string;
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

  address_type: string;
  is_primary: boolean;
  status: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
};

export class AddressOutputMapper {
  static toOutput(entity: Address): AddressOutput {
    const { address_id, ...otherProps } = entity.toJSON();
    return {
      id: address_id,
      ...otherProps,
    };
  }
} 