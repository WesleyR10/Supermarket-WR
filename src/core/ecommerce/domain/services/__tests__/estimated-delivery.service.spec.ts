import { EstimatedDeliveryService } from '../estimated-delivery.service';
import {
  DeliveryCalculationParams,
} from '../estimated-delivery.service.interface';
import { DeliveryAddress } from '../../online-order.aggregate';

describe('EstimatedDeliveryService Unit Tests', () => {
  let service: EstimatedDeliveryService;

  beforeEach(() => {
    service = new EstimatedDeliveryService();
  });

  describe('calculateEstimatedDelivery', () => {
    it('should calculate delivery time for normal delivery', async () => {
      const params: DeliveryCalculationParams = {
        delivery_address: DeliveryAddress.create({
          street: 'Rua das Flores',
          number: '123',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          zip_code: '01234567',
        }),
        store_id: 'store-123',
        tenant_id: 'tenant-123',
      };

      const result = await service.calculateEstimatedDelivery(params);

      expect(result).toMatchObject({
        estimated_delivery: expect.any(Date),
        is_express: expect.any(Boolean),
      });
      expect(result.estimated_delivery.getTime()).toBeGreaterThan(Date.now());
    });

    it('should calculate delivery time for scheduled delivery', async () => {
      const scheduledTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
      const params: DeliveryCalculationParams = {
        delivery_address: DeliveryAddress.create({
          street: 'Rua das Flores',
          number: '123',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          zip_code: '01234567',
        }),
        store_id: 'store-123',
        tenant_id: 'tenant-123',
        requested_delivery_time: scheduledTime,
        is_scheduled: true,
      };

      const result = await service.calculateEstimatedDelivery(params);

      expect(result.estimated_delivery).toEqual(scheduledTime);
      expect(result.delivery_window_start).toBeDefined();
      expect(result.delivery_window_end).toBeDefined();
      expect(result.delivery_notes).toContain('agendada');
    });

    it('should calculate delivery time for shift delivery', async () => {
      const params: DeliveryCalculationParams = {
        delivery_address: DeliveryAddress.create({
          street: 'Rua das Flores',
          number: '123',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          zip_code: '01234567',
        }),
        store_id: 'store-123',
        tenant_id: 'tenant-123',
        delivery_shift: 'morning',
      };

      const result = await service.calculateEstimatedDelivery(params);

      expect(result.delivery_window_start).toBeDefined();
      expect(result.delivery_window_end).toBeDefined();
      expect(result.delivery_notes).toContain('turno: morning');
    });

    it('should mark as express delivery for close addresses', async () => {
      const params: DeliveryCalculationParams = {
        delivery_address: DeliveryAddress.create({
          street: 'Rua das Flores',
          number: '123',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          zip_code: '01234567', // CEP próximo (01-05)
        }),
        store_id: 'store-123',
        tenant_id: 'tenant-123',
      };

      const result = await service.calculateEstimatedDelivery(params);

      expect(result.is_express).toBe(true);
      expect(result.delivery_notes).toContain('expressa');
    });

    it('should not mark as express delivery for distant addresses', async () => {
      const params: DeliveryCalculationParams = {
        delivery_address: DeliveryAddress.create({
          street: 'Rua das Flores',
          number: '123',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          zip_code: '20000000', // CEP distante
        }),
        store_id: 'store-123',
        tenant_id: 'tenant-123',
      };

      const result = await service.calculateEstimatedDelivery(params);

      expect(result.is_express).toBe(false);
    });
  });

  describe('isDeliveryTimeAvailable', () => {
    it('should return true for normal delivery', async () => {
      const params: DeliveryCalculationParams = {
        delivery_address: DeliveryAddress.create({
          street: 'Rua das Flores',
          number: '123',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          zip_code: '01234567',
        }),
        store_id: 'store-123',
        tenant_id: 'tenant-123',
      };

      const result = await service.isDeliveryTimeAvailable(params);

      expect(result).toBe(true);
    });

    it('should return true for valid scheduled time', async () => {
      const validTime = new Date();
      validTime.setHours(14, 0, 0, 0); // 14:00

      const params: DeliveryCalculationParams = {
        delivery_address: DeliveryAddress.create({
          street: 'Rua das Flores',
          number: '123',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          zip_code: '01234567',
        }),
        store_id: 'store-123',
        tenant_id: 'tenant-123',
        requested_delivery_time: validTime,
      };

      const result = await service.isDeliveryTimeAvailable(params);

      expect(result).toBe(true);
    });

    it('should return false for invalid scheduled time', async () => {
      const invalidTime = new Date();
      invalidTime.setHours(2, 0, 0, 0); // 02:00 (fora do horário)

      const params: DeliveryCalculationParams = {
        delivery_address: DeliveryAddress.create({
          street: 'Rua das Flores',
          number: '123',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          zip_code: '01234567',
        }),
        store_id: 'store-123',
        tenant_id: 'tenant-123',
        requested_delivery_time: invalidTime,
      };

      const result = await service.isDeliveryTimeAvailable(params);

      expect(result).toBe(false);
    });
  });

  describe('getAvailableDeliveryShifts', () => {
    it('should return available shifts for weekday morning', async () => {
      const monday = new Date('2024-01-15T09:00:00Z'); // Segunda-feira, 9h

      const result = await service.getAvailableDeliveryShifts(
        monday,
        'store-123',
        'tenant-123',
      );

      expect(result).toContain('morning');
      expect(result).toContain('afternoon');
      expect(result).toContain('evening');
    });

    it('should return limited shifts for weekday afternoon', async () => {
      const monday = new Date('2024-01-15T15:00:00Z'); // Segunda-feira, 15h

      const result = await service.getAvailableDeliveryShifts(
        monday,
        'store-123',
        'tenant-123',
      );

      expect(result).not.toContain('morning');
      expect(result).toContain('afternoon');
      expect(result).toContain('evening');
    });

    it('should return limited shifts for Sunday', async () => {
      const sunday = new Date('2024-01-14T09:00:00Z'); // Domingo, 9h

      const result = await service.getAvailableDeliveryShifts(
        sunday,
        'store-123',
        'tenant-123',
      );

      expect(result).toContain('morning');
      expect(result).toContain('afternoon');
      expect(result).not.toContain('evening');
    });

    it('should return empty array for late evening', async () => {
      const monday = new Date('2024-01-15T21:00:00Z'); // Segunda-feira, 21h

      const result = await service.getAvailableDeliveryShifts(
        monday,
        'store-123',
        'tenant-123',
      );

      expect(result).toHaveLength(0);
    });
  });
});