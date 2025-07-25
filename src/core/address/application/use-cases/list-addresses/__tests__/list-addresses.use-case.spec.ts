import { Address, AddressStatus } from '../../../../domain/address.aggregate';
import { AddressInMemoryRepository } from '../../../../infra/db/in-memory/address-in-memory.repository';
import { ListAddressesUseCase } from '../list-addresses.use-case';

describe('ListAddressesUseCase Unit Tests', () => {
  let useCase: ListAddressesUseCase;
  let repository: AddressInMemoryRepository;

  beforeEach(() => {
    repository = new AddressInMemoryRepository();
    useCase = new ListAddressesUseCase(repository);
  });

  test('toOutput method', async () => {
    let result = await useCase.execute({});
    expect(result).toStrictEqual({
      items: [],
      total: 0,
      current_page: 1,
      per_page: 15,
      last_page: 0,
    });

    const entity = Address.fake()
      .anAddress()
      .withStreet('Rua das Flores')
      .withState('SP')
      .withZipcode('01234-567')
      .build();
    repository.items = [entity];
    result = await useCase.execute({});
    expect(result).toStrictEqual({
      items: [
        {
          id: entity.address_id.id,
          client_id: entity.client_id,
          store_id: entity.store_id,
          supplier_id: entity.supplier_id,
          street: entity.street,
          number: entity.number,
          complement: entity.complement,
          neighborhood: entity.neighborhood,
          city: entity.city,
          state: entity.state,
          zipcode: entity.zipcode,
          address_type: entity.address_type,
          is_primary: entity.is_primary,
          status: entity.status,
          created_at: entity.created_at,
          updated_at: entity.updated_at,
          deleted_at: entity.deleted_at,
        },
      ],
      total: 1,
      current_page: 1,
      per_page: 15,
      last_page: 1,
    });
  });

  it('should search applying paginate and filter', async () => {
    // Criando entidades com client_id específico para garantir o filtro
    const entity1 = Address.fake()
      .anAddress()
      .withClientId('client-1')
      .withStreet('Rua A')
      .withState('SP')
      .withZipcode('01234-567')
      .build();
    
    const entity2 = Address.fake()
      .anAddress()
      .withClientId('client-2')
      .withStreet('Rua B')
      .withState('RJ')
      .withZipcode('12345-678')
      .build();
    
    const entity3 = Address.fake()
      .anAddress()
      .withClientId('client-1')
      .withStreet('Rua C')
      .withState('SP')
      .withZipcode('23456-789')
      .build();

    repository.items = [entity1, entity2, entity3];

    const result = await useCase.execute({
      page: 1,
      per_page: 2,
      sort: 'street',
      sort_dir: 'asc',
      filter: { client_id: 'client-1' },
    });

    // Deve retornar apenas os endereços do client-1, ordenados por street
    expect(result.total).toBe(2);
    expect(result.items).toHaveLength(2);
    expect(result.items[0].client_id).toBe('client-1');
    expect(result.items[1].client_id).toBe('client-1');
    expect(result.items[0].street).toBe('Rua A'); // Primeiro na ordem alfabética
    expect(result.items[1].street).toBe('Rua C'); // Segundo na ordem alfabética
  });

  it('should filter by status', async () => {
    const activeAddress = Address.fake()
      .anAddress()
      .withStreet('Rua Ativa')
      .withState('SP')
      .withZipcode('01234-567')
      .build();
    
    const deletedAddress = Address.fake()
      .anAddress()
      .withStreet('Rua Deletada')
      .withState('RJ')
      .withZipcode('12345-678')
      .build();
    
    // Marcando como deletado
    deletedAddress.markAsDeleted();
    
    repository.items = [activeAddress, deletedAddress];

    // Filtrando apenas endereços ativos
    const result = await useCase.execute({
      filter: { status: AddressStatus.ACTIVE },
    });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].status).toBe('ACTIVE');
    expect(result.items[0].street).toBe('Rua Ativa');
    expect(result.total).toBe(1);
  });

  it('should sort by created_at desc by default', async () => {
    const now = new Date();
    
    const firstAddress = Address.fake()
      .anAddress()
      .withStreet('Primeiro')
      .withState('SP')
      .withZipcode('01234-567')
      .build();
    firstAddress.created_at = new Date(now.getTime() - 1000); // 1 segundo antes
    
    const secondAddress = Address.fake()
      .anAddress()
      .withStreet('Segundo')
      .withState('RJ')
      .withZipcode('12345-678')
      .build();
    secondAddress.created_at = now; // Mais recente
    
    repository.items = [firstAddress, secondAddress];

    const result = await useCase.execute({});

    expect(result.items[0].street).toBe('Segundo'); // Mais recente primeiro
    expect(result.items[1].street).toBe('Primeiro');
  });
});