import { IUseCase } from '../../../../shared/application/use-case.interface';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { Inventory, InventoryId } from '../../../domain/inventory.aggregate';
import { IInventoryRepository } from '../../../domain/repositories/inventory.repository.interface';
import { ActivateInventoryInput } from './activate-inventory.input';
import { InventoryOutput, InventoryOutputMapper } from '../common/inventory-output';

export type ActivateInventoryOutput = InventoryOutput;

export class ActivateInventoryUseCase
  implements IUseCase<ActivateInventoryInput, ActivateInventoryOutput>
{
  constructor(private readonly inventoryRepo: IInventoryRepository) {}

  async execute(input: ActivateInventoryInput): Promise<ActivateInventoryOutput> {
    // Validar entrada
    const inventoryId = new InventoryId(input.inventory_item_id);
    
    // Buscar item de inventário
    const inventory = await this.inventoryRepo.findById(inventoryId);
    if (!inventory) {
      throw new NotFoundError(input.inventory_item_id, Inventory);
    }

    // Validações de negócio usando Notification
    this.validateBusinessRules(inventory);
    
    if (inventory.notification.hasErrors()) {
      throw new EntityValidationError(inventory.notification.toJSON());
    }

    // Ativar item de inventário
    inventory.activate();

    // Persistir mudanças
    await this.inventoryRepo.update(inventory);

    // Retornar output
    return InventoryOutputMapper.toOutput(inventory);
  }

  private validateBusinessRules(inventory: Inventory): void {
    // Regra: Verificar se o item já está ativo
    if (inventory.is_active) {
      inventory.notification.addError(
        'Inventory item is already active',
        'is_active'
      );
    }

    // Regra: Verificar se há informações básicas necessárias
    if (!inventory.location_code || inventory.location_code.trim() === '') {
      inventory.notification.addError(
        'Cannot activate inventory item without location code',
        'location_code'
      );
    }

    // Regra: Verificar se os preços estão definidos
    if (!inventory.unit_cost || inventory.unit_cost <= 0 || !inventory.unit_price || inventory.unit_price.value <= 0) {
      inventory.notification.addError(
        'Cannot activate inventory item without valid unit cost and price',
        'unit_cost'
      );
    }

    // Log de ativação para auditoria
    console.log(`Activating inventory item ${inventory.inventory_item_id.id}`);
  }
}