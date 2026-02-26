import { Router, Request, Response } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { ImageAnalysisService } from '../services/ImageAnalysisService';
import { AttemptService } from '../services/AttemptService';
import { DailyColorService } from '../services/DailyColorService';
import { sendSuccess, sendError } from '../middleware/errorHandler';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

/**
 * POST /finds
 * Submit a find/image for the daily color
 * Body:
 *   - image: multipart/form-data file
 *   - user_id: UUID of the user
 *   - latitude: submission location latitude
 *   - longitude: submission location longitude
 *   - timezone_offset: hours offset from UTC
 */
router.post('/', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return sendError(res, 'No image provided', 400);
    }

    const { user_id, latitude, longitude, timezone_offset } = req.body;

    if (!user_id || latitude === undefined || longitude === undefined) {
      return sendError(res, 'Missing required fields: user_id, latitude, longitude', 400);
    }

    const timezoneOffset = parseFloat(timezone_offset) || 0;

    // Get target color
    const targetColor = await DailyColorService.getColorForTimezone(timezoneOffset);

    // Analyze image
    const scoreResult = await ImageAnalysisService.analyzeForColor(req.file.buffer, {
      r: targetColor.red,
      g: targetColor.green,
      b: targetColor.blue,
    });

    // Save submission
    const imageKey = `finds/${user_id}/${targetColor.date.toISOString()}/${uuidv4()}.jpg`;

    const find = await AttemptService.saveFindSubmission(
      user_id,
      req.file.buffer,
      imageKey,
      scoreResult.rawScore,
      scoreResult.pixelCount,
      scoreResult.averageDistance,
      parseFloat(latitude),
      parseFloat(longitude),
      targetColor.id,
      timezoneOffset
    );

    sendSuccess(
      res,
      {
        find_id: find.id,
        score: find.score,
        pixel_count: find.pixel_count,
        neighborhood: find.neighborhood,
        attempt_number: find.attempt_number,
        image_url: find.image_url,
      },
      201
    );
  } catch (error) {
    sendError(res, (error as Error).message, 400);
  }
});

/**
 * GET /finds/:findId
 * Get details of a specific find
 */
router.get('/:findId', async (req: Request, res: Response) => {
  try {
    // TODO: Implement get find by ID
    sendSuccess(res, {
      message: 'Not yet implemented',
    });
  } catch (error) {
    sendError(res, (error as Error).message, 500);
  }
});

/**
 * GET /finds/user/:userId
 * Get all finds for a user
 */
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { page = '1', limit = '20' } = req.query;
    const userId = req.params.userId;

    // TODO: Implement get user finds with pagination
    sendSuccess(res, {
      message: 'Not yet implemented',
    });
  } catch (error) {
    sendError(res, (error as Error).message, 500);
  }
});

export default router;
