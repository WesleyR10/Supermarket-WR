import { SaleInMemoryRepository } from '../../../../infra/db/in-memory/sale-in-memory.repository';
import { GetSaleUseCase } from '../get-sale.use-case';
import { Sale, SaleId } from '../../../../domain/sale.aggregate';
import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';
import { InvalidUuidError } from '../../../../../shared/domain/value-objects/uuid.vo';
import { EntityValidationError } from '../../../../../shared/domain/validators/validation.error';

describe('GetSaleUseCase Unit Tests', () => {
  let useCase: GetSaleUseCase;
  let repository: SaleInMemoryRepository;

  beforeEach(() => {
    repository = new SaleInMemoryRepository();
    useCase = new GetSaleUseCase(repository);
  });

  it('should throw error when id is invalid', async () => {
    await expect(() => useCase.execute({ id: 'invalid-id', store_id: 'store-123' })).rejects.toThrow(
      InvalidUuidError,
    );
  });

  it('should throw error when sale does not exist', async () => {
    const saleId = new SaleId();
    await expect(() => useCase.execute({ id: saleId.id, store_id: 'store-123' })).rejects.toThrow(
      NotFoundError,
    );
  });

  it('should get an existing sale', async () => {
    const sale = Sale.fake().aSale().withStoreId('store-123').build() as Sale;
    await repository.insert(sale);

    const output = await useCase.execute({ id: sale.sale_id.id, store_id: 'store-123' });

    expect(output.id).toBe(sale.sale_id.id);
    expect(output.store_id).toBe('store-123');
    expect(output.subtotal_with_discount).toBe(sale.getSubtotalWithDiscount());
    expect(output.final_total).toBe(sale.getFinalTotal());
  });

  it('should throw error when trying to get sale from different store', async () => {
    const sale = Sale.fake().aSale().withStoreId('store-123').build() as Sale;
    await repository.insert(sale);

    await expect(() =>
      useCase.execute({ id: sale.sale_id.id, store_id: 'store-456' })
    ).rejects.toThrow(EntityValidationError);
  });
});