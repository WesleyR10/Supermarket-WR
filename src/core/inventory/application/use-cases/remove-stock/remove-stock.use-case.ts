import { IUseCase } from '../../../../shared/application/use-case.interface';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { Inventory, InventoryId } from '../../../domain/inventory.aggregate';
import { IInventoryRepository } from '../../../domain/repositories/inventory.repository.interface';
import { RemoveStockInput } from './remove-stock.input';
import { InventoryOutput, InventoryOutputMapper } from '../common/inventory-output';

export type RemoveStockOutput = InventoryOutput;

export class RemoveStockUseCase
  implements IUseCase<RemoveStockInput, RemoveStockOutput>
{
  constructor(private readonly inventoryRepo: IInventoryRepository) {}

  async execute(input: RemoveStockInput): Promise<RemoveStockOutput> {
    // Validar entrada
    const inventoryId = new InventoryId(input.inventory_item_id);
    
    // Buscar item de inventário
    const inventory = await this.inventoryRepo.findById(inventoryId);
    if (!inventory) {
      throw new NotFoundError(input.inventory_item_id, Inventory);
    }

    // Validações de negócio usando Notification
    this.validateBusinessRules(inventory, input.quantity);
    
    if (inventory.notification.hasErrors()) {
      throw new EntityValidationError(inventory.notification.toJSON());
    }

    // Remover estoque
    inventory.removeStock(input.quantity);

    // Persistir mudanças
    await this.inventoryRepo.update(inventory);

    // Retornar output
    return InventoryOutputMapper.toOutput(inventory);
  }

  private validateBusinessRules(inventory: Inventory, quantity: number): void {
    // Regra: Verificar se o item está ativo
    if (!inventory.is_active) {
      inventory.notification.addError(
        'Cannot remove stock from inactive inventory item',
        'is_active'
      );
    }

    // Regra: Verificar se há quantidade suficiente
    if (quantity > inventory.quantity.value) {
      inventory.notification.addError(
        `Cannot remove ${quantity} units. Only ${inventory.quantity.value} units available`,
        'quantity'
      );
    }

    // Regra: Log para grandes remoções de estoque (auditoria)
    if (quantity > 500) {
      console.log(`Large stock removal detected: ${quantity} units for item ${inventory.inventory_item_id.id}`);
    }
  }
}