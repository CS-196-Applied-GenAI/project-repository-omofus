import { query } from '../database/connection';
import { RGB, DailyColor } from '../types';
import { formatDate, getDateUTC, getDateInTimezone } from '../utils/timezone';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

/**
 * Service for managing daily color targets
 * Implements Phase 1: The "Daily Pulse"
 */
export class DailyColorService {
  /**
   * Generate a cryptographically random RGB color
   */
  private static generateRandomColor(): RGB {
    return {
      r: crypto.randomInt(0, 256),
      g: crypto.randomInt(0, 256),
      b: crypto.randomInt(0, 256),
    };
  }

  /**
   * Get or create the daily color for a specific date
   */
  static async getDailyColor(date: Date): Promise<DailyColor> {
    const dateStr = formatDate(date);

    // Try to get existing color
    const result = await query(
      `SELECT * FROM daily_colors WHERE date = $1`,
      [dateStr]
    );

    if (result.rows.length > 0) {
      return this.mapRowToColor(result.rows[0]);
    }

    // Create new color if it doesn't exist
    return this.createDailyColor(date);
  }

  /**
   * Create a new daily color for a date
   */
  private static async createDailyColor(date: Date): Promise<DailyColor> {
    const color = this.generateRandomColor();
    const dateStr = formatDate(date);
    const id = uuidv4();

    await query(
      `INSERT INTO daily_colors (id, date, red, green, blue) VALUES ($1, $2, $3, $4, $5)`,
      [id, dateStr, color.r, color.g, color.b]
    );

    return {
      id,
      date,
      red: color.r,
      green: color.g,
      blue: color.b,
      created_at: new Date(),
    };
  }

  /**
   * Get the color for the user's local date (timezone-aware)
   * @param timezoneOffset - hours offset from UTC
   */
  static async getColorForTimezone(timezoneOffset: number): Promise<DailyColor> {
    const userDate = getDateInTimezone(timezoneOffset);
    return this.getDailyColor(userDate);
  }

  /**
   * Get the current UTC color
   */
  static async getCurrentColor(): Promise<DailyColor> {
    const utcDate = getDateUTC();
    return this.getDailyColor(utcDate);
  }

  /**
   * Get color history (last N days)
   */
  static async getColorHistory(days: number = 7): Promise<DailyColor[]> {
    const result = await query(
      `SELECT * FROM daily_colors ORDER BY date DESC LIMIT $1`,
      [days]
    );

    return result.rows.map((row) => this.mapRowToColor(row));
  }

  /**
   * Map database row to DailyColor type
   */
  private static mapRowToColor(row: any): DailyColor {
    return {
      id: row.id,
      date: new Date(row.date),
      red: row.red,
      green: row.green,
      blue: row.blue,
      created_at: new Date(row.created_at),
    };
  }
}
