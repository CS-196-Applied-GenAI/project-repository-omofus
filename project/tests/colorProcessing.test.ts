import { colorDistance, isWithinTolerance } from '../src/utils/colorProcessing';
import { RGB } from '../src/types';

describe('Color Processing Utils', () => {
  describe('colorDistance', () => {
    it('should return 0 for identical colors', () => {
      const color1: RGB = { r: 255, g: 100, b: 50 };
      const color2: RGB = { r: 255, g: 100, b: 50 };

      const distance = colorDistance(color1, color2);
      expect(distance).toBe(0);
    });

    it('should return normalized distance (0-1)', () => {
      const color1: RGB = { r: 255, g: 0, b: 0 }; // Red
      const color2: RGB = { r: 0, g: 0, b: 0 }; // Black

      const distance = colorDistance(color1, color2);
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThanOrEqual(1);
    });

    it('should measure maximum distance correctly', () => {
      const color1: RGB = { r: 255, g: 255, b: 255 }; // White
      const color2: RGB = { r: 0, g: 0, b: 0 }; // Black

      const distance = colorDistance(color1, color2);
      expect(distance).toBeCloseTo(1, 2);
    });
  });

  describe('isWithinTolerance', () => {
    it('should return true for identical colors', () => {
      const color1: RGB = { r: 255, g: 100, b: 50 };
      const color2: RGB = { r: 255, g: 100, b: 50 };

      const within = isWithinTolerance(color1, color2, 0.1);
      expect(within).toBe(true);
    });

    it('should return false for colors outside tolerance', () => {
      const color1: RGB = { r: 255, g: 0, b: 0 }; // Red
      const color2: RGB = { r: 0, g: 0, b: 0 }; // Black

      const within = isWithinTolerance(color1, color2, 0.1);
      expect(within).toBe(false);
    });

    it('should work with custom tolerance values', () => {
      const color1: RGB = { r: 255, g: 100, b: 50 };
      const color2: RGB = { r: 250, g: 105, b: 45 };

      // Should be within larger tolerance
      expect(isWithinTolerance(color1, color2, 0.1)).toBe(true);
      // Should not be within smaller tolerance
      expect(isWithinTolerance(color1, color2, 0.01)).toBe(false);
    });
  });
});
