import { IUseCase } from '../../../../shared/application/use-case.interface';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';
import { Client, ClientId } from '../../../domain/client.aggregate';
import { IClientRepository } from '../../../domain/repositories/client.repository.interface';
import { DeleteClientInput } from './delete-client.input';

export class DeleteClientUseCase
  implements IUseCase<DeleteClientInput, DeleteClientOutput>
{
  constructor(private readonly clientRepo: IClientRepository) {}

  async execute(input: DeleteClientInput): Promise<DeleteClientOutput> {
    const clientId = new ClientId(input.id);
    const client = await this.clientRepo.findById(clientId);

    if (!client) {
      throw new NotFoundError(input.id, Client);
    }

    // Validação de multi-tenancy
    if (client.stores_id !== input.stores_id) {
      throw new EntityValidationError([
        {
          stores_id: ['Client does not belong to this store'],
        },
      ]);
    }

    // Soft delete
    client.softDelete();
    await this.clientRepo.update(client);
  }
}

export type DeleteClientOutput = void;