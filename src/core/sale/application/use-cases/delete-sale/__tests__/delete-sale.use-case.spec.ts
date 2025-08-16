import { SaleInMemoryRepository } from '../../../../infra/db/in-memory/sale-in-memory.repository';
import { DeleteSaleUseCase } from '../delete-sale.use-case';
import { Sale, SaleId } from '../../../../domain/sale.aggregate';
import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';
import { InvalidUuidError } from '../../../../../shared/domain/value-objects/uuid.vo';
import { EntityValidationError } from '../../../../../shared/domain/validators/validation.error';

describe('DeleteSaleUseCase Unit Tests', () => {
  let useCase: DeleteSaleUseCase;
  let repository: SaleInMemoryRepository;

  beforeEach(() => {
    repository = new SaleInMemoryRepository();
    useCase = new DeleteSaleUseCase(repository);
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

  it('should delete an existing sale', async () => {
    const sale = Sale.fake().aSale().withStoreId('store-123').build() as Sale;
    await repository.insert(sale);

    const spyDelete = jest.spyOn(repository, 'delete');

    await useCase.execute({ id: sale.sale_id.id, store_id: 'store-123' });

    expect(spyDelete).toHaveBeenCalledTimes(1);
    expect(spyDelete).toHaveBeenCalledWith(sale.sale_id);
    expect(repository.items).toHaveLength(0);
  });

  it('should throw error when trying to delete sale from different store', async () => {
    const sale = Sale.fake().aSale().withStoreId('store-123').build() as Sale;
    await repository.insert(sale);

    await expect(() =>
      useCase.execute({ id: sale.sale_id.id, store_id: 'store-456' })
    ).rejects.toThrow(EntityValidationError);

    expect(repository.items).toHaveLength(1);
  });
});