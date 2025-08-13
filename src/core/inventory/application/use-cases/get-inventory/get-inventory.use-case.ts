import { IUseCase } from '../../../../shared/application/use-case.interface';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';
import { Inventory, InventoryId } from '../../../domain/inventory.aggregate';
import { IInventoryRepository } from '../../../domain/repositories/inventory.repository.interface';
import {
  InventoryOutput,
  InventoryOutputMapper,
} from '../common/inventory-output';

export class GetInventoryUseCase
  implements IUseCase<GetInventoryInput, GetInventoryOutput>
{
  constructor(private readonly inventoryRepo: IInventoryRepository) {}

  async execute(input: GetInventoryInput): Promise<GetInventoryOutput> {
    const inventoryId = new InventoryId(input.id);
    const inventory = await this.inventoryRepo.findById(inventoryId);

    if (!inventory) {
      throw new NotFoundError(input.id, Inventory);
    }

    if (inventory.store_id !== input.store_id) {
      throw new EntityValidationError([
        {
          store_id: ['Inventory does not belong to this store'],
        },
      ]);
    }

    return InventoryOutputMapper.toOutput(inventory);
  }
}

export type GetInventoryInput = {
  id: string;
  store_id: string;
};

export type GetInventoryOutput = InventoryOutput;