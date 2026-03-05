import { query } from '../database/connection';
import { User } from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service for user management
 */
export class UserService {
  /**
   * Create a new user
   */
  static async createUser(
    username: string,
    email: string,
    countryCode?: string,
    avatarUrl?: string
  ): Promise<User> {
    const id = uuidv4();
    const now = new Date();

    const result = await query(
      `INSERT INTO users (id, username, email, country_code, avatar_url)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id, username, email, countryCode || null, avatarUrl || null]
    );

    return this.mapRowToUser(result.rows[0]);
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string): Promise<User | null> {
    const result = await query(`SELECT * FROM users WHERE id = $1`, [userId]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToUser(result.rows[0]);
  }

  /**
   * Get user by username
   */
  static async getUserByUsername(username: string): Promise<User | null> {
    const result = await query(`SELECT * FROM users WHERE username = $1`, [username]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToUser(result.rows[0]);
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email: string): Promise<User | null> {
    const result = await query(`SELECT * FROM users WHERE email = $1`, [email]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToUser(result.rows[0]);
  }

  /**
   * Update user
   */
  static async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    const allowedFields = ['username', 'email', 'avatar_url', 'country_code'];
    const fields = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }

    if (fields.length === 0) {
      return this.getUserById(userId);
    }

    values.push(userId);
    const result = await query(
      `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToUser(result.rows[0]);
  }

  /**
   * Delete user (and cascade delete related data)
   */
  static async deleteUser(userId: string): Promise<boolean> {
    const result = await query(`DELETE FROM users WHERE id = $1`, [userId]);
    return result.rowCount > 0;
  }

  /**
   * Check if username is available
   */
  static async isUsernameAvailable(username: string): Promise<boolean> {
    const result = await query(`SELECT id FROM users WHERE username = $1`, [username]);
    return result.rows.length === 0;
  }

  /**
   * Check if email is available
   */
  static async isEmailAvailable(email: string): Promise<boolean> {
    const result = await query(`SELECT id FROM users WHERE email = $1`, [email]);
    return result.rows.length === 0;
  }

  /**
   * Map database row to User type
   */
  private static mapRowToUser(row: any): User {
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      avatar_url: row.avatar_url,
      country_code: row.country_code,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    };
  }
}
