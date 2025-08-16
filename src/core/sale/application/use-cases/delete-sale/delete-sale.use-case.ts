import { IUseCase } from '../../../../shared/application/use-case.interface';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';
import { Sale, SaleId } from '../../../domain/sale.aggregate';
import { ISaleRepository } from '../../../domain/repositories/sale.repository.interface';

export type DeleteSaleInput = {
  id: string;
  store_id: string;
};

export type DeleteSaleOutput = void;

export class DeleteSaleUseCase implements IUseCase<DeleteSaleInput, DeleteSaleOutput> {
  constructor(private readonly saleRepo: ISaleRepository) {}

  async execute(input: DeleteSaleInput): Promise<DeleteSaleOutput> {
    const saleId = new SaleId(input.id);
    const sale = await this.saleRepo.findById(saleId);

    if (!sale) {
      throw new NotFoundError(input.id, Sale);
    }

    if (sale.store_id !== input.store_id) {
      throw new EntityValidationError([
        {
          store_id: ['Sale does not belong to this store'],
        },
      ]);
    }

    await this.saleRepo.delete(saleId);
  }
}