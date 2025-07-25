import { IUseCase } from '../../../../shared/application/use-case.interface';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { Inventory, InventoryId } from '../../../domain/inventory.aggregate';
import { IInventoryRepository } from '../../../domain/repositories/inventory.repository.interface';
import { UpdateUnitPriceInput } from './update-unit-price.input';
import { InventoryOutput, InventoryOutputMapper } from '../common/inventory-output';

export type UpdateUnitPriceOutput = InventoryOutput;

export class UpdateUnitPriceUseCase
  implements IUseCase<UpdateUnitPriceInput, UpdateUnitPriceOutput>
{
  constructor(private readonly inventoryRepo: IInventoryRepository) {}

  async execute(input: UpdateUnitPriceInput): Promise<UpdateUnitPriceOutput> {
    // Validar entrada
    const inventoryId = new InventoryId(input.inventory_item_id);
    
    // Buscar item de inventário
    const inventory = await this.inventoryRepo.findById(inventoryId);
    if (!inventory) {
      throw new NotFoundError(input.inventory_item_id, Inventory);
    }

    // Validações de negócio usando Notification
    this.validateBusinessRules(inventory, input.unit_price);
    
    if (inventory.notification.hasErrors()) {
      throw new EntityValidationError(inventory.notification.toJSON());
    }

    // Atualizar preço de venda
    inventory.updateUnitPrice(input.unit_price);

    // Persistir mudanças
    await this.inventoryRepo.update(inventory);

    // Retornar output
    return InventoryOutputMapper.toOutput(inventory);
  }

  private validateBusinessRules(inventory: Inventory, unitPrice: number): void {
    // Regra: Verificar se o item está ativo
    if (!inventory.is_active) {
      inventory.notification.addError(
        'Cannot update unit price of inactive inventory item',
        'is_active'
      );
    }

    // Regra: Verificar se o novo preço não é menor que o custo (margem negativa)
    if (unitPrice < inventory.unit_cost) {
      inventory.notification.addError(
        `Unit price (${unitPrice}) cannot be lower than unit cost (${inventory.unit_cost})`,
        'unit_price'
      );
    }

    // Regra: Verificar se a variação de preço não é muito grande (> 100%)
    const currentPrice = inventory.unit_price;
    const variation = Math.abs((unitPrice - currentPrice) / currentPrice) * 100;
    if (variation > 100) {
      console.log(`Large price variation detected: ${variation.toFixed(2)}% for item ${inventory.inventory_item_id.id}`);
    }

    // Regra: Verificar margem de lucro mínima (pelo menos 5%)
    const profitMargin = ((unitPrice - inventory.unit_cost) / unitPrice) * 100;
    if (profitMargin < 5) {
      inventory.notification.addError(
        `Profit margin (${profitMargin.toFixed(2)}%) is below minimum required (5%)`,
        'unit_price'
      );
    }
  }
}