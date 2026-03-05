# ColorHunt Backend - Setup Guide

## Prerequisites

- **Node.js**: v16 or higher
  - Download from https://nodejs.org/
  - Verify: `node --version` and `npm --version`

- **PostgreSQL**: v13 or higher
  - Download from https://www.postgresql.org/download/
  - Verify: `psql --version`

- **Redis**: v6 or higher
  - Download from https://redis.io/download
  - Or use Docker: `docker pull redis:7-alpine`

## Installation Steps

### 1. Environment Setup

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` with your local configuration:
```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=colorhunt_user
DATABASE_PASSWORD=your_password
DATABASE_NAME=colorhunt

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# API
PORT=3000
NODE_ENV=development
```

### 2. Database Setup

#### Option A: Using Docker (Recommended)

```bash
docker-compose up -d
```

This starts PostgreSQL and Redis in containers.

#### Option B: Manual Installation

**PostgreSQL:**
```bash
# macOS
brew install postgresql
brew services start postgresql

# Ubuntu/Debian
sudo apt-get install postgresql
sudo systemctl start postgresql

# Windows
# Download and run PostgreSQL installer
```

Create the database and user:
```bash
psql -U postgres

postgres=# CREATE USER colorhunt_user WITH PASSWORD 'password';
postgres=# CREATE DATABASE colorhunt OWNER colorhunt_user;
postgres=# \q
```

**Redis:**
```bash
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis-server

# Windows
# Download from https://github.com/microsoftarchive/redis/releases
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Initialize Database

Create tables and indexes:
```bash
npm run migrate
```

Expected output:
```
✓ Users table created
✓ Daily colors table created
✓ Finds table created
✓ Reactions table created
✓ Indexes created
Database initialization complete!
```

### 5. Start Development Server

```bash
npm run dev
```

Expected output:
```
🚀 Starting ColorHunt Backend...
✓ Database connected
✓ Database schema initialized
✓ Redis connected
✓ Server running on http://localhost:3000
```

## Verification

### Test Database Connection
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-02-26T..."
}
```

### Test Target Endpoint
```bash
curl "http://localhost:3000/api/target?timezone_offset=0"
```

Expected response:
```json
{
  "success": true,
  "data": {
    "id": "uuid...",
    "date": "2026-02-26",
    "rgb": {
      "r": 123,
      "g": 45,
      "b": 67
    }
  },
  "timestamp": "2026-02-26T..."
}
```

## Available Commands

```bash
# Development
npm run dev          # Start with hot reload

# Build & Run
npm run build        # Compile TypeScript to JavaScript
npm start           # Run compiled JavaScript

# Code Quality
npm run lint        # Check code style
npm run format      # Auto-format code with Prettier

# Testing
npm test            # Run test suite
npm test -- --coverage  # With coverage report

# Database
npm run migrate     # Initialize/reset database schema
```

## Docker Setup (All-in-One)

For a complete containerized setup:

1. Create a `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

2. Update `docker-compose.yml` to include app service
3. Run: `docker-compose up -d`

## Troubleshooting

### "Cannot connect to PostgreSQL"
- Ensure PostgreSQL is running: `sudo systemctl status postgresql`
- Check credentials in `.env`
- Verify port 5432 is accessible: `netstat -an | grep 5432`

### "Cannot connect to Redis"
- Ensure Redis is running: `redis-cli ping`
- Check Redis port in `.env` (default: 6379)

### "Port 3000 already in use"
- Change PORT in `.env`
- Or kill process: `lsof -i :3000` then `kill -9 <PID>`

### "npm install fails"
- Clear cache: `npm cache clean --force`
- Delete `node_modules` and `package-lock.json`
- Reinstall: `npm install`

### "Sharp image library issues"
Sharp requires native build tools:
```bash
# macOS
xcode-select --install

# Ubuntu/Debian
sudo apt-get install build-essential python3

# Windows
# Download Visual Studio Build Tools
```

## S3 Configuration (Optional)

For image uploads to S3:

1. Create AWS account and get credentials
2. Create S3 bucket
3. Add to `.env`:
```env
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET=your-bucket-name
AWS_REGION=us-east-1
```

For local development with S3 mock:
```bash
npm install --save-dev @aws-sdk/client-s3-mock
```

## Next Steps

- Read [README.md](./README.md) for API documentation
- Check [plan.md](./plan.md) for development roadmap
- Review [CONTRIBUTING.md](./CONTRIBUTING.md) for code guidelines
- Set up git pre-commit hooks for linting

## Support

For issues or questions:
1. Check existing documentation
2. Review error logs in console
3. Check database logs: `sudo tail -f /var/log/postgresql/postgresql.log`
4. Check Redis logs: `redis-cli monitor`
