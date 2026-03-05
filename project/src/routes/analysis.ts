import { Router, Request, Response } from 'express';
import multer from 'multer';
import { ImageAnalysisService } from '../services/ImageAnalysisService';
import { DailyColorService } from '../services/DailyColorService';
import { AttemptService } from '../services/AttemptService';
import { sendSuccess, sendError } from '../middleware/errorHandler';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

/**
 * POST /api/analysis
 * Analyze an image for the target color. Counts against the daily attempt limit.
 * Body:
 *   - image: multipart/form-data file
 *   - user_id: UUID of the user
 *   - timezone_offset: hours offset from UTC
 */
router.post('/', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return sendError(res, 'No image provided', 400);
    }

    const { user_id, timezone_offset } = req.body;

    if (!user_id) {
      return sendError(res, 'Missing required field: user_id', 400);
    }

    const timezoneOffset = parseFloat(timezone_offset) || 0;

    // Check attempt limit BEFORE doing any expensive processing
    const canAttempt = await AttemptService.canMakeAttempt(user_id, timezoneOffset);
    if (!canAttempt) {
      return sendError(res, 'No attempts remaining for today', 429);
    }

    // Increment the attempt counter
    await AttemptService.incrementAttempt(user_id, timezoneOffset);
    const attemptsRemaining = await AttemptService.getAttemptsRemaining(user_id, timezoneOffset);

    // Get target color for user's timezone
    const targetColor = await DailyColorService.getColorForTimezone(timezoneOffset);

    // Analyze image
    const scoreResult = await ImageAnalysisService.analyzeForColor(req.file.buffer, {
      r: targetColor.red,
      g: targetColor.green,
      b: targetColor.blue,
    });

    sendSuccess(res, {
      score: scoreResult.rawScore,
      pixelCount: scoreResult.pixelCount,
      averageDistance: scoreResult.averageDistance,
      attemptsRemaining,
      targetColor: {
        r: targetColor.red,
        g: targetColor.green,
        b: targetColor.blue,
      },
    });
  } catch (error) {
    sendError(res, (error as Error).message, 500);
  }
});

/**
 * POST /api/analysis/metadata
 * Get metadata about an image without analysis (does NOT count as an attempt)
 * Body:
 *   - image: multipart/form-data file
 */
router.post('/metadata', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return sendError(res, 'No image provided', 400);
    }

    const metadata = await ImageAnalysisService.getImageMetadata(req.file.buffer);

    sendSuccess(res, {
      metadata,
    });
  } catch (error) {
    sendError(res, (error as Error).message, 500);
  }
});

export default router;