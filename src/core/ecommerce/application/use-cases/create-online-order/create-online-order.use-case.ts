import { IUseCase } from '../../../../shared/application/use-case.interface';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';
import { OnlineOrder } from '../../../domain/online-order.aggregate';
import { OnlineOrderOutput, OnlineOrderOutputMapper } from '../common/online-order-output';
import { CreateOnlineOrderInput, ValidateCreateOnlineOrderInput } from './create-online-order.input';
import { IOnlineOrderRepository } from '../../../domain/repositories/online-order.repository.interface';
import { IStockValidationService } from '../../../domain/services/stock-validation.service.interface';
import { Uuid } from '../../../../shared/domain/value-objects/uuid.vo';
import { Quantity } from '../../../../shared/domain/value-objects/quantity.vo';

export class CreateOnlineOrderUseCase
  implements IUseCase<CreateOnlineOrderInput, CreateOnlineOrderOutput>
{
  constructor(
    private readonly onlineOrderRepo: IOnlineOrderRepository,
    private readonly stockValidationService?: IStockValidationService
  ) {}

  async execute(input: CreateOnlineOrderInput): Promise<CreateOnlineOrderOutput> {
    // Validação de estoque antes de criar o pedido
    if (this.stockValidationService) {
      await this.validateStock(input);
    }

    // Criação da entidade (Domain responsibility) - TODAS as validações ficam no aggregate
    const createCommand = {
      ...input,
      estimated_delivery: input.estimated_delivery ? new Date(input.estimated_delivery) : undefined
    };
    const entity = OnlineOrder.create(createCommand);

    // Verificação de erros de validação
    if (entity.notification.hasErrors()) {
      throw new EntityValidationError(entity.notification.toJSON());
    }

    // Persistência
    await this.onlineOrderRepo.insert(entity);

    return OnlineOrderOutputMapper.toOutput(entity);
  }

  private async validateStock(input: CreateOnlineOrderInput): Promise<void> {
    if (!this.stockValidationService) {
      return;
    }

    // Converte os itens do input para o formato esperado pelo serviço de estoque
    const stockItems = input.items.map(item => ({
      product_id: new Uuid(item.product_id),
      quantity: new Quantity(item.quantity)
    }));

    // Valida disponibilidade de estoque
    const stockValidation = await this.stockValidationService.validateStockAvailability(
      input.store_id,
      stockItems
    );

    // Se há erros de estoque, lança exceção
    if (!stockValidation.is_valid) {
      const stockErrors: Record<string, string[]> = {};
      
      stockValidation.errors.forEach(error => {
        const field = `items.${error.product_id.id}`;
        if (!stockErrors[field]) {
          stockErrors[field] = [];
        }
        stockErrors[field].push(error.message);
      });
      
      throw new EntityValidationError([stockErrors]);
    }

    // Log de avisos de estoque (baixo estoque, próximo ao vencimento, etc.)
    if (stockValidation.warnings.length > 0) {
      console.warn('[CreateOnlineOrder] Avisos de estoque:', stockValidation.warnings.map(w => w.message));
    }
  }
}

export type CreateOnlineOrderOutput = OnlineOrderOutput;
