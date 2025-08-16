import { IUseCase } from '../../../../shared/application/use-case.interface';
import { NotFoundError } from '../../../../shared/domain/errors/not-found.error';
import { EntityValidationError } from '../../../../shared/domain/validators/validation.error';
import { Sale, SaleId } from '../../../domain/sale.aggregate';
import { ISaleRepository } from '../../../domain/repositories/sale.repository.interface';
import { SaleOutput, SaleOutputMapper } from '../common/sale-output';

export class GetSaleUseCase implements IUseCase<GetSaleInput, GetSaleOutput> {
  constructor(private readonly saleRepo: ISaleRepository) {}

  async execute(input: GetSaleInput): Promise<GetSaleOutput> {
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

    return SaleOutputMapper.toOutput(sale);
  }
}

export type GetSaleInput = {
  id: string;
  store_id: string;
};

export type GetSaleOutput = SaleOutput;