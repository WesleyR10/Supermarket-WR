import { Category } from '../../../domain/category.aggregate';
import { CategoryOutputMapper } from './category-output';

describe('CategoryOutputMapper Unit Tests', () => {
  it('should convert a category in output', () => {
    const entity = Category.create({
      name: 'Bebidas',
      store_id: '123',
      description: 'Categoria de bebidas e refrigerantes',
      is_active: true,
      tax_rate: 18.5,
      default_margin_percentage: 35.0,
      requires_expiry_date: true,
      display_order: 1,
      icon_name: 'beverage-icon',
    });
    
    const spyToJSON = jest.spyOn(entity, 'toJSON');
    const output = CategoryOutputMapper.toOutput(entity);
    
    expect(spyToJSON).toHaveBeenCalled();
    expect(output).toStrictEqual({
      id: entity.category_id.id,
      store_id: '123',
      name: 'Bebidas',
      description: 'Categoria de bebidas e refrigerantes',
      is_active: true,
      parent_category_id: null,
      tax_rate: 18.5,
      default_margin_percentage: 35.0,
      requires_expiry_date: true,
      display_order: 1,
      icon_name: 'beverage-icon',
      created_at: entity.created_at,
      updated_at: entity.updated_at,
    });
  });

  it('should convert a subcategory in output', () => {
    const parentCategory = Category.create({
      name: 'Bebidas',
      store_id: '123',
      description: 'Categoria principal de bebidas',
      is_active: true,
    });

    const entity = Category.create({
      name: 'Refrigerantes',
      store_id: '123',
      description: 'Subcategoria de refrigerantes',
      is_active: true,
      parent_category_id: parentCategory.category_id.id,
      tax_rate: 18.5,
      default_margin_percentage: 30.0,
      requires_expiry_date: true,
      display_order: 2,
      icon_name: 'soda-icon',
    });
    
    const spyToJSON = jest.spyOn(entity, 'toJSON');
    const output = CategoryOutputMapper.toOutput(entity);
    
    expect(spyToJSON).toHaveBeenCalled();
    expect(output).toStrictEqual({
      id: entity.category_id.id,
      store_id: '123',
      name: 'Refrigerantes',
      description: 'Subcategoria de refrigerantes',
      is_active: true,
      parent_category_id: parentCategory.category_id.id,
      tax_rate: 18.5,
      default_margin_percentage: 30.0,
      requires_expiry_date: true,
      display_order: 2,
      icon_name: 'soda-icon',
      created_at: entity.created_at,
      updated_at: entity.updated_at,
    });
  });
}); 