// User types
export interface User {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  country_code?: string;
  created_at: Date;
  updated_at: Date;
}

// Daily color types
export interface DailyColor {
  id: string;
  date: Date;
  red: number;
  green: number;
  blue: number;
  created_at: Date;
}

// Find/submission types
export interface Find {
  id: string;
  user_id: string;
  daily_color_id: string;
  image_url: string;
  score: number;
  pixel_count: number;
  average_distance: number;
  neighborhood: string;
  attempt_number: number;
  created_at: Date;
}

// RGB type
export interface RGB {
  r: number;
  g: number;
  b: number;
}

// Score calculation result
export interface ScoreResult {
  rawScore: number;
  pixelCount: number;
  averageDistance: number;
}

// Leaderboard entry
export interface LeaderboardEntry {
  user_id: string;
  username: string;
  total_score: number;
  current_streak: number;
  find_count: number;
  rank: number;
}

// Reaction/like types
export interface Reaction {
  id: string;
  find_id: string;
  user_id: string;
  reaction_type: string; // emoji or like
  created_at: Date;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
