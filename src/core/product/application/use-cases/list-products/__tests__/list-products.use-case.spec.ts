import { ProductInMemoryRepository } from '../../../../infra/db/in-memory/product-in-memory.repository';
import { ListProductsUseCase } from '../list-products.use-case';
import { Product, UnitType } from '../../../../domain/product.aggregate';

describe('ListProductsUseCase Unit Tests', () => {
  let useCase: ListProductsUseCase;
  let repository: ProductInMemoryRepository;

  beforeEach(() => {
    repository = new ProductInMemoryRepository();
    useCase = new ListProductsUseCase(repository);
  });

  it('should return products with default search params', async () => {
    const products = [
      Product.create({
        category_id: 'category-123',
        name: 'Arroz Branco 5kg',
        barcode: '1234567890123',
        price: 12.99,
      }),
      Product.create({
        category_id: 'category-456',
        name: 'Feijão Preto 1kg',
        barcode: '9876543210987',
        price: 8.50,
      }),
    ];
    
    await repository.bulkInsert(products);

    const output = await useCase.execute({});

    expect(output.items).toHaveLength(2);
    expect(output.total).toBe(2);
    expect(output.current_page).toBe(1);
    expect(output.per_page).toBe(15);
    expect(output.last_page).toBe(1);
  });

  it('should return products with search filter by name', async () => {
    const products = [
      Product.create({
        category_id: 'category-123',
        name: 'Coca-Cola 2L',
        barcode: '1234567890123',
        price: 5.99,
        brand: 'Coca-Cola',
      }),
      Product.create({
        category_id: 'category-123',
        name: 'Pepsi 2L',
        barcode: '9876543210987',
        price: 5.50,
        brand: 'Pepsi',
      }),
      Product.create({
        category_id: 'category-456',
        name: 'Água Mineral 500ml',
        barcode: '5555555555555',
        price: 2.00,
      }),
    ];
    
    await repository.bulkInsert(products);

    const output = await useCase.execute({ 
      filter: { name: 'Coca' } 
    });

    expect(output.items).toHaveLength(1);
    expect(output.items[0].name).toBe('Coca-Cola 2L');
  });

  it('should return products with search filter by category', async () => {
    const products = [
      Product.create({
        category_id: 'category-bebidas',
        name: 'Coca-Cola 2L',
        barcode: '1234567890123',
        price: 5.99,
      }),
      Product.create({
        category_id: 'category-alimentos',
        name: 'Arroz Branco',
        barcode: '9876543210987',
        price: 12.99,
      }),
    ];
    
    await repository.bulkInsert(products);

    const output = await useCase.execute({ 
      filter: { category_id: 'category-bebidas' } 
    });

    expect(output.items).toHaveLength(1);
    expect(output.items[0].category_id).toBe('category-bebidas');
  });

  it('should return products with search filter by brand', async () => {
    const products = [
      Product.create({
        category_id: 'category-123',
        name: 'Coca-Cola 2L',
        barcode: '1234567890123',
        price: 5.99,
        brand: 'Coca-Cola',
      }),
      Product.create({
        category_id: 'category-123',
        name: 'Coca-Cola Zero',
        barcode: '1111111111111',
        price: 5.99,
        brand: 'Coca-Cola',
      }),
      Product.create({
        category_id: 'category-123',
        name: 'Pepsi 2L',
        barcode: '9876543210987',
        price: 5.50,
        brand: 'Pepsi',
      }),
    ];
    
    await repository.bulkInsert(products);

    const output = await useCase.execute({ 
      filter: { brand: 'Coca-Cola' } 
    });

    expect(output.items).toHaveLength(2);
    expect(output.items.every(item => item.brand === 'Coca-Cola')).toBe(true);
  });

  it('should return products with search filter by unit type', async () => {
    const products = [
      Product.create({
        category_id: 'category-123',
        name: 'Carne Bovina',
        barcode: '1234567890123',
        price: 29.99,
        unit_type: UnitType.KG,
      }),
      Product.create({
        category_id: 'category-456',
        name: 'Coca-Cola 2L',
        barcode: '9876543210987',
        price: 5.99,
        unit_type: UnitType.UNIT,
      }),
    ];
    
    await repository.bulkInsert(products);

    const output = await useCase.execute({ 
      filter: { unit_type: UnitType.KG } 
    });

    expect(output.items).toHaveLength(1);
    expect(output.items[0].unit_type).toBe(UnitType.KG);
  });

  it('should return products with search filter by active status', async () => {
    const products = [
      Product.create({
        category_id: 'category-123',
        name: 'Produto Ativo',
        barcode: '1234567890123',
        price: 10.00,
        is_active: true,
      }),
      Product.create({
        category_id: 'category-456',
        name: 'Produto Inativo',
        barcode: '9876543210987',
        price: 15.00,
        is_active: false,
      }),
    ];
    
    await repository.bulkInsert(products);

    const output = await useCase.execute({ 
      filter: { is_active: true } 
    });

    expect(output.items).toHaveLength(1);
    expect(output.items[0].is_active).toBe(true);
  });

  it('should return products with search filter by price range', async () => {
    const products = [
      Product.create({
        category_id: 'category-123',
        name: 'Produto Barato',
        barcode: '1234567890123',
        price: 5.00,
      }),
      Product.create({
        category_id: 'category-456',
        name: 'Produto Médio',
        barcode: '9876543210987',
        price: 15.00,
      }),
      Product.create({
        category_id: 'category-789',
        name: 'Produto Caro',
        barcode: '5555555555555',
        price: 50.00,
      }),
    ];
    
    await repository.bulkInsert(products);

    const output = await useCase.execute({ 
      filter: { price_min: 10, price_max: 20 } 
    });

    expect(output.items).toHaveLength(1);
    expect(output.items[0].name).toBe('Produto Médio');
  });

  it('should return products with pagination', async () => {
    const products = Array.from({ length: 20 }, (_, i) => 
      Product.create({
        category_id: 'category-123',
        name: `Produto ${i + 1}`,
        barcode: `123456789012${i}`,
        price: 10.00,
      })
    );
    
    await repository.bulkInsert(products);

    const output = await useCase.execute({ 
      page: 2, 
      per_page: 5 
    });

    expect(output.items).toHaveLength(5);
    expect(output.current_page).toBe(2);
    expect(output.per_page).toBe(5);
    expect(output.total).toBe(20);
    expect(output.last_page).toBe(4);
  });

  it('should return products with sorting by name', async () => {
    const products = [
      Product.create({
        category_id: 'category-123',
        name: 'Zebra Product',
        barcode: '1234567890123',
        price: 10.00,
      }),
      Product.create({
        category_id: 'category-456',
        name: 'Alpha Product',
        barcode: '9876543210987',
        price: 15.00,
      }),
    ];
    
    await repository.bulkInsert(products);

    const output = await useCase.execute({ 
      sort: 'name', 
      sort_dir: 'asc' 
    });

    expect(output.items[0].name).toBe('Alpha Product');
    expect(output.items[1].name).toBe('Zebra Product');
  });

  it('should return empty result when no products match filter', async () => {
    const products = [
      Product.create({
        category_id: 'category-123',
        name: 'Produto Teste',
        barcode: '1234567890123',
        price: 10.00,
      }),
    ];
    
    await repository.bulkInsert(products);

    const output = await useCase.execute({ 
      filter: { name: 'Inexistente' } 
    });

    expect(output.items).toHaveLength(0);
    expect(output.total).toBe(0);
  });
});