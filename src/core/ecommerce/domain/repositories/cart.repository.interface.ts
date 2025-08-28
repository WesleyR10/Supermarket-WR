import { ISearchableRepository } from '../../../shared/domain/repository/repository-interface';
import { SearchParams, SearchParamsConstructorProps } from '../../../shared/domain/repository/search-params';
import { SearchResult } from '../../../shared/domain/repository/search-result';
import { Cart, CartId, CartStatus } from '../cart.aggregate';
import { Uuid } from '../../../shared/domain/value-objects/uuid.vo';

export type CartFilter = {
  store_id?: string;
  client_id?: Uuid;
  status?: CartStatus;
  expires_before?: Date;
  expires_after?: Date;
};

export class CartSearchParams extends SearchParams<CartFilter> {
  private constructor(props: SearchParamsConstructorProps<CartFilter>) {
    super(props);
  }

  static create(props: Partial<SearchParamsConstructorProps<CartFilter>> = {}) {
    return new CartSearchParams({
      ...props,
      filter: {
        ...props.filter,
      },
    });
  }

  get filter(): CartFilter | null {
    return this._filter;
  }

  protected set filter(value: CartFilter | null) {
    const _value =
      !value || (value as unknown) === '' || typeof value !== 'object'
        ? null
        : value;

    const filter = {
      ...(_value?.store_id && { store_id: _value.store_id }),
      ...(_value?.client_id && { client_id: _value.client_id }),
      ...(_value?.status && { status: _value.status }),
      ...(_value?.expires_before && { expires_before: _value.expires_before }),
      ...(_value?.expires_after && { expires_after: _value.expires_after }),
    };

    this._filter = Object.keys(filter).length === 0 ? null : filter;
  }
}

export class CartSearchResult extends SearchResult<Cart> {}

export interface ICartRepository
  extends ISearchableRepository<
    Cart,
    CartId,
    CartFilter,
    CartSearchParams,
    CartSearchResult
  > {
  findByClientAndStore(client_id: Uuid, store_id: string): Promise<Cart | null>;
  findActiveByClient(client_id: Uuid, store_id: string): Promise<Cart | null>;
  findExpiredCarts(expiry_date: Date, limit?: number): Promise<Cart[]>;
  countByStatus(store_id: string, status: CartStatus): Promise<number>;
}