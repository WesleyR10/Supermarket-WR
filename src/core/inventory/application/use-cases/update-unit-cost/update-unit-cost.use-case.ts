import { IUseCase } from '../../../../shared/application/use-case.interface';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { Inventory, InventoryId } from '../../../domain/inventory.aggregate';
import { IInventoryRepository } from '../../../domain/repositories/inventory.repository.interface';
import { UpdateUnitCostInput } from './update-unit-cost.input';
import { InventoryOutput, InventoryOutputMapper } from '../common/inventory-output';

export type UpdateUnitCostOutput = InventoryOutput;

export class UpdateUnitCostUseCase
  implements IUseCase<UpdateUnitCostInput, UpdateUnitCostOutput>
{
  constructor(private readonly inventoryRepo: IInventoryRepository) {}

  async execute(input: UpdateUnitCostInput): Promise<UpdateUnitCostOutput> {
    // Validar entrada
    const inventoryId = new InventoryId(input.inventory_item_id);
    
    // Buscar item de inventário
    const inventory = await this.inventoryRepo.findById(inventoryId);
    if (!inventory) {
      throw new NotFoundError(input.inventory_item_id, Inventory);
    }

    // Validações de negócio usando Notification
    this.validateBusinessRules(inventory, input.unit_cost);
    
    if (inventory.notification.hasErrors()) {
      throw new EntityValidationError(inventory.notification.toJSON());
    }

    // Atualizar preço de custo
    inventory.updateUnitCost(input.unit_cost);

    // Persistir mudanças
    await this.inventoryRepo.update(inventory);

    // Retornar output
    return InventoryOutputMapper.toOutput(inventory);
  }

  private validateBusinessRules(inventory: Inventory, unitCost: number): void {
    // Regra: Verificar se o item está ativo
    if (!inventory.is_active) {
      inventory.notification.addError(
        'Cannot update unit cost of inactive inventory item',
        'is_active'
      );
    }

    // Regra: Verificar se o novo custo não é muito diferente do atual (variação > 50%)
    const currentCost = inventory.unit_cost;
    if (currentCost) {
      const variation = Math.abs((unitCost - currentCost) / currentCost) * 100;
      if (variation > 50) {
        console.log(`Large cost variation detected: ${variation.toFixed(2)}% for item ${inventory.inventory_item_id.id}`);
      }
    }

    // Regra: Verificar se o custo não é maior que o preço de venda (margem negativa)
    if (inventory.unit_price && unitCost > inventory.unit_price.value) {
      inventory.notification.addError(
        `Unit cost (${unitCost}) cannot be higher than unit price (${inventory.unit_price.value})`,
        'unit_cost'
      );
    }
  }
}