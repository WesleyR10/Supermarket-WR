import { IUseCase } from '../../../../shared/application/use-case.interface';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';
import { Client, ClientId } from '../../../domain/client.aggregate';
import { IClientRepository } from '../../../domain/repositories/client.repository.interface';
import { ClientOutput, ClientOutputMapper } from '../common/client-output';
import { UpdateClientInput } from './update-client.input';

export class UpdateClientUseCase
  implements IUseCase<UpdateClientInput, UpdateClientOutput>
{
  constructor(private readonly clientRepo: IClientRepository) {}

  async execute(input: UpdateClientInput): Promise<UpdateClientOutput> {
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

    // Atualizar propriedades
    if (input.customer_type !== undefined) {
      client.updateCustomerType(input.customer_type);
    }
    if (input.credit_limit !== undefined) {
      client.setCreditLimit(input.credit_limit);
    }
    if (input.preferred_contact_method !== undefined ||
        input.allows_promotions !== undefined ||
        input.allows_sms !== undefined ||
        input.allows_email !== undefined) {
      client.updateContactPreferences(
        input.preferred_contact_method ?? client.preferred_contact_method,
        input.allows_promotions ?? client.allows_promotions,
        input.allows_sms ?? client.allows_sms,
        input.allows_email ?? client.allows_email
      );
    }
    if (input.payment_preference !== undefined) {
      client.updatePaymentPreference(input.payment_preference);
    }
    if (input.delivery_preference !== undefined) {
      client.updateDeliveryPreference(input.delivery_preference);
    }
    if (input.registration_source !== undefined) {
      client.registration_source = input.registration_source;
      client.updated_at = new Date();
    }
    if (input.notes !== undefined) {
      client.notes = input.notes;
      client.updated_at = new Date();
    }
    if (input.is_active !== undefined) {
      input.is_active ? client.activate() : client.deactivate();
    }

    // Verificar se houve erros durante as operações de negócio
    if (client.notification.hasErrors()) {
      throw new EntityValidationError(client.notification.toJSON());
    }

    await this.clientRepo.update(client);

    return ClientOutputMapper.toOutput(client);
  }
}

export type UpdateClientOutput = ClientOutput;