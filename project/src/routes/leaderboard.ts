import { Router, Request, Response } from 'express';
import { LeaderboardService } from '../services/LeaderboardService';
import { sendSuccess, sendError } from '../middleware/errorHandler';

const router = Router();

/**
 * GET /leaderboard
 * Get the global leaderboard
 * Query params:
 *   - page: page number (default: 1)
 *   - limit: items per page (default: 20)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const leaderboard = await LeaderboardService.getGlobalLeaderboard(page, limit);

    sendSuccess(res, leaderboard);
  } catch (error) {
    sendError(res, (error as Error).message, 500);
  }
});

/**
 * GET /leaderboard/country/:countryCode
 * Get the leaderboard for a specific country
 * Query params:
 *   - page: page number (default: 1)
 *   - limit: items per page (default: 20)
 */
router.get('/country/:countryCode', async (req: Request, res: Response) => {
  try {
    const { countryCode } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const leaderboard = await LeaderboardService.getCountryLeaderboard(
      countryCode.toUpperCase(),
      page,
      limit
    );

    sendSuccess(res, leaderboard);
  } catch (error) {
    sendError(res, (error as Error).message, 500);
  }
});

/**
 * GET /leaderboard/daily
 * Get the daily leaderboard (top finds for today)
 * Query params:
 *   - page: page number (default: 1)
 *   - limit: items per page (default: 20)
 */
router.get('/daily', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const entries = await LeaderboardService.getDailyLeaderboard(page, limit);

    sendSuccess(res, {
      data: entries,
      pagination: {
        page,
        limit,
        total: entries.length,
      },
    });
  } catch (error) {
    sendError(res, (error as Error).message, 500);
  }
});

/**
 * GET /leaderboard/user/:userId
 * Get a user's rank and stats
 */
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const stats = await LeaderboardService.getUserStats(userId);
    const rank = await LeaderboardService.getUserGlobalRank(userId);

    if (!stats) {
      return sendError(res, 'User not found', 404);
    }

    sendSuccess(res, {
      ...stats,
      global_rank: rank,
    });
  } catch (error) {
    sendError(res, (error as Error).message, 500);
  }
});

export default router;
