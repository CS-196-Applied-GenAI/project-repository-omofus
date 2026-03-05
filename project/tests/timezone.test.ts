import { expect, describe, it } from '@jest/globals';
import {
  getDateInTimezone,
  formatDate,
  isSameDay,
  parseTimezoneOffset,
} from '../src/utils/timezone';

describe('Timezone Utils', () => {
  describe('formatDate', () => {
    it('should format date as YYYY-MM-DD', () => {
      const date = new Date('2026-02-26');
      const formatted = formatDate(date);

      expect(formatted).toMatch(/\d{4}-\d{2}-\d{2}/);
      expect(formatted).toContain('2026');
    });

    it('should pad single digit months and days', () => {
      const date = new Date(2026, 0, 5); // Jan 5
      const formatted = formatDate(date);

      expect(formatted).toBe('2026-01-05');
    });
  });

  describe('isSameDay', () => {
    it('should return true for same day', () => {
      const date1 = new Date('2026-02-26T10:00:00');
      const date2 = new Date('2026-02-26T18:00:00');

      expect(isSameDay(date1, date2)).toBe(true);
    });

    it('should return false for different days', () => {
      const date1 = new Date('2026-02-26');
      const date2 = new Date('2026-02-27');

      expect(isSameDay(date1, date2)).toBe(false);
    });
  });

  describe('parseTimezoneOffset', () => {
    it('should parse positive offset', () => {
      const offset = parseTimezoneOffset('+05:30');
      expect(offset).toBe(5.5);
    });

    it('should parse negative offset', () => {
      const offset = parseTimezoneOffset('-08:00');
      expect(offset).toBe(-8);
    });

    it('should parse offset without colon', () => {
      const offset = parseTimezoneOffset('+0530');
      expect(offset).toBe(5.5);
    });

    it('should return 0 for invalid offset', () => {
      const offset = parseTimezoneOffset('invalid');
      expect(offset).toBe(0);
    });
  });
});
