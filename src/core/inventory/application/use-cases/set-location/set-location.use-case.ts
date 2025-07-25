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

    // Definir nova localização
    inventory.setLocationCode(input.location_code);

    // Persistir mudanças
    await this.inventoryRepo.update(inventory);

    // Retornar output
    return InventoryOutputMapper.toOutput(inventory);
  }

  private validateBusinessRules(inventory: Inventory, locationCode: string): void {
    // Regra: Verificar se o item está ativo
    if (!inventory.is_active) {
      inventory.notification.addError(
        'Cannot change location of inactive inventory item',
        'is_active'
      );
    }

    // Regra: Verificar formato do código de localização (padrão: A1-B2)
    const locationPattern = /^[A-Z]\d+-[A-Z]\d+$/;
    if (!locationPattern.test(locationCode)) {
      inventory.notification.addError(
        `Invalid location code format. Expected format: A1-B2, received: ${locationCode}`,
        'location_code'
      );
    }

    // Regra: Log de mudança de localização para auditoria
    if (inventory.location_code !== locationCode) {
      console.log(`Location changed for item ${inventory.inventory_item_id.id}: ${inventory.location_code} -> ${locationCode}`);
    }
  }
}