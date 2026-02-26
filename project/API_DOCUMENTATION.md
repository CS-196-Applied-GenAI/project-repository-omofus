# ColorHunt API Documentation

## Overview

The ColorHunt API is a RESTful service for a color-matching discovery game with social features. All endpoints return JSON responses with consistent formatting.

## API Base URL

```
http://localhost:3000/api
```

## Authentication

Currently, authentication is handled via `user_id` in request bodies or query parameters. Production deployment should implement JWT tokens.

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {},
  "timestamp": "2026-02-26T10:30:00Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message describing what went wrong",
  "timestamp": "2026-02-26T10:30:00Z"
}
```

## Endpoints

### 1. Daily Color (Phase 1)

#### GET /target
Get the daily color target for the user's timezone.

**Query Parameters:**
- `timezone_offset` (number, optional): Hours offset from UTC (e.g., -8 for PST, 5.5 for IST)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "date": "2026-02-26",
    "rgb": {
      "r": 255,
      "g": 127,
      "b": 80
    }
  }
}
```

**Status Codes:**
- `200 OK`: Successfully retrieved color

---

#### GET /target/history
Get color history for the last N days.

**Query Parameters:**
- `days` (number, optional): Number of days to retrieve (default: 7)

**Response:**
```json
{
  "success": true,
  "data": {
    "colors": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "date": "2026-02-26",
        "rgb": { "r": 255, "g": 127, "b": 80 }
      }
    ]
  }
}
```

**Status Codes:**
- `200 OK`: Successfully retrieved history

---

### 2. Image Analysis (Phase 2)

#### POST /analysis
Analyze an image without saving it to check the score.

**Form Data:**
- `image` (file, required): Image file (JPEG, PNG)
- `timezone_offset` (number, optional): Hours offset from UTC

**Response:**
```json
{
  "success": true,
  "data": {
    "score": 1234.56,
    "pixelCount": 4500,
    "averageDistance": 0.23,
    "targetColor": {
      "r": 255,
      "g": 127,
      "b": 80
    }
  }
}
```

**Status Codes:**
- `200 OK`: Analysis completed
- `400 Bad Request`: No image provided

---

#### POST /analysis/metadata
Get metadata about an image without analysis.

**Form Data:**
- `image` (file, required): Image file

**Response:**
```json
{
  "success": true,
  "data": {
    "metadata": {
      "width": 1920,
      "height": 1080,
      "format": "jpeg",
      "colorspace": "srgb",
      "hasAlpha": false
    }
  }
}
```

**Status Codes:**
- `200 OK`: Metadata retrieved
- `400 Bad Request`: Invalid image

---

### 3. Submissions (Phase 3)

#### POST /finds
Submit a find (image for today's color). Max 6 attempts per day.

**Form Data:**
- `image` (file, required): Image to submit
- `user_id` (string, required): UUID of the user
- `latitude` (number, required): Location latitude
- `longitude` (number, required): Location longitude
- `timezone_offset` (number, optional): Hours offset from UTC

**Response:**
```json
{
  "success": true,
  "data": {
    "find_id": "550e8400-e29b-41d4-a716-446655440000",
    "score": 1234.56,
    "pixel_count": 4500,
    "neighborhood": "Downtown, San Francisco",
    "attempt_number": 1,
    "image_url": "https://s3.amazonaws.com/..."
  },
  "timestamp": "2026-02-26T10:30:00Z"
}
```

**Status Codes:**
- `201 Created`: Find submitted successfully
- `400 Bad Request`: Missing fields or score below threshold
- `429 Too Many Requests`: Daily attempt limit exceeded

---

#### GET /finds/:findId
Get details of a specific find.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "...",
    "score": 1234.56,
    "neighborhood": "Downtown, San Francisco",
    "image_url": "...",
    "created_at": "2026-02-26T10:30:00Z"
  }
}
```

**Status Codes:**
- `200 OK`: Find retrieved
- `404 Not Found`: Find does not exist

---

#### GET /finds/user/:userId
Get all finds for a user.

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "score": 1234.56,
      "neighborhood": "...",
      "image_url": "..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "pages": 3
  }
}
```

**Status Codes:**
- `200 OK`: User finds retrieved

---

### 4. Discovery Feed (Phase 4)

#### GET /feed
Get paginated feed for today's color.

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)
- `timezone_offset` (number, optional): Hours offset from UTC

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "find_id": "550e8400-e29b-41d4-a716-446655440000",
        "image_url": "https://...",
        "score": 1234.56,
        "neighborhood": "Downtown, San Francisco",
        "user_id": "...",
        "username": "hunter123",
        "avatar_url": "https://...",
        "reaction_count": 42,
        "created_at": "2026-02-26T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

**Status Codes:**
- `200 OK`: Feed retrieved

---

#### POST /feed/:findId/react
Add a reaction (like) to a find.

**Body:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "reaction_type": "like"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "reaction_id": "550e8400-e29b-41d4-a716-446655440000",
    "message": "Reaction added"
  }
}
```

**Status Codes:**
- `201 Created`: Reaction added
- `400 Bad Request`: Cannot react to own find
- `404 Not Found`: Find does not exist

---

#### DELETE /feed/:findId/react/:reactionType
Remove a reaction from a find.

**Query Parameters:**
- `user_id` (string, required): UUID of the user

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Reaction removed"
  }
}
```

**Status Codes:**
- `200 OK`: Reaction removed
- `404 Not Found`: Reaction does not exist

---

#### GET /feed/:findId/reactions
Get all reactions for a find.

**Response:**
```json
{
  "success": true,
  "data": {
    "find_id": "550e8400-e29b-41d4-a716-446655440000",
    "reactions": {
      "like": 42,
      "love": 10
    }
  }
}
```

**Status Codes:**
- `200 OK`: Reactions retrieved

---

### 5. Leaderboards

#### GET /leaderboard
Get the global leaderboard.

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "user_id": "550e8400-e29b-41d4-a716-446655440000",
        "username": "hunter123",
        "total_score": 50000,
        "current_streak": 15,
        "find_count": 75,
        "rank": 1
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1234,
      "pages": 62
    }
  }
}
```

**Status Codes:**
- `200 OK`: Leaderboard retrieved

---

#### GET /leaderboard/country/:countryCode
Get leaderboard for a specific country.

**Path Parameters:**
- `countryCode` (string): ISO 3166-1 alpha-2 country code (e.g., "US", "GB")

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)

**Response:** Same as global leaderboard

**Status Codes:**
- `200 OK`: Country leaderboard retrieved

---

#### GET /leaderboard/daily
Get the daily leaderboard (top finds for today).

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "find_id": "...",
        "user_id": "...",
        "username": "hunter123",
        "score": 1500.50,
        "neighborhood": "Downtown, NYC",
        "reaction_count": 45,
        "rank": 1,
        "created_at": "2026-02-26T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150
    }
  }
}
```

**Status Codes:**
- `200 OK`: Daily leaderboard retrieved

---

#### GET /leaderboard/user/:userId
Get a user's rank and statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "hunter123",
    "find_count": 75,
    "total_score": 50000,
    "average_score": 666.67,
    "highest_score": 2500,
    "global_rank": 1
  }
}
```

**Status Codes:**
- `200 OK`: User stats retrieved
- `404 Not Found`: User does not exist

---

### 6. User Management

#### POST /users
Create a new user account.

**Body:**
```json
{
  "username": "hunter123",
  "email": "user@example.com",
  "country_code": "US",
  "avatar_url": "https://..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "hunter123",
    "email": "user@example.com",
    "country_code": "US",
    "avatar_url": "https://...",
    "created_at": "2026-02-26T10:30:00Z"
  }
}
```

**Status Codes:**
- `201 Created`: User created successfully
- `400 Bad Request`: Username or email already taken

---

#### GET /users/:userId
Get user profile.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "hunter123",
    "email": "user@example.com",
    "country_code": "US",
    "avatar_url": "https://...",
    "created_at": "2026-02-26T10:30:00Z",
    "updated_at": "2026-02-26T10:30:00Z"
  }
}
```

**Status Codes:**
- `200 OK`: User retrieved
- `404 Not Found`: User does not exist

---

#### GET /users/username/:username
Get user by username.

**Response:** Same as GET /users/:userId

**Status Codes:**
- `200 OK`: User retrieved
- `404 Not Found`: User does not exist

---

#### PUT /users/:userId
Update user profile.

**Body:**
```json
{
  "username": "newhunter123",
  "country_code": "CA",
  "avatar_url": "https://..."
}
```

**Response:** Updated user object (same format as GET /users/:userId)

**Status Codes:**
- `200 OK`: User updated
- `404 Not Found`: User does not exist

---

#### DELETE /users/:userId
Delete user account (deletes all associated data).

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "User deleted successfully"
  }
}
```

**Status Codes:**
- `200 OK`: User deleted
- `404 Not Found`: User does not exist

---

## Error Codes

| Code | Message | Action |
|------|---------|--------|
| 400  | Bad Request | Check request format and required fields |
| 404  | Not Found | Resource does not exist |
| 500  | Internal Server Error | Server error - retry later |

## Rate Limiting

Currently no rate limiting is implemented. For production:
- Implement rate limiting on all endpoints
- Stricter limits on image upload endpoints
- Daily attempt limits enforced via Redis

## Pagination

Paginated endpoints follow this format:

**Request:**
```
GET /api/leaderboard?page=2&limit=50
```

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 50,
    "total": 1234,
    "pages": 25
  }
}
```

## Examples

### Example 1: User Flow
```bash
# 1. Create user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "colorhunter",
    "email": "hunter@example.com",
    "country_code": "US"
  }'

# 2. Get today's color (PST: UTC-8)
curl "http://localhost:3000/api/target?timezone_offset=-8"

# 3. Analyze an image
curl -X POST http://localhost:3000/api/analysis \
  -F "image=@photo.jpg" \
  -F "timezone_offset=-8"

# 4. Submit a find
curl -X POST http://localhost:3000/api/finds \
  -F "image=@photo.jpg" \
  -F "user_id=550e8400-e29b-41d4-a716-446655440000" \
  -F "latitude=37.7749" \
  -F "longitude=-122.4194" \
  -F "timezone_offset=-8"

# 5. View the feed
curl "http://localhost:3000/api/feed?timezone_offset=-8&page=1&limit=20"

# 6. Check leaderboard
curl "http://localhost:3000/api/leaderboard"
```

---

## WebSocket Support (Future)

Real-time features for future implementation:
- Live feed updates
- Leaderboard changes
- Reaction notifications
- Attempt counter updates
