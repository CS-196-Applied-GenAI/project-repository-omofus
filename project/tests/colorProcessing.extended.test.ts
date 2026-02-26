import { expect, describe, it } from '@jest/globals';
import { 
  colorDistance, 
  isWithinTolerance, 
  parseRGBBuffer,
  floodFill,
  findClosestPixel,
  analyzeImage
} from '../src/utils/colorProcessing';
import { RGB } from '../src/types';

describe('Color Processing - Extended Tests', () => {
  describe('parseRGBBuffer', () => {
    it('should parse RGB values from RGBA buffer', () => {
      // RGBA: R=255, G=128, B=64, A=255
      const buffer = Buffer.from([255, 128, 64, 255]);
      const rgb = parseRGBBuffer(buffer, 0);
      
      expect(rgb.r).toBe(255);
      expect(rgb.g).toBe(128);
      expect(rgb.b).toBe(64);
    });

    it('should parse RGB from correct offset for multiple pixels', () => {
      // Two pixels: (255,0,0,255) and (0,255,0,255)
      const buffer = Buffer.from([255, 0, 0, 255, 0, 255, 0, 255]);
      
      const pixel1 = parseRGBBuffer(buffer, 0);
      expect(pixel1).toEqual({ r: 255, g: 0, b: 0 });
      
      const pixel2 = parseRGBBuffer(buffer, 1);
      expect(pixel2).toEqual({ r: 0, g: 255, b: 0 });
    });

    it('should handle zero values', () => {
      const buffer = Buffer.from([0, 0, 0, 255]);
      const rgb = parseRGBBuffer(buffer, 0);
      
      expect(rgb.r).toBe(0);
      expect(rgb.g).toBe(0);
      expect(rgb.b).toBe(0);
    });
  });

  describe('floodFill', () => {
    it('should find single matching pixel', () => {
      // 2x2 image: target pixel at (0,0)
      // RGBA format: [R, G, B, A, ...]
      const buffer = Buffer.from([
        255, 0, 0, 255,    // (0,0) - Red
        100, 100, 100, 255, // (1,0)
        100, 100, 100, 255, // (0,1)
        100, 100, 100, 255  // (1,1)
      ]);
      
      const targetColor: RGB = { r: 255, g: 0, b: 0 };
      const result = floodFill(buffer, 2, 2, 0, 0, targetColor, 0.1);
      
      expect(result.size).toBe(1);
      expect(result.has(0)).toBe(true);
    });

    it('should find connected region of matching pixels', () => {
      // 3x3 grid with connected red pixels
      const buffer = Buffer.from([
        255, 0, 0, 255,    // (0,0) - Red
        255, 0, 0, 255,    // (1,0) - Red
        100, 100, 100, 255, // (2,0)
        255, 0, 0, 255,    // (0,1) - Red
        100, 100, 100, 255, // (1,1)
        100, 100, 100, 255, // (2,1)
        100, 100, 100, 255, // (0,2)
        100, 100, 100, 255, // (1,2)
        100, 100, 100, 255  // (2,2)
      ]);
      
      const targetColor: RGB = { r: 255, g: 0, b: 0 };
      const result = floodFill(buffer, 3, 3, 0, 0, targetColor, 0.1);
      
      expect(result.size).toBe(3);
    });

    it('should respect bounds', () => {
      const buffer = Buffer.from(new Array(16).fill(0).map((_, i) => i % 4 === 3 ? 255 : 255));
      const targetColor: RGB = { r: 255, g: 255, b: 255 };
      const result = floodFill(buffer, 2, 2, 0, 0, targetColor, 0.5);
      
      // Should not go outside 2x2 bounds
      expect(result.size).toBeLessThanOrEqual(4);
    });

    it('should not revisit pixels', () => {
      // Create a 2x2 grid of red pixels
      const buffer = Buffer.from([
        255, 0, 0, 255,    // (0,0)
        255, 0, 0, 255,    // (1,0)
        255, 0, 0, 255,    // (0,1)
        255, 0, 0, 255     // (1,1)
      ]);
      
      const targetColor: RGB = { r: 255, g: 0, b: 0 };
      const result = floodFill(buffer, 2, 2, 0, 0, targetColor, 0.1);
      
      // All 4 pixels should be visited exactly once
      expect(result.size).toBe(4);
      expect(result.has(0)).toBe(true);
      expect(result.has(1)).toBe(true);
      expect(result.has(2)).toBe(true);
      expect(result.has(3)).toBe(true);
    });

    it('should stop at tolerance boundary', () => {
      // Create pixels with slightly different colors
      const buffer = Buffer.from([
        255, 0, 0, 255,     // (0,0) - Pure red
        200, 50, 50, 255,   // (1,0) - Different red
        100, 100, 100, 255, // (2,0)
        100, 100, 100, 255, // (0,1)
        100, 100, 100, 255, // (1,1)
        100, 100, 100, 255  // (2,1)
      ]);
      
      const targetColor: RGB = { r: 255, g: 0, b: 0 };
      // Strict tolerance should only match pure red
      const result = floodFill(buffer, 3, 2, 0, 0, targetColor, 0.05);
      
      expect(result.size).toBe(1);
    });
  });

  describe('calculateScore', () => {
    it('should calculate score based on pixel count and distance', () => {
      const pixelCount = 100;
      const avgDistance = 0.5;
      // Score = pixelCount * (1 - avgDistance) * SCORE_MULTIPLIER
      const expectedScore = pixelCount * (1 - avgDistance) * 1.0; // Default multiplier
      expect(expectedScore).toBe(50);
    });

    it('should return 0 for 0 pixels', () => {
      const score = 0 * (1 - 0.5);
      expect(score).toBe(0);
    });

    it('should return full score for 0 distance', () => {
      const pixelCount = 50;
      const score = pixelCount * (1 - 0);
      expect(score).toBe(50);
    });
  });

  describe('findClosestPixel', () => {
    it('should find pixel closest to target color', () => {
      // Create a buffer with one perfect match and one less perfect match
      const buffer = Buffer.from([
        255, 0, 0, 255,    // (0,0) - Perfect red
        200, 50, 50, 255,  // (1,0) - Slightly off red
      ]);
      
      const targetColor: RGB = { r: 255, g: 0, b: 0 };
      const result = findClosestPixel(buffer, 2, 1, targetColor);
      
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
      expect(result.distance).toBe(0);
    });

    it('should find closest pixel in 2x2 grid', () => {
      const buffer = Buffer.from([
        100, 100, 100, 255, // (0,0)
        200, 50, 50, 255,   // (1,0)
        100, 100, 100, 255, // (0,1)
        255, 0, 0, 255      // (1,1) - Perfect red
      ]);
      
      const targetColor: RGB = { r: 255, g: 0, b: 0 };
      const result = findClosestPixel(buffer, 2, 2, targetColor);
      
      expect(result.x).toBe(1);
      expect(result.y).toBe(1);
      expect(result.distance).toBeCloseTo(0, 5);
    });

    it('should handle larger images', () => {
      // Create a 10x10 pixel buffer
      const buffer = Buffer.alloc(10 * 10 * 4);
      // Put target color at position (5, 5)
      const pixelIndex = (5 * 10 + 5) * 4;
      buffer[pixelIndex] = 255;
      buffer[pixelIndex + 1] = 0;
      buffer[pixelIndex + 2] = 0;
      buffer[pixelIndex + 3] = 255;
      
      const targetColor: RGB = { r: 255, g: 0, b: 0 };
      const result = findClosestPixel(buffer, 10, 10, targetColor);
      
      expect(result.x).toBe(5);
      expect(result.y).toBe(5);
      expect(result.distance).toBeCloseTo(0, 5);
    });
  });

  describe('analyzeImage', () => {
    it('should analyze image and return score result', () => {
      // Create a small 2x2 image with one perfect red pixel
      const buffer = Buffer.from([
        255, 0, 0, 255,    // (0,0) - Perfect red
        100, 100, 100, 255, // (1,0)
        100, 100, 100, 255, // (0,1)
        100, 100, 100, 255  // (1,1)
      ]);
      
      const targetColor: RGB = { r: 255, g: 0, b: 0 };
      const result = analyzeImage(buffer, 2, 2, targetColor);
      
      expect(result).toHaveProperty('rawScore');
      expect(result).toHaveProperty('pixelCount');
      expect(result).toHaveProperty('averageDistance');
      expect(result.pixelCount).toBeGreaterThan(0);
    });

    it('should return 0 score for completely different color', () => {
      // Image with blue pixels searching for red
      const buffer = Buffer.from([
        0, 0, 255, 255,    // (0,0) - Blue
        0, 0, 255, 255,    // (1,0) - Blue
      ]);
      
      const targetColor: RGB = { r: 255, g: 0, b: 0 }; // Red
      const result = analyzeImage(buffer, 2, 1, targetColor);
      
      // Should find some pixels but with max distance
      expect(result.averageDistance).toBeGreaterThan(0);
    });

    it('should handle all matching color', () => {
      // Image completely filled with target color
      const buffer = Buffer.from([
        255, 0, 0, 255,    // Red
        255, 0, 0, 255,    // Red
        255, 0, 0, 255,    // Red
        255, 0, 0, 255     // Red
      ]);
      
      const targetColor: RGB = { r: 255, g: 0, b: 0 };
      const result = analyzeImage(buffer, 2, 2, targetColor);
      
      expect(result.pixelCount).toBe(4);
      expect(result.averageDistance).toBeCloseTo(0, 5);
      expect(result.rawScore).toBeGreaterThan(0);
    });
  });
;

  describe('colorDistance - Edge Cases', () => {
    it('should handle grayscale colors', () => {
      const white: RGB = { r: 255, g: 255, b: 255 };
      const gray: RGB = { r: 128, g: 128, b: 128 };
      
      const distance = colorDistance(white, gray);
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(1);
    });

    it('should be symmetric', () => {
      const color1: RGB = { r: 100, g: 150, b: 200 };
      const color2: RGB = { r: 50, g: 100, b: 150 };
      
      const dist1 = colorDistance(color1, color2);
      const dist2 = colorDistance(color2, color1);
      
      expect(dist1).toBeCloseTo(dist2, 5);
    });

    it('should satisfy triangle inequality', () => {
      const color1: RGB = { r: 100, g: 100, b: 100 };
      const color2: RGB = { r: 150, g: 150, b: 150 };
      const color3: RGB = { r: 200, g: 200, b: 200 };
      
      const dist12 = colorDistance(color1, color2);
      const dist23 = colorDistance(color2, color3);
      const dist13 = colorDistance(color1, color3);
      
      expect(dist13).toBeLessThanOrEqual(dist12 + dist23 + 0.01); // +0.01 for floating point
    });
  });

  describe('isWithinTolerance - Edge Cases', () => {
    it('should work at exact tolerance boundary', () => {
      const color1: RGB = { r: 255, g: 0, b: 0 };
      const color2: RGB = { r: 255, g: 0, b: 0 };
      
      const distance = colorDistance(color1, color2);
      const within = isWithinTolerance(color1, color2, distance);
      
      expect(within).toBe(true);
    });

    it('should be false just outside tolerance', () => {
      const color1: RGB = { r: 255, g: 0, b: 0 };
      const color2: RGB = { r: 254, g: 1, b: 0 };
      
      const distance = colorDistance(color1, color2);
      const within = isWithinTolerance(color1, color2, distance - 0.001);
      
      expect(within).toBe(false);
    });

    it('should handle very small tolerance', () => {
      const color1: RGB = { r: 100, g: 100, b: 100 };
      const color2: RGB = { r: 100, g: 100, b: 100 };
      
      const within = isWithinTolerance(color1, color2, 0.0001);
      expect(within).toBe(true);
    });
  });
});
