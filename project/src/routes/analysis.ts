import { Router, Request, Response } from 'express';
import multer from 'multer';
import { ImageAnalysisService } from '../services/ImageAnalysisService';
import { DailyColorService } from '../services/DailyColorService';
import { sendSuccess, sendError } from '../middleware/errorHandler';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

/**
 * POST /analyze
 * Analyze an image for the target color
 * Body:
 *   - image: multipart/form-data file
 *   - timezone_offset: hours offset from UTC
 */
router.post('/analyze', upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return sendError(res, 'No image provided', 400);
    }

    const timezoneOffset = parseFloat(req.body.timezone_offset) || 0;

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
 * POST /analyze/metadata
 * Get metadata about an image without analysis
 * Body:
 *   - image: multipart/form-data file
 */
router.post('/analyze/metadata', upload.single('image'), async (req: Request, res: Response) => {
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
