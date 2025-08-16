// Sale Domain Exports
export * from './sale.aggregate';
export * from './sale.repository.interface';
export * from './sale.validator';
export * from './sale-fake.builder';

// Re-export commonly used types
export type {
  SaleConstructorProps,
  SaleCreateCommand,
  SaleItemCreateCommand
} from './sale.aggregate';

export {
  PaymentMethod,
  SaleStatus,
  SaleId,
  SaleItem,
  Sale
} from './sale.aggregate';