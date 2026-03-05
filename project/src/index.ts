import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import * as dotenv from 'dotenv';
import { connectDatabase, closeDatabase } from './database/connection';
import { connectRedis, closeRedis } from './database/redis';
import { initializeDatabase } from './database/migrations';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Import routes
import targetRoutes from './routes/target';
import analysisRoutes from './routes/analysis';
import findsRoutes from './routes/finds';
import feedRoutes from './routes/feed';
import leaderboardRoutes from './routes/leaderboard';
import userRoutes from './routes/users';

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:3000'],
}));
app.use(express.json());
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
  });
});

// Routes
app.use('/api/target', targetRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/finds', findsRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/users', userRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handling middleware
app.use(errorHandler);

/**
 * Initialize and start server
 */
async function startServer() {
  try {
    console.log('🚀 Starting ColorHunt Backend...');

    // Connect to database
    await connectDatabase();
    console.log('✓ Database connected');

    // Initialize database schema
    await initializeDatabase();
    console.log('✓ Database schema initialized');

    // Connect to Redis
    await connectRedis();
    console.log('✓ Redis connected');

    // Start listening
    app.listen(PORT, () => {
      console.log(`✓ Server running on http://localhost:${PORT}`);
      console.log(`✓ API documentation: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

/**
 * Graceful shutdown
 */
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await closeDatabase();
  await closeRedis();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  await closeDatabase();
  await closeRedis();
  process.exit(0);
});

startServer();

export default app;
