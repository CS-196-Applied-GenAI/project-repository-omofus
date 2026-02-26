import { Router, Request, Response } from 'express';
import { DailyColorService } from '../services/DailyColorService';
import { sendSuccess, sendError } from '../middleware/errorHandler';

const router = Router();

/**
 * GET /target
 * Get the daily color target for the user's timezone
 * Query params:
 *   - timezone_offset: hours offset from UTC (e.g., -8, 5.5)
 */
router.get('/target', async (req: Request, res: Response) => {
  try {
    const timezoneOffset = parseFloat(req.query.timezone_offset as string) || 0;

    const color = await DailyColorService.getColorForTimezone(timezoneOffset);

    sendSuccess(res, {
      id: color.id,
      date: color.date,
      rgb: {
        r: color.red,
        g: color.green,
        b: color.blue,
      },
    });
  } catch (error) {
    sendError(res, (error as Error).message, 500);
  }
});

/**
 * GET /target/history
 * Get color history for the last N days
 * Query params:
 *   - days: number of days to retrieve (default: 7)
 */
router.get('/target/history', async (req: Request, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 7;

    const colors = await DailyColorService.getColorHistory(days);

    sendSuccess(res, {
      colors: colors.map((c) => ({
        id: c.id,
        date: c.date,
        rgb: {
          r: c.red,
          g: c.green,
          b: c.blue,
        },
      })),
    });
  } catch (error) {
    sendError(res, (error as Error).message, 500);
  }
});

export default router;
