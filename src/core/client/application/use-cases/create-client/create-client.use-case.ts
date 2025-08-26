import { IUseCase } from '../../../../shared/application/use-case.interface';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';
import { Client } from '../../../domain/client.aggregate';
import { IClientRepository } from '../../../domain/repositories/client.repository.interface';
import { ClientOutput, ClientOutputMapper } from '../common/client-output';
import { CreateClientInput } from './create-client.input';

export class CreateClientUseCase
  implements IUseCase<CreateClientInput, CreateClientOutput>
{
  constructor(private readonly clientRepo: IClientRepository) {}

  async execute(input: CreateClientInput): Promise<CreateClientOutput> {
    // Verificar se já existe um cliente para este usuário nesta loja
    const existingClient = await this.clientRepo.findByUserIdAndStoreId(
      input.user_id,
      input.store_id
    );

    if (existingClient) {
      throw new EntityValidationError([
        {
          user_id: ['Client already exists for this user and store'],
        },
      ]);
    }

    // Criação da entidade (Domain responsibility) - TODAS as validações ficam no aggregate
    const entity = Client.create(input);

    // Verificação de erros de validação
    if (entity.notification.hasErrors()) {
      throw new EntityValidationError(entity.notification.toJSON());
    }

    // Persistência
    await this.clientRepo.insert(entity);

    return ClientOutputMapper.toOutput(entity);
  }
}

export type CreateClientOutput = ClientOutput;