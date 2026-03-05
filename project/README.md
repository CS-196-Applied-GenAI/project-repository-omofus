# ColorHunt Backend API

A Node.js + TypeScript backend for ColorHunt, a color matching discovery game with social features and competitive leaderboards.

## 🎯 Project Overview

ColorHunt is an innovative social discovery game where users:
- Match objects in images to a daily universal color target
- Compete on global and regional leaderboards
- Share finds and discover others' submissions
- Build streaks and unlock achievements

## 🏗️ Architecture

### Tech Stack
- **Runtime**: Node.js + TypeScript
- **API**: Express.js
- **Database**: PostgreSQL (users, finds, scores)
- **Cache**: Redis (attempt tracking, sessions)
- **Image Processing**: Sharp (resizing, buffer handling)
- **Storage**: S3-compatible object storage (image hosting)
- **Geocoding**: OpenStreetMap Photon API (privacy-safe location)

### Project Structure
```
src/
├── database/
│   ├── connection.ts      # PostgreSQL connection pool
│   ├── migrations.ts      # Schema initialization
│   └── redis.ts          # Redis client setup
├── services/
│   ├── DailyColorService.ts       # Phase 1: Universal daily color
│   ├── ImageAnalysisService.ts    # Phase 2: Color analysis & scoring
│   ├── AttemptService.ts         # Phase 3: Attempt limiting
│   ├── LeaderboardService.ts     # Phase 4: Rankings & stats
│   ├── UserService.ts            # User management
│   └── FeedService.ts            # Feed & reactions
├── routes/
│   ├── target.ts         # GET /api/target - Daily color endpoint
│   ├── analysis.ts       # POST /api/analysis - Image analysis
│   ├── finds.ts         # POST /api/finds - Submit finds
│   ├── feed.ts          # GET /api/feed - Discovery feed
│   ├── leaderboard.ts   # GET /api/leaderboard - Rankings
│   └── users.ts         # User profile endpoints
├── middleware/
│   └── errorHandler.ts   # Error & response formatting
├── utils/
│   ├── colorProcessing.ts  # Color distance, flood fill algorithm
│   ├── timezone.ts         # Timezone utilities
│   ├── geocoding.ts        # Reverse geocoding
│   └── s3Storage.ts        # S3 upload/download
└── index.ts              # Main Express app setup
```

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm
- PostgreSQL 13+
- Redis 6+
- AWS S3 or S3-compatible storage (optional for local dev)

### Installation

1. **Clone and install dependencies**
```bash
cd project
npm install
```

2. **Set up environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Initialize database**
```bash
npm run migrate
```

4. **Start development server**
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## 📚 API Endpoints

### Phase 1: Daily Color (Universal Target)

**GET /api/target**
- Get today's color target for user's timezone
- Query params: `timezone_offset` (hours from UTC)
```json
{
  "id": "uuid",
  "date": "2026-02-26",
  "rgb": { "r": 255, "g": 100, "b": 50 }
}
```

**GET /api/target/history**
- Get color history (last N days)
- Query params: `days` (default: 7)

### Phase 2: Image Analysis (Webbing Engine)

**POST /api/analysis**
- Analyze image without saving
- Body: `image` (multipart), `timezone_offset` (number)
```json
{
  "score": 1234.5,
  "pixelCount": 4500,
  "averageDistance": 0.23
}
```

### Phase 3: Submissions (Attempt System)

**POST /api/finds**
- Submit a find/image for today's color
- Max 6 attempts per day (Redis-based)
- Requires: `image`, `user_id`, `latitude`, `longitude`, `timezone_offset`
```json
{
  "find_id": "uuid",
  "score": 1234.5,
  "neighborhood": "Downtown, San Francisco",
  "attempt_number": 1
}
```

### Phase 4: Social & Discovery

**GET /api/feed**
- Paginated feed for today's color
- Query params: `page`, `limit`, `timezone_offset`

**POST /api/feed/:findId/react**
- Add reaction (like) to a find
- Body: `user_id`, `reaction_type`

**GET /api/leaderboard**
- Global leaderboard
- Query params: `page`, `limit`

**GET /api/leaderboard/country/:countryCode**
- Country-specific leaderboard

**GET /api/leaderboard/user/:userId**
- User's rank and stats

### User Management

**POST /api/users**
- Create new user
```json
{
  "username": "hunter123",
  "email": "user@example.com",
  "country_code": "US",
  "avatar_url": "https://..."
}
```

**GET /api/users/:userId**
- Get user profile

**PUT /api/users/:userId**
- Update user profile

## 🎨 Core Algorithm: Webbing Engine

The color matching algorithm implements a flood-fill approach:

1. **Preprocessing**: Resize image to 500x500 for consistent processing
2. **Find Closest**: Locate pixel closest to target color (Euclidean distance)
3. **Flood Fill**: Recursively expand region within 15% color tolerance
4. **Score Calculation**: `pixels × (1 - averageDistance) × multiplier`

This balances pixel count with color accuracy.

## 🔒 Privacy & Security

- **Geo-privacy**: Reverse geocoding returns only neighborhood/city, never exact coordinates
- **Redis attempt tracking**: Daily limits enforced per user per timezone date
- **CORS**: Configured for specified origins
- **Helmet**: Security headers enabled
- **Input validation**: All endpoints validate required fields

## 🧪 Running Tests

```bash
npm test
```

## 📦 Building for Production

```bash
npm run build
npm start
```

## 🔄 Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use production database credentials
- [ ] Configure S3 with IAM credentials
- [ ] Set JWT_SECRET to strong random value
- [ ] Enable HTTPS/TLS
- [ ] Configure CORS for frontend domains
- [ ] Set up database backups
- [ ] Configure Redis for persistence
- [ ] Set up monitoring and logging
- [ ] Test all API endpoints

## 📖 Documentation

Full API documentation is available at the `/docs` endpoint (Swagger/OpenAPI coming soon).

## 🤝 Contributing

See the plan.md file for development roadmap and phase breakdown.

## 📄 License

MIT
