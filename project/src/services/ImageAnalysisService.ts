import sharp from 'sharp';
import { RGB, ScoreResult } from '../types';
import { analyzeImage } from '../utils/colorProcessing';

const MAX_IMAGE_SIZE = 50 * 1024 * 1024; // 50MB
const RESIZE_WIDTH = 500;
const RESIZE_HEIGHT = 500;

/**
 * Service for image processing and color analysis
 * Implements Phase 2: The "Webbing" Engine
 */
export class ImageAnalysisService {
  /**
   * Validate and preprocess image
   */
  static async preprocessImage(imageBuffer: Buffer): Promise<Buffer> {
    // Validate size
    if (imageBuffer.length > MAX_IMAGE_SIZE) {
      throw new Error(`Image size exceeds maximum of ${MAX_IMAGE_SIZE} bytes`);
    }

    try {
      // Resize to standard dimensions for consistent processing
      const metadata = await sharp(imageBuffer).metadata();

      if (!metadata.width || !metadata.height) {
        throw new Error('Invalid image file');
      }

      // Downsample to consistent size
      const resized = await sharp(imageBuffer)
        .resize(RESIZE_WIDTH, RESIZE_HEIGHT, {
          fit: 'cover',
          position: 'center',
        })
        .toBuffer();

      return resized;
    } catch (error) {
      console.error('Image preprocessing error:', error);
      throw new Error('Failed to process image');
    }
  }

  /**
   * Extract raw RGBA pixel data from image
   */
  static async extractPixelData(
    imageBuffer: Buffer
  ): Promise<{
    data: Buffer;
    width: number;
    height: number;
  }> {
    try {
      const { data, info } = await sharp(imageBuffer)
        .raw()
        .toBuffer({ resolveWithObject: true });

      return {
        data,
        width: info.width,
        height: info.height,
      };
    } catch (error) {
      console.error('Pixel extraction error:', error);
      throw new Error('Failed to extract pixel data');
    }
  }

  /**
   * Analyze image and calculate score for target color
   */
  static async analyzeForColor(
    imageBuffer: Buffer,
    targetColor: RGB
  ): Promise<ScoreResult> {
    try {
      // Preprocess image
      const preprocessed = await this.preprocessImage(imageBuffer);

      // Extract pixel data
      const { data, width, height } = await this.extractPixelData(preprocessed);

      // Analyze and calculate score
      const result = analyzeImage(data, width, height, targetColor);

      return result;
    } catch (error) {
      console.error('Image analysis error:', error);
      throw error;
    }
  }

  /**
   * Get image metadata
   */
  static async getImageMetadata(imageBuffer: Buffer) {
    try {
      const metadata = await sharp(imageBuffer).metadata();
      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        colorspace: metadata.space,
        hasAlpha: metadata.hasAlpha,
      };
    } catch (error) {
      console.error('Metadata extraction error:', error);
      throw new Error('Failed to extract image metadata');
    }
  }

  /**
   * Generate thumbnail
   */
  static async generateThumbnail(imageBuffer: Buffer, size: number = 200): Promise<Buffer> {
    try {
      const thumbnail = await sharp(imageBuffer)
        .resize(size, size, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality: 80 })
        .toBuffer();

      return thumbnail;
    } catch (error) {
      console.error('Thumbnail generation error:', error);
      throw new Error('Failed to generate thumbnail');
    }
  }
}
