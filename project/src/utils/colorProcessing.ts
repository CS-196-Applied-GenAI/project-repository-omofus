import { RGB, ScoreResult } from '../types';

const COLOR_TOLERANCE = parseFloat(process.env.COLOR_TOLERANCE_PERCENTAGE || '15') / 100;
const SCORE_MULTIPLIER = parseFloat(process.env.SCORE_MULTIPLIER || '1.0');

/**
 * Calculate Euclidean distance between two RGB colors
 * Returns normalized distance (0-1, where 1 is maximum possible distance)
 */
export function colorDistance(color1: RGB, color2: RGB): number {
  const rDiff = color1.r - color2.r;
  const gDiff = color1.g - color2.g;
  const bDiff = color1.b - color2.b;

  const distance = Math.sqrt(rDiff * rDiff + gDiff * gDiff + bDiff * bDiff);
  // Maximum possible distance is sqrt(3 * 255^2) = ~441.67
  return distance / 441.67;
}

/**
 * Check if a pixel is within tolerance threshold of target color
 */
export function isWithinTolerance(pixel: RGB, target: RGB, tolerance: number) {
  return colorDistance(pixel, target) <= tolerance;
}

/**
 * Parse RGB buffer from image data
 * Expects a Buffer of pixel data in RGBA format (4 bytes per pixel)
 */
export function parseRGBBuffer(data: Buffer, pixelIndex: number): RGB {
  const offset = pixelIndex * 4; // RGBA = 4 bytes per pixel
  return {
    r: data[offset],
    g: data[offset + 1],
    b: data[offset + 2],
  };
}

/**
 * Flood fill algorithm to find connected pixels matching target color
 * Returns array of pixel indices that are part of the matching region
 */
export function floodFill(
  imageData: Buffer,
  width: number,
  height: number,
  startX: number,
  startY: number,
  targetColor: RGB,
  tolerance: number
): Set<number> {
  const visited = new Set<number>();
  const queue: Array<{ x: number; y: number }> = [{ x: startX, y: startY }];
  const matchingPixels = new Set<number>();

  while (queue.length > 0) {
    const { x, y } = queue.shift()!;

    // Bounds checking
    if (x < 0 || x >= width || y < 0 || y >= height) continue;

    const pixelIndex = y * width + x;
    if (visited.has(pixelIndex)) continue;

    visited.add(pixelIndex);

    // Get pixel color
    const pixelColor = parseRGBBuffer(imageData, pixelIndex);

    // Check if within tolerance
    if (isWithinTolerance(pixelColor, targetColor, tolerance)) {
      matchingPixels.add(pixelIndex);

      // Add neighbors to queue (4-connectivity)
      queue.push({ x: x + 1, y });
      queue.push({ x: x - 1, y });
      queue.push({ x, y: y + 1 });
      queue.push({ x, y: y - 1 });
    }
  }

  return matchingPixels;
}

/**
 * Find the pixel closest to target color in the image
 * Returns { x, y, distance }
 */
export function findClosestPixel(
  imageData: Buffer,
  width: number,
  height: number,
  targetColor: RGB
): { x: number; y: number; distance: number } {
  let closestPixel = { x: 0, y: 0, distance: 1 };

  for (let i = 0; i < imageData.length; i += 4) {
    const pixelIndex = i / 4;
    const x = pixelIndex % width;
    const y = Math.floor(pixelIndex / width);

    const pixelColor = parseRGBBuffer(imageData, pixelIndex);
    const distance = colorDistance(pixelColor, targetColor);

    if (distance < closestPixel.distance) {
      closestPixel = { x, y, distance };
    }
  }

  return closestPixel;
}

/**
 * Analyze image and calculate score based on matching pixels
 * Returns pixel count, average distance, and final score
 */
export function analyzeImage(
  imageData: Buffer,
  width: number,
  height: number,
  targetColor: RGB
): ScoreResult {
  // Find the closest pixel to start flood fill
  const startPixel = findClosestPixel(imageData, width, height, targetColor);

  // Perform flood fill with tolerance
  const matchingPixels = floodFill(
    imageData,
    width,
    height,
    startPixel.x,
    startPixel.y,
    targetColor,
    COLOR_TOLERANCE
  );

  // Calculate average distance of matching pixels
  let totalDistance = 0;
  for (const pixelIndex of matchingPixels) {
    const pixelColor = parseRGBBuffer(imageData, pixelIndex);
    totalDistance += colorDistance(pixelColor, targetColor);
  }

  const pixelCount = matchingPixels.size;
  const averageDistance = pixelCount > 0 ? totalDistance / pixelCount : 1;

  // Score formula: pixels × (1 - averageDistance) × multiplier
  const rawScore = pixelCount * (1 - averageDistance) * SCORE_MULTIPLIER;

  return {
    rawScore,
    pixelCount,
    averageDistance,
  };
}
