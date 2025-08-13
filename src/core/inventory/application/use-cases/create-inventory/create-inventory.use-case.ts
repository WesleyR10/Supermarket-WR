import { IUseCase } from '../../../../shared/application/use-case.interface';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';
import { Inventory } from '../../../domain/inventory.aggregate';
import { IInventoryRepository } from '../../../domain/repositories/inventory.repository.interface';
import { CreateInventoryInput } from './create-inventory.input';
import { InventoryOutput, InventoryOutputMapper } from '../common/inventory-output';

export class CreateInventoryUseCase
  implements IUseCase<CreateInventoryInput, InventoryOutput>
{
  constructor(private readonly inventoryRepo: IInventoryRepository) {}

  async execute(input: CreateInventoryInput): Promise<InventoryOutput> {
    const entity = Inventory.create(input);

    if (entity.notification.hasErrors()) {
      throw new EntityValidationError(entity.notification.toJSON());
    }

    await this.inventoryRepo.insert(entity);

    return InventoryOutputMapper.toOutput(entity);
  }
}