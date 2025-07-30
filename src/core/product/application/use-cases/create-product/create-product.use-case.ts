import { IUseCase } from '../../../../shared/application/use-case.interface';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';
import { Product } from '../../../domain/product.aggregate';
import { IProductRepository } from '../../../domain/repositories/product.repository.interface';
import { IFiscalValidationDomainService } from '../../../domain/services/fiscal-validation.domain-service';
import { IStoreSettingsService } from '../../../../shared/domain/services/store-settings.service';
import {
  ProductOutput,
  ProductOutputMapper,
} from '../common/product-output';
import { CreateProductInput } from './create-product.input';

export class CreateProductUseCase
  implements IUseCase<CreateProductInput, CreateProductOutput>
{
  constructor(
    private readonly productRepo: IProductRepository,
    private readonly fiscalValidationService: IFiscalValidationDomainService,
    private readonly storeSettingsService: IStoreSettingsService
  ) {}

  async execute(input: CreateProductInput): Promise<CreateProductOutput> {
    const entity = Product.create(input);

    if (entity.notification.hasErrors()) {
      throw new EntityValidationError(entity.notification.toJSON());
    }

    // Verificar se a validação fiscal está habilitada para esta loja
    const isFiscalValidationEnabled = await this.storeSettingsService.isFiscalValidationEnabled(input.store_id);
    
    if (isFiscalValidationEnabled) {
      // Executar validação fiscal
      const fiscalValidation = await this.fiscalValidationService.validateFiscalCompliance(
        entity,
        input.store_id
      );

      if (!fiscalValidation.isValid) {
        // Adicionar erros de validação fiscal às notificações da entidade
        fiscalValidation.errors.forEach(error => {
          entity.notification.addError(error, 'fiscal_validation');
        });
        
        throw new EntityValidationError(entity.notification.toJSON());
      }
    }

    await this.productRepo.insert(entity);

    return ProductOutputMapper.toOutput(entity);
  }
}

export type CreateProductOutput = ProductOutput;