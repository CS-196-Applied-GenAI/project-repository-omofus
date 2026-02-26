import { query } from '../database/connection';
import { LeaderboardEntry, PaginatedResponse } from '../types';

/**
 * Service for leaderboard and competitive features
 * Implements Phase 4: Social & Competitive Discovery
 */
export class LeaderboardService {
  /**
   * Get global leaderboard (top users by total score)
   */
  static async getGlobalLeaderboard(page: number = 1, limit: number = 20): Promise<PaginatedResponse<LeaderboardEntry>> {
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await query(`SELECT COUNT(DISTINCT user_id) as total FROM finds`);
    const total = countResult.rows[0].total;

    // Get leaderboard entries
    const result = await query(
      `SELECT 
        u.id as user_id,
        u.username,
        SUM(f.score) as total_score,
        COUNT(f.id) as find_count,
        ROW_NUMBER() OVER (ORDER BY SUM(f.score) DESC) as rank
      FROM users u
      LEFT JOIN finds f ON u.id = f.user_id
      GROUP BY u.id, u.username
      ORDER BY total_score DESC
      LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const data = result.rows.map((row) => ({
      user_id: row.user_id,
      username: row.username,
      total_score: parseFloat(row.total_score || '0'),
      current_streak: 0, // TODO: Calculate streak
      find_count: parseInt(row.find_count),
      rank: row.rank,
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
   * Get regional/country leaderboard
   */
  static async getCountryLeaderboard(
    countryCode: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<LeaderboardEntry>> {
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await query(
      `SELECT COUNT(DISTINCT u.id) as total FROM users u 
       WHERE u.country_code = $1`,
      [countryCode]
    );
    const total = countResult.rows[0].total;

    // Get leaderboard entries
    const result = await query(
      `SELECT 
        u.id as user_id,
        u.username,
        SUM(f.score) as total_score,
        COUNT(f.id) as find_count,
        ROW_NUMBER() OVER (ORDER BY SUM(f.score) DESC) as rank
      FROM users u
      LEFT JOIN finds f ON u.id = f.user_id
      WHERE u.country_code = $1
      GROUP BY u.id, u.username
      ORDER BY total_score DESC
      LIMIT $2 OFFSET $3`,
      [countryCode, limit, offset]
    );

    const data = result.rows.map((row) => ({
      user_id: row.user_id,
      username: row.username,
      total_score: parseFloat(row.total_score || '0'),
      current_streak: 0, // TODO: Calculate streak
      find_count: parseInt(row.find_count),
      rank: row.rank,
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
   * Get user's rank globally
   */
  static async getUserGlobalRank(userId: string): Promise<number> {
    const result = await query(
      `SELECT ROW_NUMBER() OVER (ORDER BY SUM(f.score) DESC) as rank
       FROM users u
       LEFT JOIN finds f ON u.id = f.user_id
       WHERE u.id = $1
       GROUP BY u.id`,
      [userId]
    );

    return result.rows.length > 0 ? result.rows[0].rank : 0;
  }

  /**
   * Get user's stats
   */
  static async getUserStats(userId: string) {
    const result = await query(
      `SELECT 
        u.id,
        u.username,
        COUNT(f.id) as find_count,
        SUM(f.score) as total_score,
        AVG(f.score) as average_score,
        MAX(f.score) as highest_score
      FROM users u
      LEFT JOIN finds f ON u.id = f.user_id
      WHERE u.id = $1
      GROUP BY u.id, u.username`,
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      user_id: row.id,
      username: row.username,
      find_count: parseInt(row.find_count),
      total_score: parseFloat(row.total_score || '0'),
      average_score: parseFloat(row.average_score || '0'),
      highest_score: parseFloat(row.highest_score || '0'),
    };
  }

  /**
   * Get daily leaderboard (top finds for today)
   */
  static async getDailyLeaderboard(page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;

    const result = await query(
      `SELECT 
        f.id as find_id,
        u.id as user_id,
        u.username,
        f.score,
        f.neighborhood,
        f.created_at,
        COUNT(r.id) as reaction_count,
        ROW_NUMBER() OVER (ORDER BY f.score DESC) as rank
      FROM finds f
      JOIN users u ON f.user_id = u.id
      LEFT JOIN reactions r ON f.id = r.find_id
      WHERE DATE(f.created_at) = CURRENT_DATE
      GROUP BY f.id, u.id, u.username
      ORDER BY f.score DESC
      LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return result.rows.map((row) => ({
      find_id: row.find_id,
      user_id: row.user_id,
      username: row.username,
      score: parseFloat(row.score),
      neighborhood: row.neighborhood,
      reaction_count: row.reaction_count,
      rank: row.rank,
      created_at: new Date(row.created_at),
    }));
  }
}
