import { Quantity } from '../quantity.vo';

describe('Quantity Value Object Unit Tests', () => {
  describe('constructor', () => {
    it('should create quantity with valid positive value', () => {
      const quantity = new Quantity(10);
      expect(quantity.value).toBe(10);
    });

    it('should create quantity with zero value', () => {
      const quantity = new Quantity(0);
      expect(quantity.value).toBe(0);
    });

    it('should throw error for negative quantity', () => {
      expect(() => new Quantity(-1))
        .toThrow('Quantity cannot be negative');
    });

    it('should create quantity with decimal value (auto-floored)', () => {
      const quantity = new Quantity(1.5);
      expect(quantity.value).toBe(1); // Math.floor applied
    });
  });

  describe('add method', () => {
    it('should add two quantities correctly', () => {
      const qty1 = new Quantity(5);
      const qty2 = new Quantity(3);
      const result = qty1.add(qty2);
      
      expect(result.value).toBe(8);
      expect(result).toBeInstanceOf(Quantity);
    });

    it('should add zero quantity', () => {
      const qty1 = new Quantity(5);
      const qty2 = new Quantity(0);
      const result = qty1.add(qty2);
      
      expect(result.value).toBe(5);
    });

    it('should not mutate original quantities', () => {
      const qty1 = new Quantity(5);
      const qty2 = new Quantity(3);
      qty1.add(qty2);
      
      expect(qty1.value).toBe(5);
      expect(qty2.value).toBe(3);
    });
  });

  describe('subtract method', () => {
    it('should subtract quantities correctly', () => {
      const qty1 = new Quantity(10);
      const qty2 = new Quantity(3);
      const result = qty1.subtract(qty2);
      
      expect(result.value).toBe(7);
      expect(result).toBeInstanceOf(Quantity);
    });

    it('should subtract to zero', () => {
      const qty1 = new Quantity(5);
      const qty2 = new Quantity(5);
      const result = qty1.subtract(qty2);
      
      expect(result.value).toBe(0);
    });

    it('should throw error when result would be negative', () => {
      const qty1 = new Quantity(3);
      const qty2 = new Quantity(5);
      
      expect(() => qty1.subtract(qty2))
        .toThrow('Resulting quantity cannot be negative');
    });

    it('should not mutate original quantities', () => {
      const qty1 = new Quantity(10);
      const qty2 = new Quantity(3);
      qty1.subtract(qty2);
      
      expect(qty1.value).toBe(10);
      expect(qty2.value).toBe(3);
    });
  });

  describe('multiply method', () => {
    it('should multiply quantity by positive factor', () => {
      const qty = new Quantity(5);
      const result = qty.multiply(3);
      
      expect(result.value).toBe(15);
      expect(result).toBeInstanceOf(Quantity);
    });

    it('should multiply by zero', () => {
      const qty = new Quantity(5);
      const result = qty.multiply(0);
      
      expect(result.value).toBe(0);
    });

    it('should multiply by one', () => {
      const qty = new Quantity(5);
      const result = qty.multiply(1);
      
      expect(result.value).toBe(5);
    });

    it('should throw error for negative factor', () => {
      const qty = new Quantity(5);
      
      expect(() => qty.multiply(-2))
        .toThrow('Quantity cannot be negative');
    });

    it('should multiply by decimal factor (auto-floored)', () => {
      const qty = new Quantity(5);
      const result = qty.multiply(1.5);
      
      expect(result.value).toBe(7); // 5 * 1.5 = 7.5, floored to 7
    });

    it('should not mutate original quantity', () => {
      const qty = new Quantity(5);
      qty.multiply(3);
      
      expect(qty.value).toBe(5);
    });
  });

  describe('canSubtract method', () => {
    it('should return true when subtraction is possible', () => {
      const qty1 = new Quantity(10);
      const qty2 = new Quantity(5);
      
      expect(qty1.canSubtract(qty2)).toBe(true);
    });

    it('should return true when quantities are equal', () => {
      const qty1 = new Quantity(5);
      const qty2 = new Quantity(5);
      
      expect(qty1.canSubtract(qty2)).toBe(true);
    });

    it('should return false when subtraction would result in negative', () => {
      const qty1 = new Quantity(3);
      const qty2 = new Quantity(5);
      
      expect(qty1.canSubtract(qty2)).toBe(false);
    });

    it('should return true when subtracting zero', () => {
      const qty1 = new Quantity(5);
      const qty2 = new Quantity(0);
      
      expect(qty1.canSubtract(qty2)).toBe(true);
    });
  });

  describe('comparison methods', () => {
    describe('equals', () => {
      it('should return true for equal quantities', () => {
        const qty1 = new Quantity(5);
        const qty2 = new Quantity(5);
        
        expect(qty1.equals(qty2)).toBe(true);
      });

      it('should return false for different quantities', () => {
        const qty1 = new Quantity(5);
        const qty2 = new Quantity(3);
        
        expect(qty1.equals(qty2)).toBe(false);
      });

      it('should return true for zero quantities', () => {
        const qty1 = new Quantity(0);
        const qty2 = new Quantity(0);
        
        expect(qty1.equals(qty2)).toBe(true);
      });
    });

    describe('greaterThan', () => {
      it('should return true when first quantity is greater', () => {
        const qty1 = new Quantity(10);
        const qty2 = new Quantity(5);
        
        expect(qty1.isGreaterThan(qty2)).toBe(true);
      });

      it('should return false when quantities are equal', () => {
        const qty1 = new Quantity(5);
        const qty2 = new Quantity(5);
        
        expect(qty1.isGreaterThan(qty2)).toBe(false);
      });

      it('should return false when first quantity is smaller', () => {
        const qty1 = new Quantity(3);
        const qty2 = new Quantity(5);
        
        expect(qty1.isGreaterThan(qty2)).toBe(false);
      });
    });

    describe('lessThan', () => {
      it('should return true when first quantity is smaller', () => {
        const qty1 = new Quantity(3);
        const qty2 = new Quantity(5);
        
        expect(qty1.isLessThan(qty2)).toBe(true);
      });

      it('should return false when quantities are equal', () => {
        const qty1 = new Quantity(5);
        const qty2 = new Quantity(5);
        
        expect(qty1.isLessThan(qty2)).toBe(false);
      });

      it('should return false when first quantity is greater', () => {
        const qty1 = new Quantity(10);
        const qty2 = new Quantity(5);
        
        expect(qty1.isLessThan(qty2)).toBe(false);
      });
    });

    describe('isEqualTo', () => {
      it('should return true for equal quantities', () => {
        const qty1 = new Quantity(5);
        const qty2 = new Quantity(5);
        
        expect(qty1.isEqualTo(qty2)).toBe(true);
      });

      it('should return false for different quantities', () => {
        const qty1 = new Quantity(5);
        const qty2 = new Quantity(3);
        
        expect(qty1.isEqualTo(qty2)).toBe(false);
      });
    });

    describe('isPositive', () => {
      it('should return true for positive quantities', () => {
        const qty = new Quantity(5);
        expect(qty.isPositive()).toBe(true);
      });

      it('should return false for zero quantity', () => {
        const qty = new Quantity(0);
        expect(qty.isPositive()).toBe(false);
      });
    });
  });

  describe('isZero method', () => {
    it('should return true for zero quantity', () => {
      const qty = new Quantity(0);
      expect(qty.isZero()).toBe(true);
    });

    it('should return false for non-zero quantity', () => {
      const qty = new Quantity(5);
      expect(qty.isZero()).toBe(false);
    });
  });

  describe('toString method', () => {
    it('should return string representation of quantity', () => {
      const qty = new Quantity(42);
      expect(qty.toString()).toBe('42');
    });

    it('should return string representation of zero', () => {
      const qty = new Quantity(0);
      expect(qty.toString()).toBe('0');
    });
  });

  describe('edge cases and boundary conditions', () => {
    it('should handle large quantities within limit', () => {
      const largeQty = new Quantity(999999);
      expect(largeQty.value).toBe(999999);
    });

    it('should throw error for quantities exceeding limit', () => {
      expect(() => new Quantity(1000000))
        .toThrow('Quantity cannot exceed 999,999 units');
    });

    it('should handle operations with large quantities within limit', () => {
      const qty1 = new Quantity(500000);
      const qty2 = new Quantity(400000);
      const result = qty1.add(qty2);
      
      expect(result.value).toBe(900000);
    });

    it('should throw error when operations exceed limit', () => {
      const qty1 = new Quantity(600000);
      const qty2 = new Quantity(500000);
      
      expect(() => qty1.add(qty2))
        .toThrow('Quantity cannot exceed 999,999 units');
    });

    it('should maintain immutability in all operations', () => {
      const original = new Quantity(10);
      const other = new Quantity(5);
      
      original.add(other);
      original.subtract(other);
      original.multiply(2);
      original.canSubtract(other);
      original.equals(other);
      original.isGreaterThan(other);
      
      expect(original.value).toBe(10);
    });
  });
});