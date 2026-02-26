import { query } from './connection';

export async function initializeDatabase(): Promise<void> {
  console.log('Initializing database schema...');

  // Create users table
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      username VARCHAR(255) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      avatar_url VARCHAR(500),
      country_code VARCHAR(2),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('✓ Users table created');

  // Create daily_colors table
  await query(`
    CREATE TABLE IF NOT EXISTS daily_colors (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      date DATE UNIQUE NOT NULL,
      red INT NOT NULL CHECK (red >= 0 AND red <= 255),
      green INT NOT NULL CHECK (green >= 0 AND green <= 255),
      blue INT NOT NULL CHECK (blue >= 0 AND blue <= 255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('✓ Daily colors table created');

  // Create finds table
  await query(`
    CREATE TABLE IF NOT EXISTS finds (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      daily_color_id UUID NOT NULL REFERENCES daily_colors(id) ON DELETE CASCADE,
      image_url VARCHAR(500) NOT NULL,
      score DECIMAL(10, 2) NOT NULL,
      pixel_count INT NOT NULL,
      average_distance DECIMAL(5, 4) NOT NULL,
      neighborhood VARCHAR(255),
      attempt_number INT NOT NULL CHECK (attempt_number >= 1 AND attempt_number <= 6),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('✓ Finds table created');

  // Create reactions table
  await query(`
    CREATE TABLE IF NOT EXISTS reactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      find_id UUID NOT NULL REFERENCES finds(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      reaction_type VARCHAR(10) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(find_id, user_id, reaction_type)
    )
  `);
  console.log('✓ Reactions table created');

  // Create indexes for better query performance
  await query(`
    CREATE INDEX IF NOT EXISTS idx_finds_user_id ON finds(user_id);
    CREATE INDEX IF NOT EXISTS idx_finds_daily_color_id ON finds(daily_color_id);
    CREATE INDEX IF NOT EXISTS idx_finds_created_at ON finds(created_at);
    CREATE INDEX IF NOT EXISTS idx_daily_colors_date ON daily_colors(date);
    CREATE INDEX IF NOT EXISTS idx_reactions_find_id ON reactions(find_id);
    CREATE INDEX IF NOT EXISTS idx_reactions_user_id ON reactions(user_id);
  `);
  console.log('✓ Indexes created');

  console.log('Database initialization complete!');
}

export async function dropDatabase(): Promise<void> {
  console.log('Dropping database tables...');
  await query('DROP TABLE IF EXISTS reactions CASCADE');
  await query('DROP TABLE IF EXISTS finds CASCADE');
  await query('DROP TABLE IF EXISTS daily_colors CASCADE');
  await query('DROP TABLE IF EXISTS users CASCADE');
  console.log('Database tables dropped');
}
