import { IUseCase } from '../../../../shared/application/use-case.interface';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';
import { Client, ClientId } from '../../../domain/client.aggregate';
import { IClientRepository } from '../../../domain/repositories/client.repository.interface';
import { ClientOutput, ClientOutputMapper } from '../common/client-output';
import { ActivateClientInput } from './activate-client.input';

export class ActivateClientUseCase
  implements IUseCase<ActivateClientInput, ActivateClientOutput>
{
  constructor(private readonly clientRepo: IClientRepository) {}

  async execute(input: ActivateClientInput): Promise<ActivateClientOutput> {
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

    // Ativar cliente
    client.activate();
    
    // Validar após ativação
    client.validate();
    if (client.notification.hasErrors()) {
      throw new EntityValidationError(client.notification.toJSON());
    }

    await this.clientRepo.update(client);

    return ClientOutputMapper.toOutput(client);
  }
}

export type ActivateClientOutput = ClientOutput;