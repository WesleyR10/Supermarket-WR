import { IUseCase } from '../../../../shared/application/use-case.interface';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';
import { FieldsErrors } from '../../../../shared/domain/validators/validator-fields-interface';
import { Inventory } from '../../../domain/inventory.aggregate';
import { IInventoryRepository } from '../../../domain/repositories/inventory.repository.interface';
import { CreateInventoryInput } from './create-inventory.input';
import { CreateInventoryOutput } from './create-inventory.output';

export class CreateInventoryUseCase
  implements IUseCase<CreateInventoryInput, CreateInventoryOutput>
{
  constructor(private readonly inventoryRepo: IInventoryRepository) {}

  async execute(input: CreateInventoryInput): Promise<CreateInventoryOutput> {
    // Validações de sintaxe e formato (Use Case responsibility)
    this.validateInput(input);

    // Criação da entidade (Domain responsibility)
    const entity = Inventory.create(input);

    // Validações de domínio específicas do supermercado
    this.validateBusinessRules(entity);

    if (entity.notification.hasErrors()) {
      const errors = this.convertNotificationToFieldsErrors(entity.notification.toJSON());
      throw new EntityValidationError([errors]);
    }

    // Persistência
    await this.inventoryRepo.insert(entity);

    return this.toOutput(entity);
  }

  private convertNotificationToFieldsErrors(
    notificationErrors: Array<string | { [key: string]: string[] }>
  ): FieldsErrors {
    const fieldsErrors: FieldsErrors = {};

    notificationErrors.forEach((error) => {
      if (typeof error === 'string') {
        if (!fieldsErrors['_general']) {
          fieldsErrors['_general'] = [];
        }
        fieldsErrors['_general'].push(error);
      } else {
        Object.entries(error).forEach(([field, messages]) => {
          if (!fieldsErrors[field]) {
            fieldsErrors[field] = [];
          }
          fieldsErrors[field].push(...messages);
        });
      }
    });

    return fieldsErrors;
  }

  private validateInput(input: CreateInventoryInput): void {
    const errors: string[] = [];

    // Validações de sintaxe (formato, tipos, etc.)
    if (!input.product_id || typeof input.product_id !== 'string') {
      errors.push('Product ID is required and must be a string');
    }

    if (!input.store_id || typeof input.store_id !== 'string') {
      errors.push('Store ID is required and must be a string');
    }

    if (typeof input.quantity !== 'number' || input.quantity < 0) {
      errors.push('Quantity must be a non-negative number');
    }

    if (typeof input.minimum_quantity !== 'number' || input.minimum_quantity < 0) {
      errors.push('Minimum quantity must be a non-negative number');
    }

    if (typeof input.maximum_quantity !== 'number' || input.maximum_quantity <= 0) {
      errors.push('Maximum quantity must be a positive number');
    }

    if (input.minimum_quantity >= input.maximum_quantity) {
      errors.push('Minimum quantity must be less than maximum quantity');
    }

    if (typeof input.unit_cost !== 'number' || input.unit_cost < 0) {
      errors.push('Unit cost must be a non-negative number');
    }

    if (typeof input.unit_price !== 'number' || input.unit_price <= 0) {
      errors.push('Unit price must be a positive number');
    }

    if (input.unit_price <= input.unit_cost) {
      errors.push('Unit price must be greater than unit cost');
    }

    if (input.supplier_id !== undefined && input.supplier_id !== null && typeof input.supplier_id !== 'string') {
      errors.push('Supplier ID must be a string or null');
    }

    if (input.location_code !== undefined && input.location_code !== null && typeof input.location_code !== 'string') {
      errors.push('Location code must be a string or null');
    }

    if (input.location_code && input.location_code.length > 20) {
      errors.push('Location code cannot exceed 20 characters');
    }

    if (input.expiry_date !== undefined && input.expiry_date !== null && !(input.expiry_date instanceof Date)) {
      errors.push('Expiry date must be a valid date or null');
    }

    if (input.expiry_date && input.expiry_date <= new Date()) {
      errors.push('Expiry date must be in the future');
    }

    if (input.batch_number !== undefined && input.batch_number !== null && typeof input.batch_number !== 'string') {
      errors.push('Batch number must be a string or null');
    }

    if (input.batch_number && input.batch_number.length > 50) {
      errors.push('Batch number cannot exceed 50 characters');
    }

    if (input.is_active !== undefined && typeof input.is_active !== 'boolean') {
      errors.push('is_active must be a boolean');
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
  }

  private validateBusinessRules(entity: Inventory): void {
    // Regras de negócio específicas do supermercado

    // Regra: Produtos perecíveis devem ter data de validade
    if (entity.isPerishableProduct() && !entity.expiry_date) {
      entity.notification.addError(
        'Perishable products must have an expiry date',
        'expiry_date'
      );
    }

    // Regra: Produtos com lote devem ter número de lote
    if (entity.requiresBatchNumber() && !entity.batch_number) {
      entity.notification.addError(
        'Products with expiry date must have a batch number',
        'batch_number'
      );
    }

    // Regra: Margem de lucro muito baixa deve gerar aviso
    const margin = ((entity.unit_price - entity.unit_cost) / entity.unit_cost) * 100;
    if (margin < 10) {
      entity.notification.addError(
        'Profit margin is very low (less than 10%)',
        'unit_price'
      );
    }

    // Regra: Quantidade atual não pode exceder quantidade máxima
    if (entity.quantity > entity.maximum_quantity) {
      entity.notification.addError(
        'Current quantity cannot exceed maximum quantity',
        'quantity'
      );
    }

    // Regra: Produtos com estoque baixo devem ter localização definida
    if (entity.isLowStock() && !entity.location_code) {
      entity.notification.addError(
        'Low stock products should have a defined location',
        'location_code'
      );
    }

    // Regra: Produtos de alto valor devem ter fornecedor definido
    if (entity.isHighValueProduct() && !entity.supplier_id) {
      entity.notification.addError(
        'High value products should have a defined supplier',
        'supplier_id'
      );
    }
  }

  private toOutput(entity: Inventory): CreateInventoryOutput {
    return {
      id: entity.inventory_id.id,
      product_id: entity.product_id,
      store_id: entity.store_id,
      quantity: entity.quantity,
      minimum_quantity: entity.minimum_quantity,
      maximum_quantity: entity.maximum_quantity,
      unit_cost: entity.unit_cost,
      unit_price: entity.unit_price,
      supplier_id: entity.supplier_id,
      location_code: entity.location_code,
      expiry_date: entity.expiry_date,
      batch_number: entity.batch_number,
      is_active: entity.is_active,
      created_at: entity.created_at,
    };
  }
} 