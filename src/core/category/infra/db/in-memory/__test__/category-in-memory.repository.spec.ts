import { CategoryInMemoryRepository } from '../category-in-memory.repository';
import { Category, CategoryId } from '../../../../domain/category.aggregate';
import { CategoryFilter } from '../../../../domain/repositories/category.repository.interface';

describe('CategoryInMemoryRepository', () => {
  let repository: CategoryInMemoryRepository;

  beforeEach(() => {
    repository = new CategoryInMemoryRepository();
  });

  describe('applyFilter method', () => {
    // Testa o filtro de categorias por nome (case insensitive)
    it('should filter categories by name (case insensitive)', async () => {
      const categories = [
        Category.fake().aCategory().withName('Alimentos').withStoreId('1').build(),
        Category.fake().aCategory().withName('Alimentos').withStoreId('2').build(),
        Category.fake().aCategory().withName('Bebidas').withStoreId('1').build(),
        Category.fake().aCategory().withName('Limpeza').withStoreId('1').build(),
      ];
      repository.items = categories;

      const filter: CategoryFilter = { name: 'alimentos', store_id:'1' };
      const filteredItems = await repository['applyFilter'](categories, filter);
      expect(filteredItems).toHaveLength(1);
      expect(filteredItems[0].name).toBe('Alimentos');
    });

    // Testa o filtro de categorias por nome parcial (case insensitive)
    it('should filter categories by partial name match (case insensitive)', async () => {
      const categories = [
        Category.fake().aCategory().withName('Categoria 1').withDescription('Produtos alimentícios').withStoreId('1').build(),
        Category.fake().aCategory().withName('Categoria 2').withDescription('Produtos de limpeza').withStoreId('1').build(),
        Category.fake().aCategory().withName('Categoria 3').withDescription('Bebidas diversas').withStoreId('1').build(),
      ];
      repository.items = categories;

      const filter: CategoryFilter = { name: 'categoria', store_id:'1' };
      const filteredItems = await repository['applyFilter'](categories, filter);
      expect(filteredItems).toHaveLength(3);
    });

    // Testa o retorno de todas as categorias quando o filtro é null
    it('should return all categories when filter is null', async () => {
      const categories = [
        Category.fake().aCategory().build(),
        Category.fake().aCategory().build(),
      ];
      repository.items = categories;

      const filteredItems = await repository['applyFilter'](categories, null);
      expect(filteredItems).toHaveLength(2);
    });

    // Testa o retorno de array vazio quando nenhuma categoria corresponde ao filtro
    it('should return empty array when no categories match filter', async () => {
      const categories = [
        Category.fake().aCategory().withName('Alimentos').withStoreId('1').build(),
        Category.fake().aCategory().withName('Bebidas').withStoreId('1').build(),
      ];
      repository.items = categories;

      const filter: CategoryFilter = { name: 'inexistente', store_id:'1' };
      const filteredItems = await repository['applyFilter'](categories, filter);
      expect(filteredItems).toHaveLength(0);
    });

    // Testa o retorno de todas as categorias quando o objeto de filtro está vazio
    it('should return all categories when filter object is empty', async () => {
      const categories = [
        Category.fake().aCategory().withName('Alimentos').withStoreId('1').build(),
        Category.fake().aCategory().withName('Bebidas').withStoreId('1').build(),
      ];
      repository.items = categories;

      // @ts-ignore
      const filter: CategoryFilter = {};
      const filteredItems = await repository['applyFilter'](categories, filter);
      expect(filteredItems).toHaveLength(2);
    });

    // Testa o retorno de todas as categorias quando o filtro é null (duplicado, mas mantido para consistência)
    it('should return all categories when filter is null', async () => {
      const categories = [
        Category.fake().aCategory().build(),
        Category.fake().aCategory().build(),
      ];
      repository.items = categories;

      const filteredItems = await repository['applyFilter'](categories, null);
      expect(filteredItems).toHaveLength(2);
    });
  });

  describe('applySort method', () => {
    // Testa a ordenação por nome em ordem ascendente
    it('should sort by name ascending', () => {
      const categories = [
        Category.fake().aCategory().withName('Zebra').build(),
        Category.fake().aCategory().withName('Alpha').build(),
        Category.fake().aCategory().withName('Beta').build(),
      ];
      repository.items = categories;

      const sortedItems = repository['applySort'](categories, 'name', 'asc');
      expect(sortedItems[0].name).toBe('Alpha');
      expect(sortedItems[1].name).toBe('Beta');
      expect(sortedItems[2].name).toBe('Zebra');
    });

    it('should sort by name descending', () => {
      const categories = [
        Category.fake().aCategory().withName('Alpha').build(),
        Category.fake().aCategory().withName('Zebra').build(),
        Category.fake().aCategory().withName('Beta').build(),
      ];
      repository.items = categories;

      const sortedItems = repository['applySort'](categories, 'name', 'desc');
      expect(sortedItems[0].name).toBe('Zebra');
      expect(sortedItems[1].name).toBe('Beta');
      expect(sortedItems[2].name).toBe('Alpha');
    });

    it('should sort by display_order ascending', () => {
      const categories = [
        Category.fake().aCategory().withName('C').build(),
        Category.fake().aCategory().withName('A').build(),
        Category.fake().aCategory().withName('B').build(),
      ];
      categories[0].updateDisplayOrder(3);
      categories[1].updateDisplayOrder(1);
      categories[2].updateDisplayOrder(2);
      repository.items = categories;

      const sortedItems = repository['applySort'](categories, 'display_order', 'asc');
      expect(sortedItems[0].display_order).toBe(1);
      expect(sortedItems[1].display_order).toBe(2);
      expect(sortedItems[2].display_order).toBe(3);
    });

    it('should sort by created_at descending by default', () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const categories = [
        Category.fake().aCategory().withCreatedAt(yesterday).withName('A').build(),
        Category.fake().aCategory().withCreatedAt(tomorrow).withName('B').build(),
        Category.fake().aCategory().withCreatedAt(now).withName('C').build(),
      ];
      repository.items = categories;

      const sortedItems = repository['applySort'](categories, 'created_at', 'desc');
      expect(sortedItems[0].created_at).toEqual(tomorrow);
      expect(sortedItems[1].created_at).toEqual(now);
      expect(sortedItems[2].created_at).toEqual(yesterday);
    });

    it('should sort by is_active with secondary sort by name', () => {
      const categories = [
        Category.fake().aCategory().withName('Zebra').build(),
        Category.fake().aCategory().withName('Alpha').build(),
        Category.fake().aCategory().withName('Beta').build(),
      ];
      categories[0].deactivate(); // Zebra inactive
      categories[1].activate(); // Alpha active
      categories[2].activate(); // Beta active
      repository.items = categories;

      const sortedItems = repository['applySort'](categories, 'is_active', 'desc');
      // Active first (1), then inactive (0), with secondary sort by name
      expect(sortedItems[0].name).toBe('Alpha'); // active, alphabetically first
      expect(sortedItems[1].name).toBe('Beta'); // active, alphabetically second
      expect(sortedItems[2].name).toBe('Zebra'); // inactive
    });

    it('should return original order when sort field is invalid', () => {
      const categories = [
        Category.fake().aCategory().withName('C').build(),
        Category.fake().aCategory().withName('A').build(),
        Category.fake().aCategory().withName('B').build(),
      ];
      repository.items = categories;

      const sortedItems = repository['applySort'](categories, 'invalid_field', 'asc');
      expect(sortedItems).toEqual(categories);
    });
  });

  describe('Domain-specific methods', () => {
    let storeId: string;
    beforeEach(() => {
      storeId = 'test-store-id';
      const categories = [
        Category.fake().aCategory().withName('Ativa 1').activate().withRequiresExpiryDate(true).forStore(storeId).build(),
        Category.fake().aCategory().withName('Inativa 1').deactivate().withRequiresExpiryDate(false).forStore(storeId).build(),
        Category.fake().aCategory().withName('Ativa 2').activate().withRequiresExpiryDate(false).forStore(storeId).build(),
        // Categoria de outro store para testar isolamento
        Category.fake().aCategory().withName('Outra Store').forStore('other-store').build(),
      ];
      // Set parent categories
      const parentId = new CategoryId();
      categories[1].setParentCategory(parentId);
      
      repository.items = categories;
    });

    // Testa a busca de categorias ativas para um store específico
    it('should find active categories', async () => {
      const activeCategories = await repository.findActiveCategories(storeId);
      expect(activeCategories).toHaveLength(2);
      expect(activeCategories.every(cat => cat.is_active && cat.store_id === storeId)).toBe(true);
    });

    // Testa a busca de categorias raiz para um store específico
    it('should find root categories', async () => {
      const rootCategories = await repository.findRootCategories(storeId);
      expect(rootCategories).toHaveLength(2);
      expect(rootCategories.every(cat => cat.parent_category_id === null && cat.store_id === storeId)).toBe(true);
    });

    // Testa a busca de categorias por ID do pai para um store específico
    it('should find categories by parent id', async () => {
      const parentId = repository.items[1].parent_category_id!;
      const childCategories = await repository.findByParentId(storeId, parentId);
      expect(childCategories).toHaveLength(1);
      expect(childCategories[0].parent_category_id?.equals(parentId) && childCategories[0].store_id === storeId).toBe(true);
    });

    // Testa a busca de categorias perecíveis para um store específico
    it('should find perishable categories', async () => {
      const perishableCategories = await repository.findPerishableCategories(storeId);
      expect(perishableCategories).toHaveLength(1);
      expect(perishableCategories[0].requires_expiry_date && perishableCategories[0].store_id === storeId).toBe(true);
      expect(perishableCategories[0].name).toBe('Ativa 1');
    });

    // Testa a busca de categorias elegíveis para promoção para um store específico
    it('should find promotion eligible categories', async () => {
      const eligibleCategories = await repository.findPromotionEligibleCategories(storeId);
      expect(eligibleCategories.length).toBeGreaterThan(0);
      expect(eligibleCategories.every(cat => cat.isPromotionEligible() && cat.store_id === storeId)).toBe(true);
    });

    // Testa a busca de categorias por store_id (isolamento multi-tenant)
    it('should find categories by store id', async () => {
      const storeCategories = await repository.findByStoreId(storeId);
      expect(storeCategories).toHaveLength(3);
      expect(storeCategories.every(cat => cat.store_id === storeId)).toBe(true);
    });

    // Testa a contagem de categorias por store_id (isolamento multi-tenant)
    it('should count categories by store id', async () => {
      const count = await repository.countByStoreId(storeId);
      expect(count).toBe(3);
    });

    // Testa o isolamento: não deve retornar categorias de outro store
    it('should not return categories from other stores', async () => {
      const otherStoreCategories = await repository.findByStoreId('other-store');
      expect(otherStoreCategories).toHaveLength(1);
      const testStoreCategories = await repository.findByStoreId(storeId);
      expect(testStoreCategories).toHaveLength(3);
    });
  });
});