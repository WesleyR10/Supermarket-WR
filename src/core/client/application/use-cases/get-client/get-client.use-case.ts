import { IUseCase } from '../../../../shared/application/use-case.interface';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';
import { Client, ClientId } from '../../../domain/client.aggregate';
import { IClientRepository } from '../../../domain/repositories/client.repository.interface';
import { ClientOutput, ClientOutputMapper } from '../common/client-output';
import { GetClientInput } from './get-client.input';

export class GetClientUseCase
  implements IUseCase<GetClientInput, GetClientOutput>
{
  constructor(private readonly clientRepo: IClientRepository) {}

  async execute(input: GetClientInput): Promise<GetClientOutput> {
    const clientId = new ClientId(input.id);
    const client = await this.clientRepo.findById(clientId);

    if (!client) {
      throw new NotFoundError(input.id, Client);
    }

    // Validação de multi-tenancy
    if (client.store_id !== input.store_id) {
      throw new EntityValidationError([
        {
          store_id: ['Client does not belong to this store'],
        },
      ]);
    }

    return ClientOutputMapper.toOutput(client);
  }
}

export type GetClientOutput = ClientOutput;