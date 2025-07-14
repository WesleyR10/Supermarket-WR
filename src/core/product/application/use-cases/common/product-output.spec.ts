import { Product, UnitType } from '../../../domain/product.aggregate';
import { ProductOutputMapper } from './product-output';

describe('ProductOutputMapper Unit Tests', () => {
  it('should convert a basic product to output', () => {
    const entity = Product.create({
      category_id: 'category-123',
      name: 'Arroz Branco 5kg',
      description: 'Arroz branco longo fino',
      barcode: '1234567890123',
      price: 12.99,
      cost_price: 8.50,
      is_active: true,
      brand: 'Tio João',
      unit_type: UnitType.PACK,
      weight: 5000,
      supplier_code: 'SUP001',
      ncm_code: '10063021',
      requires_weighing: false,
    });
    
    const spyToJSON = jest.spyOn(entity, 'toJSON');
    const output = ProductOutputMapper.toOutput(entity);
    
    expect(spyToJSON).toHaveBeenCalled();
    expect(output).toStrictEqual({
      id: entity.product_id.id,
      category_id: 'category-123',
      name: 'Arroz Branco 5kg',
      description: 'Arroz branco longo fino',
      barcode: '1234567890123',
      price: 12.99,
      cost_price: 8.50,
      is_active: true,
      brand: 'Tio João',
      unit_type: UnitType.PACK,
      weight: 5000,
      volume: null,
      dimensions: null,
      supplier_code: 'SUP001',
      ncm_code: '10063021',
      requires_weighing: false,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
    });
  });

  it('should convert a beverage product to output', () => {
    const entity = Product.fake()
      .withBeverage()
      .withName('Coca-Cola 2L')
      .withBrand('Coca-Cola')
      .withUnitType(UnitType.LITER)
      .withVolume(2000)
      .withPrice(5.99)
      .withCostPrice(3.50)
      .withNcmCode('22021000')
      .build() as Product;
    
    const output = ProductOutputMapper.toOutput(entity);
    
    expect(output).toStrictEqual({
      id: entity.product_id.id,
      category_id: entity.category_id,
      name: 'Coca-Cola 2L',
      description: entity.description,
      barcode: entity.barcode,
      price: 5.99,
      cost_price: 3.50,
      is_active: entity.is_active,
      brand: 'Coca-Cola',
      unit_type: UnitType.LITER,
      weight: entity.weight,
      volume: 2000,
      dimensions: entity.dimensions,
      supplier_code: entity.supplier_code,
      ncm_code: '22021000',
      requires_weighing: entity.requires_weighing,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
    });
  });

  it('should convert a meat product to output', () => {
    const entity = Product.fake()
      .withMeatProduct()
      .withName('Carne Bovina Alcatra')
      .withBrand('Friboi')
      .withUnitType(UnitType.KG)
      .withWeight(1000)
      .withPrice(32.99)
      .withCostPrice(22.50)
      .withRequiresWeighing(true)
      .withNcmCode('02071400')
      .build() as Product;
    
    const output = ProductOutputMapper.toOutput(entity);
    
    expect(output).toStrictEqual({
      id: entity.product_id.id,
      category_id: entity.category_id,
      name: 'Carne Bovina Alcatra',
      description: entity.description,
      barcode: entity.barcode,
      price: 32.99,
      cost_price: 22.50,
      is_active: entity.is_active,
      brand: 'Friboi',
      unit_type: UnitType.KG,
      weight: 1000,
      volume: entity.volume,
      dimensions: entity.dimensions,
      supplier_code: entity.supplier_code,
      ncm_code: '02071400',
      requires_weighing: true,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
    });
  });

  it('should convert a cleaning product to output', () => {
    const entity = Product.fake()
      .withCleaningProduct()
      .withName('Detergente Ypê 500ml')
      .withBrand('Ypê')
      .withUnitType(UnitType.UNIT)
      .withVolume(500)
      .withPrice(2.99)
      .withCostPrice(1.80)
      .withNcmCode('34022000')
      .build() as Product;
    
    const output = ProductOutputMapper.toOutput(entity);
    
    expect(output).toStrictEqual({
      id: entity.product_id.id,
      category_id: entity.category_id,
      name: 'Detergente Ypê 500ml',
      description: entity.description,
      barcode: entity.barcode,
      price: 2.99,
      cost_price: 1.80,
      is_active: entity.is_active,
      brand: 'Ypê',
      unit_type: UnitType.UNIT,
      weight: entity.weight,
      volume: 500,
      dimensions: entity.dimensions,
      supplier_code: entity.supplier_code,
      ncm_code: '34022000',
      requires_weighing: entity.requires_weighing,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
    });
  });

  it('should convert a high-value product to output', () => {
    const entity = Product.fake()
      .withHighValueProduct()
      .withName('Micro-ondas Panasonic 32L')
      .withBrand('Panasonic')
      .withUnitType(UnitType.UNIT)
      .withPrice(499.99)
      .withCostPrice(350.00)
      .withDimensions('50x35x40cm')
      .withWeight(15000)
      .withNcmCode('85165000')
      .build() as Product;
    
    const output = ProductOutputMapper.toOutput(entity);
    
    expect(output).toStrictEqual({
      id: entity.product_id.id,
      category_id: entity.category_id,
      name: 'Micro-ondas Panasonic 32L',
      description: entity.description,
      barcode: entity.barcode,
      price: 499.99,
      cost_price: 350.00,
      is_active: entity.is_active,
      brand: 'Panasonic',
      unit_type: UnitType.UNIT,
      weight: 15000,
      volume: entity.volume,
      dimensions: '50x35x40cm',
      supplier_code: entity.supplier_code,
      ncm_code: '85165000',
      requires_weighing: entity.requires_weighing,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
    });
  });

  it('should convert a product with minimal data to output', () => {
    const entity = Product.create({
      category_id: 'category-456',
      name: 'Produto Básico',
      barcode: '9876543210987',
      price: 1.99,
    });
    
    const output = ProductOutputMapper.toOutput(entity);
    
    expect(output).toStrictEqual({
      id: entity.product_id.id,
      category_id: 'category-456',
      name: 'Produto Básico',
      description: null,
      barcode: '9876543210987',
      price: 1.99,
      cost_price: null,
      is_active: true,
      brand: null,
      unit_type: UnitType.UNIT,
      weight: null,
      volume: null,
      dimensions: null,
      supplier_code: null,
      ncm_code: null,
      requires_weighing: false,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
    });
  });
}); 