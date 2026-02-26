import { getRedisClient } from '../database/redis';
import { query } from '../database/connection';
import { Find, DailyColor } from '../types';
import { formatDate, getDateInTimezone, getDateUTC } from '../utils/timezone';
import { v4 as uuidv4 } from 'uuid';
import { uploadToS3 } from '../utils/s3Storage';
import { getPrivateSafeNeighborhood } from '../utils/geocoding';

const MAX_ATTEMPTS = parseInt(process.env.MAX_DAILY_ATTEMPTS || '6');
const MINIMUM_SCORE_THRESHOLD = 10; // Minimum score to qualify as a valid submission

/**
 * Service for managing daily attempts
 * Implements Phase 3: The "Attempt" System
 */
export class AttemptService {
  /**
   * Get the Redis key for attempt counter
   */
  private static getAttemptKey(userId: string, date: Date): string {
    const dateStr = formatDate(date);
    return `attempts:${userId}:${dateStr}`;
  }

  /**
   * Check how many attempts a user has left for the day
   */
  static async getAttemptsRemaining(userId: string, timezoneOffset: number): Promise<number> {
    const userDate = getDateInTimezone(timezoneOffset);
    const key = this.getAttemptKey(userId, userDate);

    const redis = getRedisClient();
    const count = await redis.get(key);
    const attemptCount = count ? parseInt(count) : 0;

    return Math.max(0, MAX_ATTEMPTS - attemptCount);
  }

  /**
   * Increment attempt counter
   */
  static async incrementAttempt(userId: string, timezoneOffset: number): Promise<void> {
    const userDate = getDateInTimezone(timezoneOffset);
    const key = this.getAttemptKey(userId, userDate);

    const redis = getRedisClient();

    // Increment counter
    await redis.incr(key);

    // Set expiration to 24 hours if first attempt
    const ttl = await redis.ttl(key);
    if (ttl === -1) {
      await redis.expire(key, 86400); // 24 hours
    }
  }

  /**
   * Check if user can make another attempt
   */
  static async canMakeAttempt(userId: string, timezoneOffset: number): Promise<boolean> {
    const remaining = await this.getAttemptsRemaining(userId, timezoneOffset);
    return remaining > 0;
  }

  /**
   * Save a find/submission
   */
  static async saveFindSubmission(
    userId: string,
    imageBuffer: Buffer,
    imageKey: string,
    score: number,
    pixelCount: number,
    averageDistance: number,
    latitude: number,
    longitude: number,
    dailyColorId: string,
    timezoneOffset: number
  ): Promise<Find> {
    // Validate score
    if (score < MINIMUM_SCORE_THRESHOLD) {
      throw new Error(`Score ${score} below minimum threshold of ${MINIMUM_SCORE_THRESHOLD}`);
    }

    // Check attempts remaining
    const canAttempt = await this.canMakeAttempt(userId, timezoneOffset);
    if (!canAttempt) {
      throw new Error('No attempts remaining for today');
    }

    try {
      // Upload image to S3
      const imageUrl = await uploadToS3(imageKey, imageBuffer, 'image/jpeg');

      // Get neighborhood (privacy-safe)
      const neighborhood = await getPrivateSafeNeighborhood(latitude, longitude);

      // Get attempt number
      const userDate = getDateInTimezone(timezoneOffset);
      const attemptKey = this.getAttemptKey(userId, userDate);
      const redis = getRedisClient();
      const currentCount = await redis.get(attemptKey);
      const attemptNumber = currentCount ? parseInt(currentCount) + 1 : 1;

      // Increment attempt counter
      await this.incrementAttempt(userId, timezoneOffset);

      // Save to database
      const findId = uuidv4();
      const result = await query(
        `INSERT INTO finds (
          id, user_id, daily_color_id, image_url, score, pixel_count, 
          average_distance, neighborhood, attempt_number
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [
          findId,
          userId,
          dailyColorId,
          imageUrl,
          score,
          pixelCount,
          averageDistance,
          neighborhood,
          attemptNumber,
        ]
      );

      return this.mapRowToFind(result.rows[0]);
    } catch (error) {
      console.error('Save find submission error:', error);
      throw error;
    }
  }

  /**
   * Map database row to Find type
   */
  private static mapRowToFind(row: any): Find {
    return {
      id: row.id,
      user_id: row.user_id,
      daily_color_id: row.daily_color_id,
      image_url: row.image_url,
      score: row.score,
      pixel_count: row.pixel_count,
      average_distance: row.average_distance,
      neighborhood: row.neighborhood,
      attempt_number: row.attempt_number,
      created_at: new Date(row.created_at),
    };
  }
}
