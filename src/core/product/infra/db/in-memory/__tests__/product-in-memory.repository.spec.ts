import { ProductInMemoryRepository } from '../product-in-memory.repository';
import { Product, UnitType } from '../../../../domain/product.aggregate';
import { ProductFilter } from '../../../../domain/repositories/product.repository.interface';

describe('ProductInMemoryRepository', () => {
  let repository: ProductInMemoryRepository;

  beforeEach(() => {
    repository = new ProductInMemoryRepository();
  });

  describe('Basic repository operations', () => {
    it('should insert a product', async () => {
      const product = Product.fake().aProduct().build();
      await repository.insert(product);
      expect(repository.items).toHaveLength(1);
      expect(repository.items[0]).toBe(product);
    });

    it('should find product by id', async () => {
      const product = Product.fake().aProduct().build();
      await repository.insert(product);
      
      const found = await repository.findById(product.product_id);
      expect(found).toBe(product);
    });

    it('should update a product', async () => {
      const product = Product.fake().aProduct().build();
      await repository.insert(product);
      
      product.changeName('Updated Product Name');
      await repository.update(product);
      
      const found = await repository.findById(product.product_id);
      expect(found?.name).toBe('Updated Product Name');
    });

    it('should delete a product', async () => {
      const product = Product.fake().aProduct().build();
      await repository.insert(product);
      
      await repository.delete(product.product_id);
      
      const found = await repository.findById(product.product_id);
      expect(found).toBeNull();
    });
  });

  describe('Domain-specific search methods', () => {
    beforeEach(async () => {
      const products = [
        Product.fake().aProduct()
          .withName('Coca-Cola 2L')
          .withCategoryId('category-bebidas')
          .withBarcode('7894900011517')
          .withBrand('Coca-Cola')
          .withPrice(5.99)
          .withCostPrice(3.50)
          .withUnitType(UnitType.UNIT)
          .build(),
        Product.fake().aProduct()
          .withName('Carne Bovina Premium')
          .withCategoryId('category-carnes')
          .withBarcode('1234567890123')
          .withBrand('Friboi')
          .withPrice(29.99)
          .withCostPrice(18.50)
          .withUnitType(UnitType.KG)
          .withRequiresWeighing(true)
          .withWeight(1000)
          .build(),
        Product.fake().aProduct()
          .withName('Leite Integral')
          .withCategoryId('category-laticinios')
          .withBarcode('7891000100103')
          .withBrand('Nestlé')
          .withPrice(4.50)
          .withCostPrice(2.80)
          .withUnitType(UnitType.LITER)
          .withVolume(1000)
          .build(),
        Product.fake().aProduct()
          .withName('Produto Inativo')
          .withCategoryId('category-diversos')
          .withBarcode('1111111111111')
          .withPrice(10.00)
          .deactivate()
          .build(),
        Product.fake().aProduct()
          .withName('Produto Sem NCM')
          .withCategoryId('category-diversos')
          .withBarcode('2222222222222')
          .withPrice(75.00)
          .withCostPrice(50.00)
          .build(),
        Product.fake().aProduct()
          .withName('Produto Margem Baixa')
          .withCategoryId('category-diversos')
          .withBarcode('3333333333333')
          .withPrice(10.00)
          .withCostPrice(9.50)
          .build(),
      ];
      
      await repository.bulkInsert(products);
    });

    describe('findByCategory', () => {
      it('should find products by category', async () => {
        const products = await repository.findByCategory('category-bebidas');
        expect(products).toHaveLength(1);
        expect(products[0].name).toBe('Coca-Cola 2L');
      });

      it('should return empty array for non-existent category', async () => {
        const products = await repository.findByCategory('category-inexistente');
        expect(products).toHaveLength(0);
      });
    });

    describe('findByBarcode', () => {
      it('should find product by barcode', async () => {
        const product = await repository.findByBarcode('7894900011517');
        expect(product).not.toBeNull();
        expect(product?.name).toBe('Coca-Cola 2L');
      });

      it('should return null for non-existent barcode', async () => {
        const product = await repository.findByBarcode('9999999999999');
        expect(product).toBeNull();
      });
    });

    describe('findByBrand', () => {
      it('should find products by brand', async () => {
        const products = await repository.findByBrand('Coca-Cola');
        expect(products).toHaveLength(1);
        expect(products[0].name).toBe('Coca-Cola 2L');
      });

      it('should return empty array for non-existent brand', async () => {
        const products = await repository.findByBrand('Marca Inexistente');
        expect(products).toHaveLength(0);
      });
    });

    describe('findByUnitType', () => {
      it('should find products by unit type', async () => {
        const products = await repository.findByUnitType(UnitType.KG);
        expect(products).toHaveLength(1);
        expect(products[0].name).toBe('Carne Bovina Premium');
      });

      it('should find multiple products with same unit type', async () => {
        const products = await repository.findByUnitType(UnitType.UNIT);
        expect(products.length).toBeGreaterThan(0);
      });
    });

    describe('findBySupplierCode', () => {
      it('should find products by supplier code', async () => {
        // Primeiro, vamos adicionar um produto com supplier_code
        const product = Product.fake().aProduct()
          .withSupplierCode('FRIB001')
          .build();
        await repository.insert(product);

        const products = await repository.findBySupplierCode('FRIB001');
        expect(products).toHaveLength(1);
        expect(products[0].supplier_code).toBe('FRIB001');
      });

      it('should return empty array for non-existent supplier code', async () => {
        const products = await repository.findBySupplierCode('INEXISTENTE');
        expect(products).toHaveLength(0);
      });
    });
  });

  describe('Business-specific methods', () => {
    beforeEach(async () => {
      const products = [
        Product.fake().aProduct()
          .withName('Carne Bovina')
          .withUnitType(UnitType.KG)
          .withRequiresWeighing(true)
          .withWeight(1000)
          .build(),
        Product.fake().aProduct()
          .withName('Produto Normal')
          .withUnitType(UnitType.UNIT)
          .build(),
        Product.fake().aProduct()
          .withName('Produto Inativo')
          .deactivate()
          .build(),
        Product.fake().aProduct()
          .withName('Produto Caro Sem NCM')
          .withPrice(75.00)
          .build(),
        Product.fake().aProduct()
          .withName('Produto Margem Baixa')
          .withPrice(10.00)
          .withCostPrice(9.50)
          .build(),
        Product.fake().aProduct()
          .withName('Produto Margem Alta')
          .withPrice(20.00)
          .withCostPrice(10.00)
          .build(),
      ];
      
      await repository.bulkInsert(products);
    });

    describe('findWeighableProducts', () => {
      it('should find products that require weighing', async () => {
        const products = await repository.findWeighableProducts();
        expect(products.length).toBeGreaterThan(0);
        expect(products.some(p => p.requires_weighing || p.unit_type === UnitType.KG)).toBe(true);
      });
    });

    describe('findPerishableProducts', () => {
      it('should find perishable products', async () => {
        const products = await repository.findPerishableProducts();
        expect(products.length).toBeGreaterThan(0);
        expect(products.every(p => p.isPerishable())).toBe(true);
      });
    });

    describe('findProductsWithoutNcm', () => {
      it('should find products without NCM code', async () => {
        const products = await repository.findProductsWithoutNcm();
        expect(products.length).toBeGreaterThan(0);
        expect(products.every(p => !p.ncm_code || p.ncm_code.trim() === '')).toBe(true);
      });
    });

    describe('findInactiveProducts', () => {
      it('should find inactive products', async () => {
        const products = await repository.findInactiveProducts();
        expect(products).toHaveLength(1);
        expect(products[0].name).toBe('Produto Inativo');
        expect(products[0].is_active).toBe(false);
      });
    });

    describe('findByPriceRange', () => {
      it('should find products within price range', async () => {
        const products = await repository.findByPriceRange(5.00, 15.00);
        expect(products.length).toBeGreaterThan(0);
        expect(products.every(p => p.price >= 5.00 && p.price <= 15.00)).toBe(true);
      });

      it('should return empty array when no products in range', async () => {
        const products = await repository.findByPriceRange(1000.00, 2000.00);
        expect(products).toHaveLength(0);
      });
    });
  });

  describe('Margin analysis methods', () => {
    beforeEach(async () => {
      const products = [
        Product.fake().aProduct()
          .withName('Produto Margem Baixa')
          .withPrice(10.00)
          .withCostPrice(9.50) // Margem ~5%
          .build(),
        Product.fake().aProduct()
          .withName('Produto Margem Média')
          .withPrice(20.00)
          .withCostPrice(15.00) // Margem ~25%
          .build(),
        Product.fake().aProduct()
          .withName('Produto Margem Alta')
          .withPrice(30.00)
          .withCostPrice(15.00) // Margem ~50%
          .build(),
        Product.fake().aProduct()
          .withName('Produto Sem Custo')
          .withPrice(25.00)
          .withCostPrice(null) // Adicionar esta linha
          .build(),
      ];
      
      await repository.bulkInsert(products);
    });

    describe('findLowMarginProducts', () => {
      it('should find products with margin below threshold', async () => {
        const products = await repository.findLowMarginProducts(10);
        expect(products).toHaveLength(1);
        expect(products[0].name).toBe('Produto Margem Baixa');
      });

      it('should return empty array when no products below threshold', async () => {
        const products = await repository.findLowMarginProducts(1);
        expect(products).toHaveLength(0);
      });
    });

    describe('getHighestMarginProducts', () => {
      it('should return products with highest margins', async () => {
        const products = await repository.getHighestMarginProducts(2);
        expect(products).toHaveLength(2);
        expect(products[0].name).toBe('Produto Margem Alta');
        expect(products[1].name).toBe('Produto Margem Média');
      });

      it('should respect the limit parameter', async () => {
        const products = await repository.getHighestMarginProducts(1);
        expect(products).toHaveLength(1);
      });
    });

    describe('getLowestMarginProducts', () => {
      it('should return products with lowest margins', async () => {
        const products = await repository.getLowestMarginProducts(2);
        expect(products).toHaveLength(2);
        expect(products[0].name).toBe('Produto Margem Baixa');
        expect(products[1].name).toBe('Produto Margem Média');
      });
    });
  });

  describe('Validation methods', () => {
    beforeEach(async () => {
      const products = [
        Product.fake().aProduct()
          .withName('Produto Único')
          .withCategoryId('category-1')
          .withBarcode('1111111111111')
          .build(),
        Product.fake().aProduct()
          .withName('Produto Duplicado')
          .withCategoryId('category-1')
          .withBarcode('2222222222222')
          .build(),
      ];
      
      await repository.bulkInsert(products);
    });

    describe('existsByBarcode', () => {
      it('should return true for existing barcode', async () => {
        const exists = await repository.existsByBarcode('1111111111111');
        expect(exists).toBe(true);
      });

      it('should return false for non-existing barcode', async () => {
        const exists = await repository.existsByBarcode('9999999999999');
        expect(exists).toBe(false);
      });

      it('should exclude specific product id', async () => {
        const product = repository.items[0];
        const exists = await repository.existsByBarcode('1111111111111', product.product_id);
        expect(exists).toBe(false);
      });
    });

    describe('existsByNameInCategory', () => {
      it('should return true for existing name in category', async () => {
        const exists = await repository.existsByNameInCategory('Produto Único', 'category-1');
        expect(exists).toBe(true);
      });

      it('should return false for non-existing name in category', async () => {
        const exists = await repository.existsByNameInCategory('Produto Inexistente', 'category-1');
        expect(exists).toBe(false);
      });

      it('should be case insensitive', async () => {
        const exists = await repository.existsByNameInCategory('produto único', 'category-1');
        expect(exists).toBe(true);
      });

      it('should exclude specific product id', async () => {
        const product = repository.items[0];
        const exists = await repository.existsByNameInCategory('Produto Único', 'category-1', product.product_id);
        expect(exists).toBe(false);
      });
    });
  });

  describe('Compliance and audit methods', () => {
    beforeEach(async () => {
      const products = [
        Product.fake().aProduct()
          .withName('Produto Caro Sem NCM')
          .withPrice(75.00)
          .withCostPrice(50.00)
          .withNcmCode(null) // Explicitamente sem NCM
          .build(), // Precisa de NCM mas não tem
        Product.fake().aProduct()
          .withName('Produto Perecível Sem Specs')
          .withRequiresWeighing(true)
          .withPrice(20.00)
          .withCostPrice(15.00)
          .withWeight(null) // Explicitamente sem peso
          .withVolume(null) // Explicitamente sem volume
          .build(), // Perecível sem peso/volume
        Product.fake().aProduct()
          .withName('Produto Sem Custo')
          .withPrice(25.00)
          .withCostPrice(null) // Explicitamente sem custo
          .build(), // Sem custo definido
        Product.fake().aProduct()
          .withName('Produto OK')
          .withPrice(10.00)
          .withCostPrice(7.00)
          .withNcmCode('12345678')
          .build(),
      ];
      
      await repository.bulkInsert(products);
    });

    describe('findComplianceIssues', () => {
      it('should find products with compliance issues', async () => {
        const products = await repository.findComplianceIssues();
        expect(products.length).toBeGreaterThan(0);
        
        const productNames = products.map(p => p.name);
        expect(productNames).toContain('Produto Caro Sem NCM');
        expect(productNames).toContain('Produto Perecível Sem Specs');
        expect(productNames).toContain('Produto Sem Custo');
        expect(productNames).not.toContain('Produto OK');
      });
    });

    describe('findProductsNeedingPriceReview', () => {
      it('should find products needing price review', async () => {
        const products = await repository.findProductsNeedingPriceReview();
        expect(products.length).toBeGreaterThan(0);
        
        const productNames = products.map(p => p.name);
        expect(productNames).toContain('Produto Sem Custo');
      });
    });

    describe('findDuplicateProducts', () => {
      it('should find duplicate products', async () => {
        // Adicionar produtos duplicados
        const duplicateProducts = [
          Product.fake().aProduct()
            .withName('Produto Duplicado')
            .withCategoryId('category-1')
            .withBarcode('1111111111111')
            .build(),
          Product.fake().aProduct()
            .withName('Produto Duplicado')
            .withCategoryId('category-1')
            .withBarcode('2222222222222')
            .build(),
        ];
        
        await repository.bulkInsert(duplicateProducts);
        
        const duplicates = await repository.findDuplicateProducts();
        expect(duplicates.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Temporal analysis methods', () => {
    beforeEach(async () => {
      const now = new Date();
      const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
      const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
      
      const products = [
        Product.fake().aProduct()
          .withName('Produto Recente')
          .build(),
        Product.fake().aProduct()
          .withName('Produto Antigo')
          .build(),
      ];
      
      // Simular datas de criação
      products[1].created_at = tenDaysAgo;
      products[1].updated_at = fiveDaysAgo;
      
      await repository.bulkInsert(products);
    });

    describe('findRecentlyCreated', () => {
      it('should find recently created products', async () => {
        const products = await repository.findRecentlyCreated(7);
        expect(products).toHaveLength(1);
        expect(products[0].name).toBe('Produto Recente');
      });
    });

    describe('findRecentlyModified', () => {
      it('should find recently modified products', async () => {
        const products = await repository.findRecentlyModified(7);
        expect(products).toHaveLength(1);
        expect(products[0].name).toBe('Produto Antigo');
      });
    });
  });

  describe('Statistics methods', () => {
    beforeEach(async () => {
      const products = [
        Product.fake().aProduct()
          .withCategoryId('category-1')
          .withBrand('Marca A')
          .withPrice(10.00)
          .withCostPrice(7.00)
          .build(),
        Product.fake().aProduct()
          .withCategoryId('category-1')
          .withBrand('Marca B')
          .withPrice(15.00)
          .withCostPrice(10.00)
          .build(),
        Product.fake().aProduct()
          .withCategoryId('category-2')
          .withBrand('Marca A')
          .withPrice(20.00)
          .withCostPrice(12.00)
          .build(),
      ];
      
      await repository.bulkInsert(products);
    });

    describe('countByCategory', () => {
      it('should count products by category', async () => {
        const counts = await repository.countByCategory();
        expect(counts).toHaveLength(2);
        
        const category1Count = counts.find(c => c.category_id === 'category-1');
        const category2Count = counts.find(c => c.category_id === 'category-2');
        
        expect(category1Count?.count).toBe(2);
        expect(category2Count?.count).toBe(1);
      });
    });

    describe('countByBrand', () => {
      it('should count products by brand', async () => {
        const counts = await repository.countByBrand();
        expect(counts).toHaveLength(2);
        
        const marcaACount = counts.find(c => c.brand === 'Marca A');
        const marcaBCount = counts.find(c => c.brand === 'Marca B');
        
        expect(marcaACount?.count).toBe(2);
        expect(marcaBCount?.count).toBe(1);
      });
    });

    describe('getTotalInventoryValue', () => {
      it('should calculate total inventory value', async () => {
        const total = await repository.getTotalInventoryValue();
        expect(total).toBe(29.00); // 7 + 10 + 12
      });
    });
  });

  describe('Filter and sort methods', () => {
    beforeEach(async () => {
      const products = [
        Product.fake().aProduct()
          .withName('Produto A')
          .withCategoryId('category-1')
          .withBrand('Marca X')
          .withPrice(10.00)
          .withUnitType(UnitType.UNIT)
          .withBarcode('1111111111111')
          .build(),
        Product.fake().aProduct()
          .withName('Produto B')
          .withCategoryId('category-2')
          .withBrand('Marca Y')
          .withPrice(20.00)
          .withUnitType(UnitType.KG)
          .withBarcode('2222222222222')
          .withRequiresWeighing(true)
          .deactivate()
          .build(),
      ];
      
      await repository.bulkInsert(products);
    });

    describe('applyFilter', () => {
      it('should filter by name (case insensitive)', async () => {
        const filter: ProductFilter = { name: 'produto a' };
        const filtered = await repository['applyFilter'](repository.items, filter);
        expect(filtered).toHaveLength(1);
        expect(filtered[0].name).toBe('Produto A');
      });

      it('should filter by category', async () => {
        const filter: ProductFilter = { category_id: 'category-1' };
        const filtered = await repository['applyFilter'](repository.items, filter);
        expect(filtered).toHaveLength(1);
        expect(filtered[0].name).toBe('Produto A');
      });

      it('should filter by brand', async () => {
        const filter: ProductFilter = { brand: 'Marca X' };
        const filtered = await repository['applyFilter'](repository.items, filter);
        expect(filtered).toHaveLength(1);
        expect(filtered[0].name).toBe('Produto A');
      });

      it('should filter by unit type', async () => {
        const filter: ProductFilter = { unit_type: UnitType.KG };
        const filtered = await repository['applyFilter'](repository.items, filter);
        expect(filtered).toHaveLength(1);
        expect(filtered[0].name).toBe('Produto B');
      });

      it('should filter by active status', async () => {
        const filter: ProductFilter = { is_active: true };
        const filtered = await repository['applyFilter'](repository.items, filter);
        expect(filtered).toHaveLength(1);
        expect(filtered[0].name).toBe('Produto A');
      });

      it('should filter by barcode', async () => {
        const filter: ProductFilter = { barcode: '1111111111111' };
        const filtered = await repository['applyFilter'](repository.items, filter);
        expect(filtered).toHaveLength(1);
        expect(filtered[0].name).toBe('Produto A');
      });

      it('should filter by price range', async () => {
        const filter: ProductFilter = { price_min: 15.00, price_max: 25.00 };
        const filtered = await repository['applyFilter'](repository.items, filter);
        expect(filtered).toHaveLength(1);
        expect(filtered[0].name).toBe('Produto B');
      });

      it('should filter by requires weighing', async () => {
        const filter: ProductFilter = { requires_weighing: true };
        const filtered = await repository['applyFilter'](repository.items, filter);
        expect(filtered).toHaveLength(1);
        expect(filtered[0].name).toBe('Produto B');
      });

      it('should apply multiple filters', async () => {
        const filter: ProductFilter = {
          category_id: 'category-1',
          is_active: true,
          unit_type: UnitType.UNIT
        };
        const filtered = await repository['applyFilter'](repository.items, filter);
        expect(filtered).toHaveLength(1);
        expect(filtered[0].name).toBe('Produto A');
      });

      it('should return all items when filter is null', async () => {
        const filtered = await repository['applyFilter'](repository.items, null);
        expect(filtered).toHaveLength(2);
      });
    });

    describe('applySort', () => {
      it('should sort by name ascending', () => {
        const sorted = repository['applySort'](repository.items, 'name', 'asc');
        expect(sorted[0].name).toBe('Produto A');
        expect(sorted[1].name).toBe('Produto B');
      });

      it('should sort by name descending', () => {
        const sorted = repository['applySort'](repository.items, 'name', 'desc');
        expect(sorted[0].name).toBe('Produto B');
        expect(sorted[1].name).toBe('Produto A');
      });

      it('should sort by price ascending', () => {
        const sorted = repository['applySort'](repository.items, 'price', 'asc');
        expect(sorted[0].price).toBe(10.00);
        expect(sorted[1].price).toBe(20.00);
      });

      it('should sort by price descending', () => {
        const sorted = repository['applySort'](repository.items, 'price', 'desc');
        expect(sorted[0].price).toBe(20.00);
        expect(sorted[1].price).toBe(10.00);
      });

      it('should sort by is_active', () => {
        const sorted = repository['applySort'](repository.items, 'is_active', 'desc');
        expect(sorted[0].is_active).toBe(true);
        expect(sorted[1].is_active).toBe(false);
      });

      it('should return original order for invalid sort field', () => {
        const sorted = repository['applySort'](repository.items, 'invalid_field', 'asc');
        expect(sorted).toEqual(repository.items);
      });

      it('should use name as secondary sort criteria', () => {
        // Adicionar produtos com mesmo preço
        const samePrice = [
          Product.fake().aProduct().withName('Z Product').withPrice(15.00).build(),
          Product.fake().aProduct().withName('A Product').withPrice(15.00).build(),
        ];
        
        const sorted = repository['applySort'](samePrice, 'price', 'asc');
        expect(sorted[0].name).toBe('A Product');
        expect(sorted[1].name).toBe('Z Product');
      });
    });
  });

  describe('Simulated integration methods', () => {
    beforeEach(async () => {
      const products = [
        Product.fake().aProduct().withName('Produto Ativo 1').build(),
        Product.fake().aProduct().withName('Produto Ativo 2').build(),
        Product.fake().aProduct().withName('Produto Inativo').deactivate().build(),
      ];
      
      await repository.bulkInsert(products);
    });

    describe('findTopSellingProducts', () => {
      it('should return active products sorted by name', async () => {
        const products = await repository.findTopSellingProducts(2);
        expect(products).toHaveLength(2);
        expect(products.every(p => p.is_active)).toBe(true);
        expect(products[0].name).toBe('Produto Ativo 1');
        expect(products[1].name).toBe('Produto Ativo 2');
      });

      it('should respect limit parameter', async () => {
        const products = await repository.findTopSellingProducts(1);
        expect(products).toHaveLength(1);
      });
    });

    describe('findLowStockProducts', () => {
      it('should return active products (simulated)', async () => {
        const products = await repository.findLowStockProducts();
        expect(products).toHaveLength(2);
        expect(products.every(p => p.is_active)).toBe(true);
      });
    });
  });

  describe('getEntity', () => {
    it('should return Product constructor', () => {
      const EntityClass = repository.getEntity();
      expect(EntityClass).toBe(Product);
    });
  });
});