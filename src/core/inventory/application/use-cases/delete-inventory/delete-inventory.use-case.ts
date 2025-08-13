import { IUseCase } from "../../../../shared/application/use-case.interface";
import { NotFoundError } from "../../../../shared/domain/errors/not-found.error";
import { EntityValidationError } from "../../../../shared/domain/validators/validation.error";
import { InvalidUuidError } from "../../../../shared/domain/value-objects/uuid.vo";
import { Inventory, InventoryId } from "../../../domain/inventory.aggregate";
import { IInventoryRepository } from "../../../domain/repositories/inventory.repository.interface";

export type DeleteInventoryInput = {
  id: string;
  store_id: string;
};

export type DeleteInventoryOutput = void;

export class DeleteInventoryUseCase
  implements IUseCase<DeleteInventoryInput, DeleteInventoryOutput>
{
  constructor(private readonly inventoryRepo: IInventoryRepository) {}

  async execute(input: DeleteInventoryInput): Promise<DeleteInventoryOutput> {
    let inventoryId: InventoryId;
    try {
      inventoryId = new InventoryId(input.id);
    } catch (e) {
      // Re-throw to preserve the InvalidUuidError type used in other modules
      throw e as InvalidUuidError;
    }

    const inventory = await this.inventoryRepo.findById(inventoryId);
    if (!inventory) {
      throw new NotFoundError(input.id, Inventory);
    }

    // Multi-tenancy validation
    if (inventory.store_id !== input.store_id) {
      throw new EntityValidationError([
        { store_id: ["Inventory item does not belong to this store"] },
      ]);
    }

    // Perform delete
    await this.inventoryRepo.delete(inventoryId);
  }
}