import { query } from '../database/connection';
import { Reaction, PaginatedResponse } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { formatDate, getDateUTC, getDateInTimezone } from '../utils/timezone';

/**
 * Service for feed and reaction management
 */
export class FeedService {
  /**
   * Get paginated feed for the current daily color
   */
  static async getFeed(page: number = 1, limit: number = 20, timezoneOffset: number = 0) {
    const offset = (page - 1) * limit;

    // Get today's date in user's timezone
    const userDate = getDateInTimezone(timezoneOffset);
    const dateStr = formatDate(userDate);

    // Get total count
    const countResult = await query(
      `SELECT COUNT(f.id) as total FROM finds f
       JOIN daily_colors dc ON f.daily_color_id = dc.id
       WHERE DATE(dc.date) = $1`,
      [dateStr]
    );
    const total = countResult.rows[0].total;

    // Get feed items
    const result = await query(
      `SELECT 
        f.id as find_id,
        f.image_url,
        f.score,
        f.neighborhood,
        f.created_at,
        u.id as user_id,
        u.username,
        u.avatar_url,
        COUNT(r.id) as reaction_count
      FROM finds f
      JOIN daily_colors dc ON f.daily_color_id = dc.id
      JOIN users u ON f.user_id = u.id
      LEFT JOIN reactions r ON f.id = r.find_id
      WHERE DATE(dc.date) = $1
      GROUP BY f.id, u.id, u.username, u.avatar_url
      ORDER BY f.score DESC
      LIMIT $2 OFFSET $3`,
      [dateStr, limit, offset]
    );

    const data = result.rows.map((row) => ({
      find_id: row.find_id,
      image_url: row.image_url,
      score: parseFloat(row.score),
      neighborhood: row.neighborhood,
      user_id: row.user_id,
      username: row.username,
      avatar_url: row.avatar_url,
      reaction_count: parseInt(row.reaction_count),
      created_at: new Date(row.created_at),
    }));

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Add a reaction to a find
   */
  static async addReaction(
    findId: string,
    userId: string,
    reactionType: string = 'like'
  ): Promise<Reaction> {
    // Prevent self-liking
    const find = await query(`SELECT user_id FROM finds WHERE id = $1`, [findId]);

    if (find.rows.length === 0) {
      throw new Error('Find not found');
    }

    if (find.rows[0].user_id === userId) {
      throw new Error('Cannot react to your own find');
    }

    const id = uuidv4();
    const now = new Date();

    try {
      const result = await query(
        `INSERT INTO reactions (id, find_id, user_id, reaction_type)
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (find_id, user_id, reaction_type) DO NOTHING
         RETURNING *`,
        [id, findId, userId, reactionType]
      );

      if (result.rows.length === 0) {
        throw new Error('Reaction already exists');
      }

      return this.mapRowToReaction(result.rows[0]);
    } catch (error) {
      console.error('Add reaction error:', error);
      throw error;
    }
  }

  /**
   * Remove a reaction
   */
  static async removeReaction(
    findId: string,
    userId: string,
    reactionType: string = 'like'
  ): Promise<boolean> {
    const result = await query(
      `DELETE FROM reactions WHERE find_id = $1 AND user_id = $2 AND reaction_type = $3`,
      [findId, userId, reactionType]
    );

    return result.rowCount > 0;
  }

  /**
   * Get reactions for a find
   */
  static async getReactions(findId: string) {
    const result = await query(
      `SELECT reaction_type, COUNT(*) as count
       FROM reactions
       WHERE find_id = $1
       GROUP BY reaction_type`,
      [findId]
    );

    const reactions: Record<string, number> = {};
    for (const row of result.rows) {
      reactions[row.reaction_type] = parseInt(row.count);
    }

    return reactions;
  }

  /**
   * Check if user has reacted to a find
   */
  static async hasUserReacted(
    findId: string,
    userId: string,
    reactionType: string = 'like'
  ): Promise<boolean> {
    const result = await query(
      `SELECT id FROM reactions 
       WHERE find_id = $1 AND user_id = $2 AND reaction_type = $3`,
      [findId, userId, reactionType]
    );

    return result.rows.length > 0;
  }

  /**
   * Get user's reactions on a find
   */
  static async getUserReactions(findId: string, userId: string): Promise<string[]> {
    const result = await query(
      `SELECT reaction_type FROM reactions 
       WHERE find_id = $1 AND user_id = $2`,
      [findId, userId]
    );

    return result.rows.map((row) => row.reaction_type);
  }

  /**
   * Map database row to Reaction type
   */
  private static mapRowToReaction(row: any): Reaction {
    return {
      id: row.id,
      find_id: row.find_id,
      user_id: row.user_id,
      reaction_type: row.reaction_type,
      created_at: new Date(row.created_at),
    };
  }
}
