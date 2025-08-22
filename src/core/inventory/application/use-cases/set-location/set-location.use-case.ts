import { IUseCase } from '../../../../shared/application/use-case.interface';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { Inventory, InventoryId } from '../../../domain/inventory.aggregate';
import { IInventoryRepository } from '../../../domain/repositories/inventory.repository.interface';
import { SetLocationInput } from './set-location.input';
import { InventoryOutput, InventoryOutputMapper } from '../common/inventory-output';

export type SetLocationOutput = InventoryOutput;

export class SetLocationUseCase
  implements IUseCase<SetLocationInput, SetLocationOutput>
{
  constructor(private readonly inventoryRepo: IInventoryRepository) {}

  async execute(input: SetLocationInput): Promise<SetLocationOutput> {
    // Validar entrada
    const inventoryId = new InventoryId(input.inventory_item_id);
    
    // Buscar item de inventário
    const inventory = await this.inventoryRepo.findById(inventoryId);
    if (!inventory) {
      throw new NotFoundError(input.inventory_item_id, Inventory);
    }

    // Validações de negócio usando Notification
    this.validateBusinessRules(inventory, input.location_code);
    
    if (inventory.notification.hasErrors()) {
      throw new EntityValidationError(inventory.notification.toJSON());
    }

    // Definir nova localização - InvalidLocationError será lançado se formato inválido
    inventory.setLocationCode(input.location_code);

    // Persistir mudanças
    await this.inventoryRepo.update(inventory);

    // Retornar output
    const output = InventoryOutputMapper.toOutput(inventory);
    if (inventory.location) {
      output.location = inventory.location.getAisleSectionCode();
    }
    return output;
  }

  private validateBusinessRules(inventory: Inventory, locationCode: string): void {
    // Regra: Verificar se o item está ativo
    if (!inventory.is_active) {
      inventory.notification.addError(
        'Cannot change location of inactive inventory item',
        'is_active'
      );
    }

    // Regra: Log de mudança de localização para auditoria
    if (inventory.location_code !== locationCode) {
      console.log(`Location changed for item ${inventory.inventory_item_id.id}: ${inventory.location_code} -> ${locationCode}`);
    }
  }
}