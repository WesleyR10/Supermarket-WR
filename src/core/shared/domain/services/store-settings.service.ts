export interface IStoreSettingsService {
  isFiscalValidationEnabled(storeId: string): Promise<boolean>;
}

export type StoreSettings = {
  fiscal_validation_enabled?: boolean;
  // outras configurações...
};

export class StoreSettingsService implements IStoreSettingsService {
  // Por enquanto, vamos simular que sempre está habilitado
  // Futuramente isso virá do banco de dados (campo settings da tabela Stores)
  async isFiscalValidationEnabled(storeId: string): Promise<boolean> {
    // TODO: Implementar busca real no banco de dados
    // const store = await this.storeRepository.findById(storeId);
    // return store.settings.fiscal_validation_enabled ?? true;
    return true; // Por padrão habilitado
  }
}