import { ProductInMemoryRepository } from '../product-in-memory.repository';
import { Product, UnitType } from '../../../../domain/product.aggregate';
import { ProductFilter, ProductSearchParams } from '../../../../domain/repositories/product.repository.interface';

describe('ProductInMemoryRepository', () => {
  let repository: ProductInMemoryRepository;
  let storeId: string;

  beforeEach(() => {
    repository = new ProductInMemoryRepository();
    storeId = 'test-store-id';
  });

  // ✅ MANTER: Operações básicas de repositório
  describe('Basic repository operations', () => {
    it('should insert a product', async () => {
      const product = Product.fake().aProduct().withStoreId(storeId).build();
      await repository.insert(product);
      expect(repository.items).toHaveLength(1);
      expect(repository.items[0]).toBe(product);
    });

    it('should find product by id', async () => {
      const product = Product.fake().aProduct().withStoreId(storeId).build();
      await repository.insert(product);
      
      const found = await repository.findById(product.product_id);
      expect(found).toBe(product);
    });

    it('should update a product', async () => {
      const product = Product.fake().aProduct().withStoreId(storeId).build();
      await repository.insert(product);
      
      product.changeName('Updated Product Name');
      await repository.update(product);
      
      const found = await repository.findById(product.product_id);
      expect(found?.name).toBe('Updated Product Name');
    });

    it('should delete a product', async () => {
      const product = Product.fake().aProduct().withStoreId(storeId).build();
      await repository.insert(product);
      
      await repository.delete(product.product_id);
      
      const found = await repository.findById(product.product_id);
      expect(found).toBeNull();
    });
  });

  // ✅ MANTER: Métodos específicos de consulta do repositório
  describe('Domain-specific search methods', () => {
    beforeEach(async () => {
      const products = [
        Product.fake().aProduct()
          .withStoreId(storeId)
          .withName('Coca-Cola 2L')
          .withCategoryId('category-bebidas')
          .withBarcode('7894900011517')
          .withBrand('Coca-Cola')
          .withPrice(5.99)
          .withUnitType(UnitType.UNIT)
          .withRequiresWeighing(false) // ✅ Adicionar esta linha
          .build(),
        Product.fake().aProduct()
          .withStoreId(storeId)
          .withName('Carne Bovina Premium')
          .withCategoryId('category-carnes')
          .withBarcode('1234567890123')
          .withBrand('Friboi')
          .withPrice(29.99)
          .withUnitType(UnitType.KG)
          .withRequiresWeighing(true)
          .build(),
        Product.fake().aProduct()
          .withStoreId(storeId)
          .withName('Produto Inativo')
          .withCategoryId('category-diversos')
          .withBarcode('1111111111111')
          .withPrice(10.00)
          .withRequiresWeighing(false) // ✅ Adicionar esta linha
          .deactivate()
          .build(),
      ];
      
      await repository.bulkInsert(products);
    });

    describe('findByCategory', () => {
      it('should find products by category', async () => {
        const products = await repository.findByCategory(storeId, 'category-bebidas');
        expect(products).toHaveLength(1);
        expect(products[0].name).toBe('Coca-Cola 2L');
      });
    });

    describe('findByBarcode', () => {
      it('should find product by barcode', async () => {
        const product = await repository.findByBarcode(storeId, '7894900011517');
        expect(product).not.toBeNull();
        expect(product?.name).toBe('Coca-Cola 2L');
      });
    });

    describe('findByBrand', () => {
      it('should find products by brand', async () => {
        const products = await repository.findByBrand(storeId, 'Coca-Cola');
        expect(products).toHaveLength(1);
        expect(products[0].name).toBe('Coca-Cola 2L');
      });
    });

    describe('findByUnitType', () => {
      it('should find products by unit type', async () => {
        const products = await repository.findByUnitType(storeId, UnitType.KG);
        expect(products).toHaveLength(1);
        expect(products[0].name).toBe('Carne Bovina Premium');
      });
    });

    describe('findWeighableProducts', () => {
      it('should find products that require weighing', async () => {
        const products = await repository.findWeighableProducts(storeId);
        expect(products).toHaveLength(1);
        expect(products[0].name).toBe('Carne Bovina Premium');
      });
    });

    describe('findInactiveProducts', () => {
      it('should find inactive products', async () => {
        const products = await repository.findInactiveProducts(storeId);
        expect(products).toHaveLength(1);
        expect(products[0].name).toBe('Produto Inativo');
      });
    });
  });

  // ✅ MANTER: Métodos únicos de validação do repositório
  describe('Validation methods', () => {
    beforeEach(async () => {
      const product = Product.fake().aProduct()
        .withStoreId(storeId)
        .withName('Test Product')
        .withCategoryId('category-test')
        .withBarcode('1234567890123')
        .build();
      await repository.insert(product);
    });

    describe('existsByBarcode', () => {
      it('should return true for existing barcode', async () => {
        const exists = await repository.existsByBarcode(storeId, '1234567890123');
        expect(exists).toBe(true);
      });

      it('should return false for non-existing barcode', async () => {
        const exists = await repository.existsByBarcode(storeId, '9999999999999');
        expect(exists).toBe(false);
      });
    });

    describe('existsByNameInCategory', () => {
      it('should return true for existing name in category', async () => {
        const exists = await repository.existsByNameInCategory(storeId, 'Test Product', 'category-test');
        expect(exists).toBe(true);
      });

      it('should return false for non-existing name in category', async () => {
        const exists = await repository.existsByNameInCategory(storeId, 'Non-existing', 'category-test');
        expect(exists).toBe(false);
      });
    });
  });

  // ✅ MANTER: Isolamento multi-tenant específico do repositório
  describe('Multi-tenancy and store isolation', () => {
    beforeEach(async () => {
      const products = [
        Product.fake().aProduct().withStoreId('store-1').withName('Product Store 1').build(),
        Product.fake().aProduct().withStoreId('store-2').withName('Product Store 2').build(),
      ];
      await repository.bulkInsert(products);
    });

    it('should not return products from other stores', async () => {
      const products = await repository.findByCategory('store-1', 'any-category');
      expect(products.every(p => p.store_id === 'store-1')).toBe(true);
    });

    it('should filter by store_id in search', async () => {
      const filter: ProductFilter = { store_id: 'store-1' };
      const searchParams = ProductSearchParams.create({ filter, page: 1, per_page: 10 });
      const result = await repository.search(searchParams);
      
      expect(result.items.every(p => p.store_id === 'store-1')).toBe(true);
    });
  });

  // ✅ MANTER: Filtros complexos específicos do repositório
  describe('Complex filtering', () => {
    beforeEach(async () => {
      const products = [
        Product.fake().aProduct()
          .withStoreId(storeId)
          .withName('Produto A')
          .withPrice(10.00)
          .withCategoryId('category-1')
          .build(),
        Product.fake().aProduct()
          .withStoreId(storeId)
          .withName('Produto B')
          .withPrice(20.00)
          .withCategoryId('category-2')
          .build(),
      ];
      await repository.bulkInsert(products);
    });

    it('should filter by price range', async () => {
      const filter: ProductFilter = { price_min: 15.00, price_max: 25.00, store_id: storeId };
      const searchParams = ProductSearchParams.create({ filter, page: 1, per_page: 10 });
      const result = await repository.search(searchParams);
      
      expect(result.items).toHaveLength(1);
      expect(result.items[0].price).toBe(20.00);
    });

    it('should apply multiple filters', async () => {
      const filter: ProductFilter = {
        name: 'Produto A',
        category_id: 'category-1',
        store_id: storeId
      };
      const searchParams = ProductSearchParams.create({ filter, page: 1, per_page: 10 });
      const result = await repository.search(searchParams);
      
      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Produto A');
    });
  });

  // ✅ MANTER: Método específico do repositório
  describe('getEntity', () => {
    it('should return Product constructor', () => {
      expect(repository.getEntity()).toBe(Product);
    });
  });
});