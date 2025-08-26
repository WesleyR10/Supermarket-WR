import { Client, CustomerType, LoyaltyLevel, ContactMethod, PaymentPreference, DeliveryPreference } from '../../../domain/client.aggregate';
import { ClientOutputMapper } from './client-output';

describe('ClientOutputMapper Unit Tests', () => {
  it('should convert a client in output', () => {
    const entity = Client.create({
      user_id: 'user-123',
      store_id: 'store-456',
      customer_type: CustomerType.INDIVIDUAL,
      credit_limit: 1000,
      preferred_contact_method: ContactMethod.EMAIL,
      allows_promotions: true,
      allows_sms: false,
      allows_email: true,
      payment_preference: PaymentPreference.CREDIT_CARD,
      delivery_preference: DeliveryPreference.HOME_DELIVERY,
      registration_source: 'website',
      notes: 'Cliente preferencial',
    });
    
    const spyToJSON = jest.spyOn(entity, 'toJSON');
    const output = ClientOutputMapper.toOutput(entity);
    
    expect(spyToJSON).toHaveBeenCalled();
    expect(output).toStrictEqual({
      id: entity.client_id.id,
      user_id: 'user-123',
      store_id: 'store-456',
      loyalty_points: 0,
      loyalty_level: LoyaltyLevel.BRONZE,
      loyalty_card_number: null,
      customer_type: CustomerType.INDIVIDUAL,
      avg_monthly_spending: null,
      total_purchases: 0,
      credit_limit: 1000,
      preferred_contact_method: ContactMethod.EMAIL,
      allows_promotions: true,
      allows_sms: false,
      allows_email: true,
      payment_preference: PaymentPreference.CREDIT_CARD,
      delivery_preference: DeliveryPreference.HOME_DELIVERY,
      last_purchase_date: null,
      registration_source: 'website',
      notes: 'Cliente preferencial',
      is_active: true,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
      deleted_at: null,
    });
  });

  it('should convert a vip client in output', () => {
    const entity = Client.create({
      user_id: 'user-vip-123',
      store_id: 'store-456',
      customer_type: CustomerType.VIP,
      credit_limit: 5000,
      preferred_contact_method: ContactMethod.WHATSAPP,
      allows_promotions: true,
      allows_sms: true,
      allows_email: true,
      payment_preference: PaymentPreference.PIX,
      delivery_preference: DeliveryPreference.HOME_DELIVERY,
      registration_source: 'store',
      notes: 'Cliente VIP com desconto especial',
    });

    // Simular evolução do cliente VIP
    entity.addLoyaltyPoints(12000);
    entity.updatePurchaseStats(2500);
    entity.recordPurchase(100); // Para incrementar total_purchases
    entity.setLoyaltyCardNumber('VIP2024001');
    
    const spyToJSON = jest.spyOn(entity, 'toJSON');
    const output = ClientOutputMapper.toOutput(entity);
    
    expect(spyToJSON).toHaveBeenCalled();
    expect(output).toStrictEqual({
      id: entity.client_id.id,
      user_id: 'user-vip-123',
      store_id: 'store-456',
      loyalty_points: 12000,
      loyalty_level: LoyaltyLevel.DIAMOND,
      loyalty_card_number: 'VIP2024001',
      customer_type: CustomerType.VIP,
      avg_monthly_spending: 2500,
      total_purchases: 1,
      credit_limit: 5000,
      preferred_contact_method: ContactMethod.WHATSAPP,
      allows_promotions: true,
      allows_sms: true,
      allows_email: true,
      payment_preference: PaymentPreference.PIX,
      delivery_preference: DeliveryPreference.HOME_DELIVERY,
      last_purchase_date: entity.last_purchase_date,
      registration_source: 'store',
      notes: 'Cliente VIP com desconto especial',
      is_active: true,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
      deleted_at: null,
    });
  });

  it('should convert a business client in output', () => {
    const entity = Client.create({
      user_id: 'user-business-123',
      store_id: 'store-456',
      customer_type: CustomerType.BUSINESS,
      credit_limit: 10000,
      preferred_contact_method: ContactMethod.EMAIL,
      allows_promotions: false,
      allows_sms: false,
      allows_email: true,
      payment_preference: PaymentPreference.BANK_SLIP,
      delivery_preference: DeliveryPreference.WORKPLACE_DELIVERY,
      registration_source: 'app',
      notes: 'Cliente corporativo - pagamento a prazo',
    });

    // Simular histórico de compras corporativas
    entity.addLoyaltyPoints(3500);
    entity.updatePurchaseStats(1200);
    entity.recordPurchase(300); // Para incrementar total_purchases
    entity.setLoyaltyCardNumber('CORP2024001');
    
    const spyToJSON = jest.spyOn(entity, 'toJSON');
    const output = ClientOutputMapper.toOutput(entity);
    
    expect(spyToJSON).toHaveBeenCalled();
    expect(output).toStrictEqual({
      id: entity.client_id.id,
      user_id: 'user-business-123',
      store_id: 'store-456',
      loyalty_points: 3500,
      loyalty_level: LoyaltyLevel.GOLD,
      loyalty_card_number: 'CORP2024001',
      customer_type: CustomerType.BUSINESS,
      avg_monthly_spending: 1200,
      total_purchases: 1,
      credit_limit: 10000,
      preferred_contact_method: ContactMethod.EMAIL,
      allows_promotions: false,
      allows_sms: false,
      allows_email: true,
      payment_preference: PaymentPreference.BANK_SLIP,
      delivery_preference: DeliveryPreference.WORKPLACE_DELIVERY,
      last_purchase_date: entity.last_purchase_date,
      registration_source: 'app',
      notes: 'Cliente corporativo - pagamento a prazo',
      is_active: true,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
      deleted_at: null,
    });
  });

  it('should convert a wholesale client in output', () => {
    const entity = Client.create({
      user_id: 'user-wholesale-123',
      store_id: 'store-456',
      customer_type: CustomerType.WHOLESALE,
      credit_limit: 15000,
      preferred_contact_method: ContactMethod.PHONE,
      allows_promotions: true,
      allows_sms: true,
      allows_email: true,
      payment_preference: PaymentPreference.BANK_SLIP,
      delivery_preference: DeliveryPreference.PICKUP,
      registration_source: 'social',
      notes: 'Cliente atacadista - compras em grande volume',
    });

    // Simular histórico de compras em grande volume
    entity.addLoyaltyPoints(7500);
    entity.updatePurchaseStats(3000);
    entity.recordPurchase(500); // Para incrementar total_purchases
    entity.setLoyaltyCardNumber('WHOL2024001');
    
    const spyToJSON = jest.spyOn(entity, 'toJSON');
    const output = ClientOutputMapper.toOutput(entity);
    
    expect(spyToJSON).toHaveBeenCalled();
    expect(output).toStrictEqual({
      id: entity.client_id.id,
      user_id: 'user-wholesale-123',
      store_id: 'store-456',
      loyalty_points: 7500,
      loyalty_level: LoyaltyLevel.PLATINUM,
      loyalty_card_number: 'WHOL2024001',
      customer_type: CustomerType.WHOLESALE,
      avg_monthly_spending: 3000,
      total_purchases: 1,
      credit_limit: 15000,
      preferred_contact_method: ContactMethod.PHONE,
      allows_promotions: true,
      allows_sms: true,
      allows_email: true,
      payment_preference: PaymentPreference.BANK_SLIP,
      delivery_preference: DeliveryPreference.PICKUP,
      last_purchase_date: entity.last_purchase_date,
      registration_source: 'social',
      notes: 'Cliente atacadista - compras em grande volume',
      is_active: true,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
      deleted_at: null,
    });
  });

  it('should convert a new client with minimal data in output', () => {
    const entity = Client.create({
      user_id: 'user-new-123',
      store_id: 'store-456',
    });
    
    const spyToJSON = jest.spyOn(entity, 'toJSON');
    const output = ClientOutputMapper.toOutput(entity);
    
    expect(spyToJSON).toHaveBeenCalled();
    expect(output).toStrictEqual({
      id: entity.client_id.id,
      user_id: 'user-new-123',
      store_id: 'store-456',
      loyalty_points: 0,
      loyalty_level: LoyaltyLevel.BRONZE,
      loyalty_card_number: null,
      customer_type: CustomerType.INDIVIDUAL,
      avg_monthly_spending: null,
      total_purchases: 0,
      credit_limit: null,
      preferred_contact_method: ContactMethod.NONE,
      allows_promotions: true,
      allows_sms: false,
      allows_email: false,
      payment_preference: PaymentPreference.NONE,
      delivery_preference: DeliveryPreference.NONE,
      last_purchase_date: null,
      registration_source: null,
      notes: null,
      is_active: true,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
      deleted_at: null,
    });
  });
});