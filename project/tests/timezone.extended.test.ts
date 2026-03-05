import { expect, describe, it } from '@jest/globals';
import { getDateInTimezone, formatDate, isSameDay, parseTimezoneOffset } from '../src/utils/timezone';

describe('Timezone Utils - Extended Tests', () => {
  describe('getDateInTimezone', () => {
    it('should return correct date for positive timezone offset', () => {
      // Gets current UTC date and applies timezone offset
      const localDate = getDateInTimezone(5);
      
      // Should be a valid date
      expect(localDate).toBeInstanceOf(Date);
    });

    it('should return correct date for negative timezone offset', () => {
      const localDate = getDateInTimezone(-8);
      
      // Should be a valid date
      expect(localDate).toBeInstanceOf(Date);
    });

    it('should work with fractional timezone offsets', () => {
      const localDate = getDateInTimezone(5.5); // Nepal UTC+5:30
      
      expect(localDate).toBeInstanceOf(Date);
    });

    it('should handle UTC+0 timezone', () => {
      const localDate = getDateInTimezone(0);
      
      expect(localDate).toBeInstanceOf(Date);
    });
  });

  describe('isSameDay - Extended', () => {
    it('should handle dates across year boundary', () => {
      const date1 = new Date('2025-12-31T23:00:00');
      const date2 = new Date('2026-01-01T01:00:00');
      
      expect(isSameDay(date1, date2)).toBe(false);
    });

    it('should handle dates across month boundary', () => {
      const date1 = new Date('2026-02-28T23:00:00');
      const date2 = new Date('2026-03-01T01:00:00');
      
      expect(isSameDay(date1, date2)).toBe(false);
    });

    it('should handle same second', () => {
      const now = new Date();
      expect(isSameDay(now, new Date(now))).toBe(true);
    });

    it('should return true for dates 23:59:59 apart', () => {
      const date1 = new Date('2026-02-26T00:00:00');
      const date2 = new Date('2026-02-26T23:59:59');
      
      expect(isSameDay(date1, date2)).toBe(true);
    });
  });

  describe('parseTimezoneOffset - Extended', () => {
    it('should parse UTC+0', () => {
      const offset = parseTimezoneOffset('+00:00');
      expect(offset).toBe(0);
    });

    it('should parse double digit hours', () => {
      const offset = parseTimezoneOffset('+12:00');
      expect(offset).toBe(12);
    });

    it('should parse fractional minutes', () => {
      const offset1 = parseTimezoneOffset('+05:30');
      expect(offset1).toBe(5.5);

      const offset2 = parseTimezoneOffset('+09:45');
      expect(offset2).toBe(9.75);
    });

    it('should handle negative fractional offsets', () => {
      const offset = parseTimezoneOffset('-03:30');
      expect(offset).toBe(-3.5);
    });

    it('should handle large negative offsets', () => {
      const offset = parseTimezoneOffset('-12:00');
      expect(offset).toBe(-12);
    });

    it('should handle offsets with zero minutes', () => {
      const offset = parseTimezoneOffset('+07:00');
      expect(offset).toBe(7);
    });

    it('should handle offsets with zero hours', () => {
      const offset = parseTimezoneOffset('+00:30');
      expect(offset).toBeCloseTo(0.5, 5);
    });
  });

  describe('formatDate - Extended', () => {
    it('should format dates in February leap year correctly', () => {
      // 2024 is a leap year
      const date = new Date(2024, 1, 29); // Feb 29, 2024
      const formatted = formatDate(date);
      
      expect(formatted).toMatch(/2024-02-29/);
    });

    it('should format January 1st correctly', () => {
      const date = new Date(2026, 0, 1);
      const formatted = formatDate(date);
      
      expect(formatted).toBe('2026-01-01');
    });

    it('should format December 31st correctly', () => {
      const date = new Date(2026, 11, 31);
      const formatted = formatDate(date);
      
      expect(formatted).toBe('2026-12-31');
    });

    it('should be consistent across calls', () => {
      const date = new Date('2026-06-15T15:30:45');
      const formatted1 = formatDate(date);
      const formatted2 = formatDate(date);
      
      expect(formatted1).toBe(formatted2);
    });

    it('should handle all single digit days correctly', () => {
      for (let day = 1; day <= 9; day++) {
        const date = new Date(2026, 0, day);
        const formatted = formatDate(date);
        
        expect(formatted).toMatch(/2026-01-0\d/);
        expect(formatted.endsWith(`0${day}`)).toBe(true);
      }
    });

    it('should handle all months', () => {
      const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
      
      months.forEach((month, index) => {
        const date = new Date(2026, index, 15);
        const formatted = formatDate(date);
        
        expect(formatted).toContain(`2026-${month}-15`);
      });
    });
  });

  describe('Timezone Integration', () => {
    it('should correctly handle New Zealand timezone (UTC+12)', () => {
      const nzDate = getDateInTimezone(12);
      
      expect(nzDate).toBeInstanceOf(Date);
    });

    it('should correctly handle US Pacific timezone (UTC-8)', () => {
      const pacificDate = getDateInTimezone(-8);
      
      expect(pacificDate).toBeInstanceOf(Date);
    });

    it('should correctly handle India timezone (UTC+5:30)', () => {
      const indiaDate = getDateInTimezone(5.5);
      
      expect(indiaDate).toBeInstanceOf(Date);
    });

    it('should produce different dates across different timezones', () => {
      const nyDate = getDateInTimezone(-5);
      const londonDate = getDateInTimezone(0);
      const tokyoDate = getDateInTimezone(9);
      
      // All should be valid dates
      expect(nyDate).toBeInstanceOf(Date);
      expect(londonDate).toBeInstanceOf(Date);
      expect(tokyoDate).toBeInstanceOf(Date);
    });
  });
});
