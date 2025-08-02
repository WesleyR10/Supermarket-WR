import { IStoreSettingsService } from '@core/shared/domain/services/store-settings.service';
import { IUseCase } from '../../../../shared/application/use-case.interface';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';
import { Product, ProductId } from '../../../domain/product.aggregate';
import { IProductRepository } from '../../../domain/repositories/product.repository.interface';
import { IFiscalValidationDomainService } from '../../../domain/services/fiscal-validation.domain-service';
import { ProductOutput, ProductOutputMapper } from '../common/product-output';
import { UpdateProductInput } from './update-product.input';

export class UpdateProductUseCase
  implements IUseCase<UpdateProductInput, UpdateProductOutput>
{
  constructor(
    private readonly productRepo: IProductRepository,
    private readonly fiscalValidationService: IFiscalValidationDomainService,
    private readonly storeSettingsService: IStoreSettingsService // NOVO
  ) {}

  async execute(input: UpdateProductInput): Promise<UpdateProductOutput> {
    const productId = new ProductId(input.id);
    const product = await this.productRepo.findById(productId);

    if (!product) {
      throw new NotFoundError(input.id, Product);
    }

    // Validação de multi-tenancy
    if (product.store_id !== input.store_id) {
      throw new EntityValidationError([
        {
          store_id: ['Product does not belong to this store'],
        },
      ]);
    }

    // Atualizar propriedades
    if (input.name !== undefined) product.changeName(input.name);
    if (input.description !== undefined) product.changeDescription(input.description);
    if (input.barcode !== undefined) product.changeBarcode(input.barcode);
    if (input.price !== undefined) product.changePrice(input.price);
    if (input.cost_price !== undefined) product.changeCostPrice(input.cost_price);
    if (input.is_active !== undefined) {
      input.is_active ? product.activate() : product.deactivate();
    }
    if (input.brand !== undefined) product.changeBrand(input.brand);
    if (input.unit_type !== undefined) product.changeUnitType(input.unit_type);
    if (input.weight !== undefined) product.changeWeight(input.weight);
    if (input.volume !== undefined) product.changeVolume(input.volume);
    if (input.dimensions !== undefined) product.changeDimensions(input.dimensions);
    if (input.supplier_code !== undefined) product.changeSupplierCode(input.supplier_code);
    if (input.ncm_code !== undefined) product.changeNcmCode(input.ncm_code);
    if (input.requires_weighing !== undefined) product.changeRequiresWeighing(input.requires_weighing);

    // Validar após as mudanças
    product.validate();
    if (product.notification.hasErrors()) {
      throw new EntityValidationError(product.notification.toJSON());
    }

    // Verificar se a validação fiscal está habilitada
    const isFiscalValidationEnabled = await this.storeSettingsService.isFiscalValidationEnabled(input.store_id);
    
    if (isFiscalValidationEnabled) {
      const fiscalValidation = await this.fiscalValidationService.validateFiscalCompliance(
        product,
        input.store_id
      );

      if (!fiscalValidation.isValid) {
        fiscalValidation.errors.forEach(error => {
          product.notification.addError(error, 'fiscal_validation');
        });
        
        throw new EntityValidationError(product.notification.toJSON());
      }
    }

    await this.productRepo.update(product);

    return ProductOutputMapper.toOutput(product);
  }
}

export type UpdateProductOutput = ProductOutput;