import { Category, CategoryId } from '../category.aggregate';

describe('Category Aggregate Unit Tests', () => {
  describe('constructor', () => {
    test('should create category with default values', () => {
      const category = Category.fake().aCategory().withName('Bebidas').withStoreId('store-123').build();

      expect(category.category_id).toBeInstanceOf(CategoryId);
      expect(category.store_id).toBe('store-123');
      expect(category.name).toBe('Bebidas');
      expect(category.is_active).toBe(true);
      expect(category.parent_category_id).toBeNull();
      expect(category.created_at).toBeInstanceOf(Date);
      expect(category.updated_at).toBeInstanceOf(Date);
    });

    test('should create category with all properties', () => {
      const parentId = new CategoryId();
      const category = Category.fake()
        .aCategory()
        .withStoreId('store-123')
        .withName('Laticínios')
        .withDescription('Produtos lácteos e derivados')
        .deactivate()
        .withParentCategoryId(parentId)
        .withTaxRate(18.5)
        .withDefaultMarginPercentage(30.0)
        .withRequiresExpiryDate(true)
        .withDisplayOrder(5)
        .withIconName('dairy-icon')
        .build();

      expect(category.store_id).toBe('store-123');
      expect(category.name).toBe('Laticínios');
      expect(category.description).toBe('Produtos lácteos e derivados');
      expect(category.is_active).toBe(false);
      expect(category.parent_category_id).toBe(parentId);
      expect(category.tax_rate).toBe(18.5);
      expect(category.default_margin_percentage).toBe(30.0);
      expect(category.requires_expiry_date).toBe(true);
      expect(category.display_order).toBe(5);
      expect(category.icon_name).toBe('dairy-icon');
    });
  });

  describe('create command', () => {
    test('should create category with validation', () => {
      const category = Category.create({
        store_id: 'store-123',
        name: 'Bebidas',
      });

      expect(category).toBeInstanceOf(Category);
      expect(category.store_id).toBe('store-123');
      expect(category.name).toBe('Bebidas');
      expect(category.is_active).toBe(true);
    });

    test('should create category with supermarket specific fields', () => {
      const parentId = new CategoryId();
      
      const category = Category.create({
        store_id: 'store-123',
        name: 'Carnes',
        description: 'Carnes frescas e processadas',
        parent_category_id: parentId.id,
        tax_rate: 12.0,
        default_margin_percentage: 25.0,
        requires_expiry_date: true,
        display_order: 3,
        icon_name: 'meat-icon',
      });

      expect(category.name).toBe('Carnes');
      expect(category.description).toBe('Carnes frescas e processadas');
      expect(category.parent_category_id).toEqual(parentId);
      expect(category.tax_rate).toBe(12.0);
      expect(category.default_margin_percentage).toBe(25.0);
      expect(category.requires_expiry_date).toBe(true);
      expect(category.display_order).toBe(3);
      expect(category.icon_name).toBe('meat-icon');
    });
  });

  describe('business methods', () => {
    let category: Category;

    beforeEach(() => {
      category = Category.fake()
        .aCategory()
        .withStoreId('store-123')
        .withName('Bebidas')
        .withDescription('Bebidas em geral')
        .withRequiresExpiryDate(false) // Garantir que inicia com false
        .build();
    });

    test('should activate category', () => {
      category.deactivate();
      category.activate();
      expect(category.is_active).toBe(true);
    });

    test('should deactivate category', () => {
      category.deactivate();
      expect(category.is_active).toBe(false);
    });

    test('should change name', () => {
      category.changeName('Refrigerantes');
      expect(category.name).toBe('Refrigerantes');
      expect(category.updated_at).toBeInstanceOf(Date);
    });

    test('should change description', () => {
      category.changeDescription('Bebidas geladas e quentes');
      expect(category.description).toBe('Bebidas geladas e quentes');
      expect(category.updated_at).toBeInstanceOf(Date);
    });

    test('should update tax rate', () => {
      category.updateTaxRate(15.5);
      expect(category.tax_rate).toBe(15.5);
      expect(category.updated_at).toBeInstanceOf(Date);
    });

    test('should update default margin', () => {
      category.updateDefaultMargin(35.0);
      expect(category.default_margin_percentage).toBe(35.0);
      expect(category.updated_at).toBeInstanceOf(Date);
    });

    test('should update display order', () => {
      category.updateDisplayOrder(10);
      expect(category.display_order).toBe(10);
      expect(category.updated_at).toBeInstanceOf(Date);
    });

    test('should set expiry date requirement', () => {
      category.setRequiresExpiryDate(true);
      expect(category.requires_expiry_date).toBe(true);
      expect(category.updated_at).toBeInstanceOf(Date);
    });

    test('should update icon name', () => {
      category.setIcon('new-icon');
      expect(category.icon_name).toBe('new-icon');
      expect(category.updated_at).toBeInstanceOf(Date);
    });

    test('should set parent category', () => {
      const parentId = new CategoryId();
      category.setParentCategory(parentId);
      expect(category.parent_category_id).toBe(parentId);
      expect(category.updated_at).toBeInstanceOf(Date);
    });

    test('should check if is root category', () => {
      expect(category.isRootCategory()).toBe(true);
      
      const parentId = new CategoryId();
      category.setParentCategory(parentId);
      expect(category.isRootCategory()).toBe(false);
    });

    test('should check if needs expiry control', () => {
      expect(category.needsExpiryControl()).toBe(false);
      
      category.setRequiresExpiryDate(true);
      expect(category.needsExpiryControl()).toBe(true);
    });

    test('should calculate suggested price', () => {
      category.updateDefaultMargin(25.0);
      const suggestedPrice = category.calculateSuggestedPrice(100);
      expect(suggestedPrice).toBe(125.0);
      
      const noPriceCalculation = category.calculateSuggestedPrice(0);
      expect(noPriceCalculation).toBeNull();
    });

    test('should check if is perishable category', () => {
      const perishableCategory = Category.fake().aCategory().withName('Laticínios').build();
      expect(perishableCategory.isPerishableCategory()).toBe(true);
      
      const nonPerishableCategory = Category.fake().aCategory().withName('Eletrônicos').build();
      expect(nonPerishableCategory.isPerishableCategory()).toBe(false);
    });

    test('should check if should have tax rate', () => {
      const taxableCategory = Category.fake().aCategory().withName('Bebidas').build();
      expect(taxableCategory.shouldHaveTaxRate()).toBe(true);
      
      const nonTaxableCategory = Category.fake().aCategory().withName('Alimentos Básicos').build();
      expect(nonTaxableCategory.shouldHaveTaxRate()).toBe(false);
    });

    test('should check if is promotion eligible', () => {
      expect(category.isPromotionEligible()).toBe(true);
      
      const medicineCategory = Category.fake().aCategory().withName('Medicamentos').build();
      expect(medicineCategory.isPromotionEligible()).toBe(false);
    });
  });

  describe('validation', () => {
    test('should validate category on create', () => {
      const category = Category.create({
        store_id: 'store-123',
        name: 'Valid Category',
      });
      
      expect(category).toBeInstanceOf(Category);
    });

    test('should validate category on business methods', () => {
      const category = Category.fake().aCategory().withStoreId('store-123').withName('Test Category').build();
      
      category.changeName('Updated Name');
      expect(category.name).toBe('Updated Name');
    });
  });

  describe('CategoryId value object', () => {
    test('should create CategoryId', () => {
      const categoryId = new CategoryId();
      expect(categoryId).toBeInstanceOf(CategoryId);
      expect(categoryId.id).toBeDefined();
    });

    test('should accept valid uuid', () => {
      const uuid = 'c3e9b0d0-7b6f-4a8e-8e1f-3f9e6a2f7e3c';
      const categoryId = new CategoryId(uuid);
      expect(categoryId.id).toBe(uuid);
    });
  });

  describe('fake builder', () => {
    test('should create category using fake builder', () => {
      const category = Category.fake().aCategory().build();
      expect(category).toBeInstanceOf(Category);
    });

    test('should create category with hierarchy using fake builder', () => {
      const parentCategory = Category.fake().aCategory().asRootCategory().build();
      const childCategory = Category.fake().aCategory().asChildCategory(parentCategory.category_id).build();
      
      expect(parentCategory.isRootCategory()).toBe(true);
      expect(childCategory.isRootCategory()).toBe(false);
      expect(childCategory.parent_category_id).toBe(parentCategory.category_id);
    });

    test('should create supermarket specific categories', () => {
      const beverageCategory = Category.fake().aCategory().withSupermarketCategory('beverage').build();
      
      // Alterado: Verificar propriedades comuns em vez de nome específico (devido à randomização)
      expect(beverageCategory.tax_rate).toBeGreaterThanOrEqual(17);
      expect(beverageCategory.tax_rate).toBeLessThanOrEqual(27);
      expect(beverageCategory.requires_expiry_date).toBe(true);
      expect(beverageCategory.icon_name).toBeDefined();
    });
  });

  describe('hierarchy business rules', () => {
    test('should create category tree structure', () => {
      // Categoria raiz: Bebidas
      const bebidasCategory = Category.fake()
        .aCategory()
        .withStoreId('store-123')
        .withSupermarketCategory('beverage')
        .asRootCategory()
        .withDisplayOrder(1)
        .build();

      // Subcategoria: Refrigerantes
      const refrigerantesCategory = Category.fake()
        .aCategory()
        .withStoreId('store-123')
        .withName('Refrigerantes')
        .withDescription('Refrigerantes e sodas')
        .asChildCategory(bebidasCategory.category_id)
        .withRequiresExpiryDate(true)
        .withDisplayOrder(1)
        .withIconName('soda-icon')
        .build();

      // Subcategoria: Sucos
      const sucosCategory = Category.fake()
        .aCategory()
        .withStoreId('store-123')
        .withName('Sucos')
        .withDescription('Sucos naturais e industrializados')
        .asChildCategory(bebidasCategory.category_id)
        .withRequiresExpiryDate(true)
        .withDisplayOrder(2)
        .withIconName('juice-icon')
        .build();

      expect(bebidasCategory.isRootCategory()).toBe(true);
      expect(refrigerantesCategory.isRootCategory()).toBe(false);
      expect(sucosCategory.isRootCategory()).toBe(false);
      expect(refrigerantesCategory.parent_category_id).toEqual(bebidasCategory.category_id);
      expect(sucosCategory.parent_category_id).toEqual(bebidasCategory.category_id);
    });
  });

  describe('business rules', () => {
    test('should validate category hierarchy', () => {
      const parentCategory = Category.fake().aCategory().asRootCategory().build();
      
      // Corrigindo: theCategories retorna um builder, precisa chamar build() primeiro
      const childCategories = Category.fake().theCategories(3).build().map((category, index) => {
        category.setParentCategory(parentCategory.category_id);
        category.updateDisplayOrder(index + 1);
        return category;
      });
      
      expect(parentCategory.isRootCategory()).toBe(true);
      childCategories.forEach(child => {
        expect(child.isRootCategory()).toBe(false);
        expect(child.parent_category_id).toBe(parentCategory.category_id);
      });
    });

    test('should handle supermarket category types', () => {
      const foodCategory = Category.fake().aCategory().withSupermarketCategory('food').build();
      const cleaningCategory = Category.fake().aCategory().withSupermarketCategory('cleaning').build();
      
      // Alterado: Verificar propriedades comuns em vez de nome específico
      expect(foodCategory.tax_rate).toBeGreaterThanOrEqual(0);
      expect(foodCategory.tax_rate).toBeLessThanOrEqual(7);
      expect(foodCategory.requires_expiry_date).toBe(true);
      
      expect(cleaningCategory.tax_rate).toBeGreaterThanOrEqual(17);
      expect(cleaningCategory.tax_rate).toBeLessThanOrEqual(18);
      expect(cleaningCategory.requires_expiry_date).toBe(false);
    });
  });

  describe('store_id and multi-tenancy', () => {
    test('should have validation error without store_id', () => {
      // @ts-ignore store_id omitido intencionalmente
      const category = Category.create({
        name: 'Test',
      });
  
      expect(category.notification.hasErrors()).toBe(true);
      // Verifica erro específico (ajuste mensagem exata se necessário)
      expect(category.notification.errors.size).toBe(1);
      expect(category.notification.errors.has('store_id')).toBe(true);
      expect(category.notification.errors.get('store_id')?.includes('store_id should not be empty')).toBe(true);
    });

    test('should create category with specific store_id using fake builder', () => {
      const storeId = 'store-123';
      const category = Category.fake().aCategory().withStoreId(storeId).build();
      expect(category.store_id).toBe(storeId);
    });

    test('should create categories for different stores', () => {
      const categories = Category.fake().theCategories(2).withRandomStoreIds().build();
      expect(categories[0].store_id).not.toBe(categories[1].store_id);
    });

    test('should create categories for specific store', () => {
      const storeId = 'store-456';
      const categories = Category.fake().categoriesForStore(storeId, 3).build();
      categories.forEach(cat => {
        expect(cat.store_id).toBe(storeId);
      });
    });
  });
});