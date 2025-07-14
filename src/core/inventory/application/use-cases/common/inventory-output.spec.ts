import { Inventory } from '../../../domain/inventory.aggregate';
import { InventoryOutputMapper } from './inventory-output';

describe('InventoryOutputMapper Unit Tests', () => {
  it('should convert an inventory item in output', () => {
    const entity = Inventory.create({
      product_id: 'product-123',
      store_id: 'store-456',
      quantity: 50,
      min_stock: 10,
      max_stock: 100,
      cost_price: 2.50,
      supplier_id: 'supplier-789',
      location: 'A1-B2-C3',
      expiry_date: new Date('2024-12-31'),
      batch_number: 'BATCH-001',
    });
    
    const spyToJSON = jest.spyOn(entity, 'toJSON');
    const output = InventoryOutputMapper.toOutput(entity);
    
    expect(spyToJSON).toHaveBeenCalled();
    expect(output).toStrictEqual({
      id: entity.inventory_item_id.id,
      store_id: 'store-456',
      product_id: 'product-123',
      quantity: 50,
      min_stock: 10,
      max_stock: 100,
      location: 'A1-B2-C3',
      expiry_date: new Date('2024-12-31'),
      batch_number: 'BATCH-001',
      supplier_id: 'supplier-789',
      cost_price: 2.50,
      last_movement_date: entity.last_movement_date,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
    });
  });

  it('should convert an inventory item without optional fields in output', () => {
    const entity = Inventory.create({
      product_id: 'product-456',
      store_id: 'store-789',
      quantity: 25,
      min_stock: 5,
      max_stock: 50,
    });
    
    const spyToJSON = jest.spyOn(entity, 'toJSON');
    const output = InventoryOutputMapper.toOutput(entity);
    
    expect(spyToJSON).toHaveBeenCalled();
    expect(output).toStrictEqual({
      id: entity.inventory_item_id.id,
      store_id: 'store-789',
      product_id: 'product-456',
      quantity: 25,
      min_stock: 5,
      max_stock: 50,
      location: null,
      expiry_date: null,
      batch_number: null,
      supplier_id: null,
      cost_price: null,
      last_movement_date: entity.last_movement_date,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
    });
  });

  it('should convert a perishable inventory item in output', () => {
    const entity = Inventory.create({
      product_id: 'perishable-123',
      store_id: 'store-001',
      quantity: 15,
      min_stock: 3,
      max_stock: 30,
      cost_price: 5.00,
      supplier_id: 'dairy-supplier-456',
      location: 'REFRIGERATOR-A1',
      expiry_date: new Date('2024-02-15'),
      batch_number: 'DAIRY-BATCH-456',
    });
    
    const spyToJSON = jest.spyOn(entity, 'toJSON');
    const output = InventoryOutputMapper.toOutput(entity);
    
    expect(spyToJSON).toHaveBeenCalled();
    expect(output).toStrictEqual({
      id: entity.inventory_item_id.id,
      store_id: 'store-001',
      product_id: 'perishable-123',
      quantity: 15,
      min_stock: 3,
      max_stock: 30,
      location: 'REFRIGERATOR-A1',
      expiry_date: new Date('2024-02-15'),
      batch_number: 'DAIRY-BATCH-456',
      supplier_id: 'dairy-supplier-456',
      cost_price: 5.00,
      last_movement_date: entity.last_movement_date,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
    });
  });
}); 