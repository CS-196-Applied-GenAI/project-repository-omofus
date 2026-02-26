# Quick Start Guide

## 🚀 5-Minute Setup

### 1. Prerequisites Check
```bash
node --version  # Should be 16+
npm --version   # Should be 8+
psql --version  # Should be 13+
redis-cli       # Should work
```

### 2. Setup (copy-paste commands)
```bash
# Clone and install
cd project
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Initialize database
npm run migrate

# Start development server
npm run dev
```

### 3. Verify It Works
```bash
# In another terminal:
curl http://localhost:3000/health

# Should return:
# {"status":"ok","timestamp":"..."}
```

**Done!** API is running at `http://localhost:3000`

---

## 📖 Common Tasks

### Test a Specific API Endpoint

```bash
# Get today's color
curl "http://localhost:3000/api/target?timezone_offset=0"

# Create a user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com"}'

# Check global leaderboard
curl http://localhost:3000/api/leaderboard?limit=10
```

### Run Tests
```bash
npm test              # Run all tests
npm test -- --watch  # Watch mode
```

### Format Code
```bash
npm run lint         # Check code style
npm run format       # Auto-fix code
```

### Build for Production
```bash
npm run build        # Compiles TypeScript to dist/
npm start           # Run the compiled code
```

---

## 🔍 Project Structure at a Glance

```
src/
├── index.ts                 ← Main Express app
├── services/               ← Business logic
│   ├── DailyColorService.ts      (Phase 1)
│   ├── ImageAnalysisService.ts   (Phase 2)
│   ├── AttemptService.ts         (Phase 3)
│   ├── LeaderboardService.ts     (Phase 4)
│   └── ...
├── routes/                 ← API endpoints
│   ├── target.ts          (GET /api/target)
│   ├── analysis.ts        (POST /api/analysis)
│   ├── finds.ts           (POST /api/finds)
│   └── ...
├── utils/                  ← Helpers
│   ├── colorProcessing.ts (color distance, flood-fill)
│   ├── timezone.ts        (timezone logic)
│   ├── geocoding.ts       (location to neighborhood)
│   └── s3Storage.ts       (image upload)
└── database/              ← DB & Redis
    ├── connection.ts
    ├── redis.ts
    └── migrations.ts
```

---

## 🎯 What's Already Built?

### Phase 1: Daily Color ✅
- Generate random color daily
- Timezone-aware target endpoint
- Database schema for colors

### Phase 2: Image Analysis ✅
- Image preprocessing (resize)
- Color distance calculation
- Flood-fill algorithm
- Score calculation

### Phase 3: Attempt System ✅
- Redis-based daily attempt counter (max 6)
- Submission validation
- S3 image upload
- Privacy-safe neighborhood geocoding

### Phase 4: Social & Discovery ✅
- Discovery feed endpoint
- Reaction/like system
- Global leaderboard
- Country leaderboards
- User statistics

### Utilities ✅
- Color processing algorithms
- Timezone handling
- Reverse geocoding
- S3 storage integration
- User management
- Error handling

---

## ⚠️ Common Issues & Solutions

| Problem | Solution |
|---------|----------|
| `Cannot connect to PostgreSQL` | Ensure PostgreSQL is running: `sudo systemctl start postgresql` |
| `Redis connection refused` | Start Redis: `redis-server` or `sudo systemctl start redis-server` |
| `Port 3000 already in use` | Kill process: `lsof -i :3000` then `kill -9 <PID>` or change PORT in `.env` |
| `Sharp: Cannot find build tools` | Install: `xcode-select --install` (macOS) or build-essential (Linux) |
| `Out of memory` | Check NODE memory: increase with `NODE_OPTIONS=--max-old-space-size=4096` |

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| [README.md](./README.md) | Overview and architecture |
| [SETUP.md](./SETUP.md) | Installation & configuration |
| [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) | Complete API reference |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Development guidelines |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Production deployment |
| [plan.md](../plan.md) | Development roadmap |

---

## 🔧 Development Workflow

### Adding a New Feature

1. **Create service** in `src/services/`
   ```typescript
   export class MyService {
     static async myMethod(param: string): Promise<string> {
       // Implementation
     }
   }
   ```

2. **Create routes** in `src/routes/`
   ```typescript
   router.get('/path', async (req, res) => {
     const result = await MyService.myMethod(param);
     sendSuccess(res, result);
   });
   ```

3. **Write tests** in `tests/`
   ```typescript
   describe('MyService', () => {
     it('should work', () => {
       expect(result).toBe(expected);
     });
   });
   ```

4. **Test locally**
   ```bash
   npm test
   npm run lint
   npm run dev
   ```

---

## 🔑 Key Endpoints Cheat Sheet

```bash
# Get today's color
GET /api/target?timezone_offset=-8

# Analyze image
POST /api/analysis (form-data: image, timezone_offset)

# Submit a find
POST /api/finds (form-data: image, user_id, latitude, longitude)

# Browse feed
GET /api/feed?page=1&limit=20

# Check leaderboard
GET /api/leaderboard

# User profile
POST /api/users
GET /api/users/:userId
PUT /api/users/:userId
DELETE /api/users/:userId
```

---

## 📞 Need Help?

1. **Check logs**: `npm run dev` shows errors in real-time
2. **Run tests**: `npm test` validates implementations
3. **Read docs**: Start with [README.md](./README.md)
4. **Check plan**: [plan.md](../plan.md) has phase details
5. **Review code**: Look at existing services for patterns

---

## 🎓 Learning Path

1. Read [README.md](./README.md) - understand architecture
2. Read [SETUP.md](./SETUP.md) - set up environment
3. Review `src/index.ts` - understand Express setup
4. Explore `src/services/` - see how services work
5. Look at `src/routes/` - see how routes call services
6. Check `src/utils/colorProcessing.ts` - understand core algorithm
7. Run tests: `npm test` - validate understanding
8. Make small changes - get hands-on experience

---

## 🚢 Deploy & Monitor

```bash
# Build for production
npm run build

# Start production server
NODE_ENV=production npm start

# Check if working
curl http://localhost:3000/health
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full production setup.

---

**Ready to code?** Start with `npm run dev` and check [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for endpoint details! 🎉
