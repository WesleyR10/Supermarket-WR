import { Store } from '../../../domain/store.aggregate';
import { StoreOutputMapper } from './store-output';

describe('StoreOutputMapper Unit Tests', () => {
  it('should convert a store in output', () => {
    const store = Store.fake().aStore().build();
    const spyToJSON = jest.spyOn(store, 'toJSON');
    const output = StoreOutputMapper.toOutput(store);

    expect(spyToJSON).toHaveBeenCalled();
    expect(output).toStrictEqual({
      id: store.store_id.id,
      name: store.name,
      cnpj: store.cnpj,
      status: store.status,
      settings: store.settings,
      subscription: store.subscription,
      created_at: store.created_at,
      updated_at: store.updated_at,
    });
  });
});