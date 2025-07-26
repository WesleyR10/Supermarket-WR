import { CategoryInMemoryRepository } from './category-in-memory.repository';
import { Category, CategoryId } from '../../../domain/category.aggregate';
import { CategoryFilter } from '../../../domain/repositories/category.repository.interface';

describe('CategoryInMemoryRepository', () => {
  let repository: CategoryInMemoryRepository;

  beforeEach(() => {
    repository = new CategoryInMemoryRepository();
  });

  describe('applyFilter method', () => {
    it('should filter categories by name (case insensitive)', async () => {
      const categories = [
        Category.fake().aCategory().withName('Alimentos').build(),
        Category.fake().aCategory().withName('Bebidas').build(),
        Category.fake().aCategory().withName('Limpeza').build(),
      ];
      repository.items = categories;

      const filter: CategoryFilter = { name: 'alimentos' };
      const filteredItems = await repository['applyFilter'](categories, filter);
      expect(filteredItems).toHaveLength(1);
      expect(filteredItems[0].name).toBe('Alimentos');
    });

    it('should filter categories by partial name match (case insensitive)', async () => {
      const categories = [
        Category.fake().aCategory().withName('Categoria 1').withDescription('Produtos alimentícios').build(),
        Category.fake().aCategory().withName('Categoria 2').withDescription('Produtos de limpeza').build(),
        Category.fake().aCategory().withName('Categoria 3').withDescription('Bebidas diversas').build(),
      ];
      repository.items = categories;

      const filter: CategoryFilter = { name: 'categoria' };
      const filteredItems = await repository['applyFilter'](categories, filter);
      expect(filteredItems).toHaveLength(3);
    });

    it('should return all categories when filter is null', async () => {
      const categories = [
        Category.fake().aCategory().build(),
        Category.fake().aCategory().build(),
      ];
      repository.items = categories;

      const filteredItems = await repository['applyFilter'](categories, null);
      expect(filteredItems).toHaveLength(2);
    });

    it('should return empty array when no categories match filter', async () => {
      const categories = [
        Category.fake().aCategory().withName('Alimentos').build(),
        Category.fake().aCategory().withName('Bebidas').build(),
      ];
      repository.items = categories;

      const filter: CategoryFilter = { name: 'inexistente' };
      const filteredItems = await repository['applyFilter'](categories, filter);
      expect(filteredItems).toHaveLength(0);
    });

    it('should return all categories when filter object is empty', async () => {
      const categories = [
        Category.fake().aCategory().withName('Alimentos').build(),
        Category.fake().aCategory().withName('Bebidas').build(),
      ];
      repository.items = categories;

      const filter: CategoryFilter = {};
      const filteredItems = await repository['applyFilter'](categories, filter);
      expect(filteredItems).toHaveLength(2);
    });

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
    beforeEach(() => {
      const categories = [
        Category.fake().aCategory().withName('Ativa 1').activate().withRequiresExpiryDate(true).build(),
        Category.fake().aCategory().withName('Inativa 1').deactivate().withRequiresExpiryDate(false).build(),
        Category.fake().aCategory().withName('Ativa 2').activate().withRequiresExpiryDate(false).build(),
      ];
      // Set parent categories
      const parentId = new CategoryId();
      categories[1].setParentCategory(parentId);
      
      repository.items = categories;
    });

    it('should find active categories', async () => {
      const activeCategories = await repository.findActiveCategories();
      expect(activeCategories).toHaveLength(2);
      expect(activeCategories.every(cat => cat.is_active)).toBe(true);
    });

    it('should find root categories', async () => {
      const rootCategories = await repository.findRootCategories();
      expect(rootCategories).toHaveLength(2);
      expect(rootCategories.every(cat => cat.parent_category_id === null)).toBe(true);
    });

    it('should find categories by parent id', async () => {
      const parentId = repository.items[1].parent_category_id!;
      const childCategories = await repository.findByParentId(parentId);
      expect(childCategories).toHaveLength(1);
      expect(childCategories[0].parent_category_id?.equals(parentId)).toBe(true);
    });

    it('should find perishable categories', async () => {
      const perishableCategories = await repository.findPerishableCategories();
      expect(perishableCategories).toHaveLength(1);
      expect(perishableCategories[0].requires_expiry_date).toBe(true);
      expect(perishableCategories[0].name).toBe('Ativa 1');
    });

    it('should find promotion eligible categories', async () => {
      const eligibleCategories = await repository.findPromotionEligibleCategories();
      // All test categories should be promotion eligible (no pharmacy/medicine keywords)
      expect(eligibleCategories.length).toBeGreaterThan(0);
      expect(eligibleCategories.every(cat => cat.isPromotionEligible())).toBe(true);
    });
  });
});