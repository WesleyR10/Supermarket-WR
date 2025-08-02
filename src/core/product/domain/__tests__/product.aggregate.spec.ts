import { Product, ProductId, UnitType } from '../product.aggregate';

describe('Product Aggregate Unit Tests', () => {
  describe('constructor', () => {
    test('should create product with default values', () => {
      const product = Product.fake()
        .aProduct()
        .withStoreId('store-123')
        .withName('Coca-Cola 2L')
        .withCategoryId('category-123')
        .withBarcode('7894900011517')
        .withPrice(5.99)
        .build();

      expect(product.product_id).toBeInstanceOf(ProductId);
      expect(product.store_id).toBe('store-123');
      expect(product.category_id).toBe('category-123');
      expect(product.name).toBe('Coca-Cola 2L');
      expect(product.barcode).toBe('7894900011517');
      expect(product.price).toBe(5.99);
      expect(product.is_active).toBe(true);
      expect(product.unit_type).toBe(UnitType.UNIT);
      expect(product.requires_weighing).toBe(false);
      expect(product.created_at).toBeInstanceOf(Date);
      expect(product.updated_at).toBeInstanceOf(Date);
    });

    test('should create product with all properties', () => {
      const product = Product.fake()
        .aProduct()
        .withStoreId('store-123')
        .withCategoryId('category-123')
        .withName('Carne Bovina Premium')
        .withDescription('Carne bovina de primeira qualidade')
        .withBarcode('1234567890123')
        .withPrice(29.99)
        .withCostPrice(18.50)
        .deactivate()
        .withBrand('Friboi')
        .withUnitType(UnitType.KG)
        .withWeight(1000)
        .withSupplierCode('FRIB001')
        .withNcmCode('02013000')
        .withRequiresWeighing(true)
        .build();

      expect(product.store_id).toBe('store-123');
      expect(product.category_id).toBe('category-123');
      expect(product.name).toBe('Carne Bovina Premium');
      expect(product.description).toBe('Carne bovina de primeira qualidade');
      expect(product.barcode).toBe('1234567890123');
      expect(product.price).toBe(29.99);
      expect(product.cost_price).toBe(18.50);
      expect(product.is_active).toBe(false);
      expect(product.brand).toBe('Friboi');
      expect(product.unit_type).toBe(UnitType.KG);
      expect(product.weight).toBe(1000);
      expect(product.supplier_code).toBe('FRIB001');
      expect(product.ncm_code).toBe('02013000');
      expect(product.requires_weighing).toBe(true);
    });
  });

  describe('business methods', () => {
    test('should change name', () => {
      const product = Product.fake().aProduct().build() ;
      product.changeName('New Product Name');
      expect(product.name).toBe('New Product Name');
    });

    test('should change price', () => {
      const product = Product.fake().aProduct().build() ;
      product.changePrice(15.99);
      expect(product.price).toBe(15.99);
    });

    test('should activate product', () => {
      const product = Product.fake().aProduct().deactivate().build() ;
      product.activate();
      expect(product.is_active).toBe(true);
    });

    test('should deactivate product', () => {
      const product = Product.fake().aProduct().activate().build() ;
      product.deactivate();
      expect(product.is_active).toBe(false);
    });

    test('should calculate margin percentage', () => {
      const product = Product.fake()
        .aProduct()
        .withPrice(10.00)
        .withCostPrice(7.00)
        .build() ;
      
      const margin = product.calculateMarginPercentage();
      expect(margin).toBeCloseTo(42.86, 2);
    });

    test('should return null margin when cost price is not set', () => {
      const product = Product.fake()
        .aProduct()
        .withPrice(10.00)
        .withCostPrice(null)
        .build();
      
      const margin = product.calculateMarginPercentage();
      expect(margin).toBeNull();
    });

    test('should check if product is perishable based on category', () => {
      const product = Product.fake().aProduct().build() ;
      expect(typeof product.isPerishable).toBe('function');
    });
  });

  describe('validation', () => {
    test('should validate product on create', () => {
      const product = Product.create({
        store_id: 'store-123',
        category_id: 'category-123',
        name: 'Valid Product',
        barcode: '1234567890123',
        price: 10.99,
      });
      
      expect(product).toBeInstanceOf(Product);
    });

    test('should validate product on business methods', () => {
      const product = Product.fake()
        .aProduct()
        .withStoreId('store-123')
        .withName('Test Product')
        .build();
      
      product.changeName('Updated Name');
      expect(product.name).toBe('Updated Name');
    });
  });

  describe('ProductId value object', () => {
    test('should create ProductId', () => {
      const productId = new ProductId();
      expect(productId).toBeInstanceOf(ProductId);
      expect(productId.id).toBeDefined();
    });

    test('should accept valid uuid', () => {
      const uuid = 'c3e9b0d0-7b6f-4a8e-8e1f-3f9e6a2f7e3c';
      const productId = new ProductId(uuid);
      expect(productId.id).toBe(uuid);
    });
  });

  describe('fake builder', () => {
    test('should create product using fake builder', () => {
      const product = Product.fake().aProduct().build();
      expect(product).toBeInstanceOf(Product);
    });

    test('should create weighable product using fake builder', () => {
      const product = Product.fake()
        .aProduct()
        .withUnitType(UnitType.KG)
        .withRequiresWeighing(true)
        .build();
      
      expect(product.unit_type).toBe(UnitType.KG);
      expect(product.requires_weighing).toBe(true);
    });

    test('should create product with specific brand', () => {
      const product = Product.fake()
        .aProduct()
        .withBrand('Coca-Cola')
        .build();
      
      expect(product.brand).toBe('Coca-Cola');
    });
  });

  describe('store_id and multi-tenancy', () => {
    test('should have validation error without store_id', () => {
      // @ts-ignore store_id omitido intencionalmente
      const product = Product.create({
        category_id: 'category-123',
        name: 'Test Product',
        barcode: '1234567890123',
        price: 10.99,
      });
  
      expect(product.notification.hasErrors()).toBe(true);
      expect(product.notification.errors.size).toBe(1);
      expect(product.notification.errors.has('store_id')).toBe(true);
      expect(product.notification.errors.get('store_id')?.includes('store_id should not be empty')).toBe(true);
    });

    test('should have validation error without category_id', () => {
      // @ts-ignore category_id omitido intencionalmente
      const product = Product.create({
        store_id: 'store-123',
        name: 'Test Product',
        barcode: '1234567890123',
        price: 10.99,
      });
  
      expect(product.notification.hasErrors()).toBe(true);
      expect(product.notification.errors.has('category_id')).toBe(true);
      expect(product.notification.errors.get('category_id')?.includes('category_id should not be empty')).toBe(true);
    });

    test('should create product with specific store_id using fake builder', () => {
      const storeId = 'store-123';
      const product = Product.fake().aProduct().withStoreId(storeId).build();
      expect(product.store_id).toBe(storeId);
    });

    test('should create products for different stores', () => {
      const products = Product.fake().theProducts(2).withRandomStoreIds().build();
      expect(products[0].store_id).not.toBe(products[1].store_id);
    });

    test('should create products for specific store', () => {
      const storeId = 'store-456';
      const products = Product.fake().productsForStore(storeId, 3).build();
      products.forEach(product => {
        expect(product.store_id).toBe(storeId);
      });
    });

    test('should create products from different stores', () => {
      const products = Product.fake().productsFromDifferentStores(5).build();
      expect(products).toHaveLength(5);
      // Verifica que nem todos os produtos têm o mesmo store_id
      const uniqueStoreIds = new Set(products.map(p => p.store_id));
      expect(uniqueStoreIds.size).toBeGreaterThan(1);
    });

    test('should create product for specific store and category', () => {
      const storeId = 'store-789';
      const categoryId = 'category-456';
      const product = Product.fake()
        .aProduct()
        .forStoreAndCategory(storeId, categoryId)
        .build();
      
      expect(product.store_id).toBe(storeId);
      expect(product.category_id).toBe(categoryId);
    });
  });

  describe('change methods', () => {
    let product: Product;

    beforeEach(() => {
      product = Product.fake()
        .aProduct()
        .withStoreId('store-123')
        .withCategoryId('category-123')
        .withName('Original Product')
        .withDescription('Original description')
        .withBarcode('1234567890123')
        .withPrice(25.99)
        .withCostPrice(15.00)
        .withBrand('Original Brand')
        .withUnitType(UnitType.UNIT)
        .withWeight(500)
        .withVolume(250)
        .withDimensions('10x5x15')
        .withSupplierCode('SUP001')
        .withNcmCode('12345678')
        .withRequiresWeighing(false)
        .build();
    });

    test('should change description', () => {
      const oldUpdatedAt = product.updated_at;
      product.changeDescription('New description');
      expect(product.description).toBe('New description');
      expect(product.updated_at).not.toBe(oldUpdatedAt);
    });

    test('should change barcode', () => {
      const oldUpdatedAt = product.updated_at;
      product.changeBarcode('9876543210987');
      expect(product.barcode).toBe('9876543210987');
      expect(product.updated_at).not.toBe(oldUpdatedAt);
    });

    test('should change cost price', () => {
      const oldUpdatedAt = product.updated_at;
      product.changeCostPrice(20.00);
      expect(product.cost_price).toBe(20.00);
      expect(product.updated_at).not.toBe(oldUpdatedAt);
    });

    test('should change brand', () => {
      const oldUpdatedAt = product.updated_at;
      product.changeBrand('New Brand');
      expect(product.brand).toBe('New Brand');
      expect(product.updated_at).not.toBe(oldUpdatedAt);
    });

    test('should change unit type', () => {
      const oldUpdatedAt = product.updated_at;
      product.changeUnitType(UnitType.KG);
      expect(product.unit_type).toBe(UnitType.KG);
      expect(product.updated_at).not.toBe(oldUpdatedAt);
    });

    test('should change weight', () => {
      const oldUpdatedAt = product.updated_at;
      product.changeWeight(1000);
      expect(product.weight).toBe(1000);
      expect(product.updated_at).not.toBe(oldUpdatedAt);
    });

    test('should change volume', () => {
      const oldUpdatedAt = product.updated_at;
      product.changeVolume(500);
      expect(product.volume).toBe(500);
      expect(product.updated_at).not.toBe(oldUpdatedAt);
    });

    test('should change dimensions', () => {
      const oldUpdatedAt = product.updated_at;
      product.changeDimensions('20x10x30');
      expect(product.dimensions).toBe('20x10x30');
      expect(product.updated_at).not.toBe(oldUpdatedAt);
    });

    test('should change supplier code', () => {
      const oldUpdatedAt = product.updated_at;
      product.changeSupplierCode('SUP999');
      expect(product.supplier_code).toBe('SUP999');
      expect(product.updated_at).not.toBe(oldUpdatedAt);
    });

    test('should change ncm code', () => {
      const oldUpdatedAt = product.updated_at;
      product.changeNcmCode('87654321');
      expect(product.ncm_code).toBe('87654321');
      expect(product.updated_at).not.toBe(oldUpdatedAt);
    });

    test('should change requires weighing', () => {
      const oldUpdatedAt = product.updated_at;
      product.changeRequiresWeighing(true);
      expect(product.requires_weighing).toBe(true);
      expect(product.updated_at).not.toBe(oldUpdatedAt);
    });

    test('should set description to null', () => {
      product.changeDescription(null);
      expect(product.description).toBeNull();
    });

    test('should set cost price to null', () => {
      product.changeCostPrice(null);
      expect(product.cost_price).toBeNull();
    });
  });
});