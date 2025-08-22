import { CreateOnlineOrderUseCase } from '../create-online-order.use-case';
import { CreateOnlineOrderInput } from '../create-online-order.input';
import { OnlineOrderInMemoryRepository } from '../../../../domain/repositories/online-order-in-memory.repository';
import { InvalidArgumentError } from '../../../../../shared/domain/errors/invalid-argument.error';
import { InvalidPriceError } from '../../../../../shared/domain/value-objects/price.vo';
import { InvalidUuidError } from '../../../../../shared/domain/value-objects/uuid.vo';

describe('CreateOnlineOrderUseCase Unit Tests', () => {
  let useCase: CreateOnlineOrderUseCase;
  let repository: OnlineOrderInMemoryRepository;

  beforeEach(() => {
    repository = new OnlineOrderInMemoryRepository();
    useCase = new CreateOnlineOrderUseCase(repository);
  });

  it('should create an online order', async () => {
    const input: CreateOnlineOrderInput = {
      client_id: '123e4567-e89b-12d3-a456-426614174000',
      items: [
        {
          product_id: '123e4567-e89b-12d3-a456-426614174001',
          product_name: 'Arroz Tio João',
          quantity: 2,
          unit_price: 8.99
        }
      ],
      delivery_address: {
        street: 'Rua das Flores',
        number: '123',
        complement: 'Apto 45',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zip_code: '01234-567'
      },
      delivery_fee: 5.99,
      payment_method: {
        type: 'CREDIT_CARD',
        details: {
          card_number: '**** **** **** 1234',
          card_holder: 'João Silva'
        }
      },
      notes: 'Entregar na portaria',
      estimated_delivery: '2025-01-16T14:00:00Z'
    };

    const output = await useCase.execute(input);

    expect(output).toMatchObject({
      order_id: expect.any(String),
      client_id: input.client_id,
      status: 'PENDING',
      subtotal: 17.98, // 2 * 8.99
      delivery_fee: 5.99,
      total: 23.97, // 17.98 + 5.99
      delivery_address: {
        street: 'Rua das Flores',
        number: '123',
        complement: 'Apto 45',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zip_code: '01234567'
      },
      payment_method: {
        type: 'CREDIT_CARD',
        details: {
          card_number: '**** **** **** 1234',
          card_holder: 'João Silva'
        }
      },
      notes: 'Entregar na portaria',
      estimated_delivery: expect.any(String),
      created_at: expect.any(String)
    });

    expect(repository.items).toHaveLength(1);
    expect(repository.items[0].order_id.id).toBe(output.order_id);
  });

  it('should create an online order without optional fields', async () => {
    const input: CreateOnlineOrderInput = {
      client_id: '123e4567-e89b-12d3-a456-426614174000',
      items: [
        {
          product_id: '123e4567-e89b-12d3-a456-426614174001',
          product_name: 'Feijão Carioca',
          quantity: 1,
          unit_price: 6.50
        }
      ],
      delivery_address: {
        street: 'Av. Paulista',
        number: '1000',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        zip_code: '01310-100'
      },
      delivery_fee: 0
    };

    const output = await useCase.execute(input);

    expect(output).toMatchObject({
      order_id: expect.any(String),
      client_id: input.client_id,
      status: 'PENDING',
      subtotal: 6.50,
      delivery_fee: 0,
      total: 6.50,
      delivery_address: {
        street: 'Av. Paulista',
        number: '1000',
        neighborhood: 'Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        zip_code: '01310100'
      },
      payment_method: undefined,
      notes: undefined,
      estimated_delivery: undefined,
      created_at: expect.any(String)
    });

    expect(repository.items).toHaveLength(1);
  });

  it('should create an online order with multiple items', async () => {
    const input: CreateOnlineOrderInput = {
      client_id: '123e4567-e89b-12d3-a456-426614174000',
      items: [
        {
          product_id: '123e4567-e89b-12d3-a456-426614174001',
          product_name: 'Arroz Tio João',
          quantity: 2,
          unit_price: 8.99
        },
        {
          product_id: '123e4567-e89b-12d3-a456-426614174002',
          product_name: 'Feijão Carioca',
          quantity: 1,
          unit_price: 6.50
        },
        {
          product_id: '123e4567-e89b-12d3-a456-426614174003',
          product_name: 'Óleo de Soja',
          quantity: 3,
          unit_price: 4.99
        }
      ],
      delivery_address: {
        street: 'Rua Augusta',
        number: '500',
        neighborhood: 'Consolação',
        city: 'São Paulo',
        state: 'SP',
        zip_code: '01305-000'
      },
      delivery_fee: 8.50
    };

    const output = await useCase.execute(input);

    expect(output.subtotal).toBe(39.45); // (2*8.99) + (1*6.50) + (3*4.99)
    expect(output.delivery_fee).toBe(8.50);
    expect(output.total).toBe(47.95); // 39.45 + 8.50
    expect(output.items).toHaveLength(3);
  });

  it('should throw error when client_id is invalid', async () => {
    const input: CreateOnlineOrderInput = {
      client_id: 'invalid-uuid',
      items: [
        {
          product_id: '123e4567-e89b-12d3-a456-426614174001',
          product_name: 'Arroz Tio João',
          quantity: 1,
          unit_price: 8.99
        }
      ],
      delivery_address: {
        street: 'Rua das Flores',
        number: '123',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zip_code: '01234-567'
      },
      delivery_fee: 5.99
    };

    await expect(useCase.execute(input)).rejects.toThrow(InvalidUuidError);
  });

  it('should throw error when delivery address is invalid', async () => {
    const input: CreateOnlineOrderInput = {
      client_id: '123e4567-e89b-12d3-a456-426614174000',
      items: [
        {
          product_id: '123e4567-e89b-12d3-a456-426614174001',
          product_name: 'Arroz Tio João',
          quantity: 1,
          unit_price: 8.99
        }
      ],
      delivery_address: {
        street: '', // Invalid empty street
        number: '123',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zip_code: '01234-567'
      },
      delivery_fee: 5.99
    };

    await expect(useCase.execute(input)).rejects.toThrow(InvalidArgumentError);
  });

  it('should throw error when items array is empty', async () => {
    const input: CreateOnlineOrderInput = {
      client_id: '123e4567-e89b-12d3-a456-426614174000',
      items: [], // Empty items array
      delivery_address: {
        street: 'Rua das Flores',
        number: '123',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zip_code: '01234-567'
      },
      delivery_fee: 5.99
    };

    await expect(useCase.execute(input)).rejects.toThrow(InvalidArgumentError);
  });

  it('should throw error when quantity is invalid', async () => {
    const input: CreateOnlineOrderInput = {
      client_id: '123e4567-e89b-12d3-a456-426614174000',
      items: [
        {
          product_id: '123e4567-e89b-12d3-a456-426614174001',
          product_name: 'Arroz Tio João',
          quantity: 0, // Invalid quantity
          unit_price: 8.99
        }
      ],
      delivery_address: {
        street: 'Rua das Flores',
        number: '123',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zip_code: '01234-567'
      },
      delivery_fee: 5.99
    };

    await expect(useCase.execute(input)).rejects.toThrow(InvalidArgumentError);
  });

  it('should throw error when unit price is invalid', async () => {
    const input: CreateOnlineOrderInput = {
      client_id: '123e4567-e89b-12d3-a456-426614174000',
      items: [
        {
          product_id: '123e4567-e89b-12d3-a456-426614174001',
          product_name: 'Arroz Tio João',
          quantity: 1,
          unit_price: -5.99 // Invalid negative price
        }
      ],
      delivery_address: {
        street: 'Rua das Flores',
        number: '123',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zip_code: '01234-567'
      },
      delivery_fee: 5.99
    };

    await expect(useCase.execute(input)).rejects.toThrow(InvalidPriceError);
  });

  it('should create order with PIX payment method', async () => {
    const input: CreateOnlineOrderInput = {
      client_id: '123e4567-e89b-12d3-a456-426614174000',
      items: [
        {
          product_id: '123e4567-e89b-12d3-a456-426614174001',
          product_name: 'Arroz Tio João',
          quantity: 1,
          unit_price: 8.99
        }
      ],
      delivery_address: {
        street: 'Rua das Flores',
        number: '123',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zip_code: '01234-567'
      },
      delivery_fee: 5.99,
      payment_method: {
        type: 'PIX',
        details: {
          pix_key: 'joao@email.com'
        }
      }
    };

    const output = await useCase.execute(input);

    expect(output.payment_method).toEqual({
      type: 'PIX',
      details: {
        pix_key: 'joao@email.com'
      }
    });
  });
});
