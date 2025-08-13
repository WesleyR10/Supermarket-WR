import { IUseCase } from '../../../../shared/application/use-case.interface';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';
import { Quantity } from '../../../../shared/domain/value-objects/quantity.vo';
import { Inventory, InventoryId } from '../../../domain/inventory.aggregate';
import { IInventoryRepository } from '../../../domain/repositories/inventory.repository.interface';
import { InventoryOutput, InventoryOutputMapper } from '../common/inventory-output';
import { UpdateInventoryInput } from './update-inventory.input';

export class UpdateInventoryUseCase
  implements IUseCase<UpdateInventoryInput, UpdateInventoryOutput>
{
  constructor(private readonly inventoryRepo: IInventoryRepository) {}

  async execute(input: UpdateInventoryInput): Promise<UpdateInventoryOutput> {
    const inventoryId = new InventoryId(input.id);
    const inventory = await this.inventoryRepo.findById(inventoryId);
    if (!inventory) {
      throw new NotFoundError(input.id, Inventory);
    }

    // Validação de multi-tenancy (store_id obrigatório)
    if (inventory.store_id !== input.store_id) {
      throw new EntityValidationError([
        { store_id: ['Inventory item does not belong to this store'] },
      ]);
    }

    // Atualizações condicionais - sem try/catch para VOs
    if (input.product_id !== undefined) {
      inventory.product_id = input.product_id;
    }

    if (input.quantity !== undefined) {
      const currentQuantity = inventory.quantity.value;
      const difference = input.quantity - currentQuantity;
      if (difference > 0) {
        inventory.addStock(difference);
      } else if (difference < 0) {
        inventory.removeStock(Math.abs(difference));
      }
    }

    if (input.minimum_quantity !== undefined) {
      // Criar VO diretamente - InvalidQuantityError vai subir se inválido
      inventory.min_stock = new Quantity(input.minimum_quantity);
    }

    if (input.maximum_quantity !== undefined) {
      // Criar VO diretamente - InvalidQuantityError vai subir se inválido
      inventory.max_stock = new Quantity(input.maximum_quantity);
    }

    if (input.unit_cost !== undefined) {
      inventory.updateCostPrice(input.unit_cost);
    }

    if (input.unit_price !== undefined) {
      inventory.updateUnitPrice(input.unit_price);
    }

    if (input.supplier_id !== undefined) {
      inventory.setSupplier(input.supplier_id);
    }

    if (input.location_code !== undefined) {
      inventory.setLocation(input.location_code);
    }

    if (input.expiry_date !== undefined) {
      inventory.setExpiryDate(input.expiry_date);
    }

    if (input.batch_number !== undefined) {
      inventory.setBatchNumber(input.batch_number);
    }

    if (input.is_active !== undefined) {
      input.is_active ? inventory.activate() : inventory.deactivate();
    }

    // Seguindo padrão base: validar apenas notification, não capturar VOs
    inventory.validate();
    if (inventory.notification.hasErrors()) {
      throw new EntityValidationError(inventory.notification.toJSON());
    }

    await this.inventoryRepo.update(inventory);
    return InventoryOutputMapper.toOutput(inventory);
  }
}

export type UpdateInventoryOutput = InventoryOutput;