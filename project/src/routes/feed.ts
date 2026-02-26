import { Router, Request, Response } from 'express';
import { FeedService } from '../services/FeedService';
import { sendSuccess, sendError } from '../middleware/errorHandler';

const router = Router();

/**
 * GET /feed
 * Get paginated feed for the current daily color
 * Query params:
 *   - page: page number (default: 1)
 *   - limit: items per page (default: 20)
 *   - timezone_offset: hours offset from UTC
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const timezoneOffset = parseFloat(req.query.timezone_offset as string) || 0;

    const feed = await FeedService.getFeed(page, limit, timezoneOffset);

    sendSuccess(res, feed);
  } catch (error) {
    sendError(res, (error as Error).message, 500);
  }
});

/**
 * POST /feed/:findId/react
 * Add a reaction to a find
 * Body:
 *   - user_id: UUID of the user
 *   - reaction_type: type of reaction (default: 'like')
 */
router.post('/:findId/react', async (req: Request, res: Response) => {
  try {
    const { user_id, reaction_type = 'like' } = req.body;
    const findId = req.params.findId;

    if (!user_id) {
      return sendError(res, 'Missing user_id', 400);
    }

    const reaction = await FeedService.addReaction(findId, user_id, reaction_type);

    sendSuccess(res, {
      reaction_id: reaction.id,
      message: 'Reaction added',
    }, 201);
  } catch (error) {
    sendError(res, (error as Error).message, 400);
  }
});

/**
 * DELETE /feed/:findId/react/:reactionType
 * Remove a reaction from a find
 */
router.delete('/:findId/react/:reactionType', async (req: Request, res: Response) => {
  try {
    const { user_id } = req.query;
    const { findId, reactionType } = req.params;

    if (!user_id) {
      return sendError(res, 'Missing user_id', 400);
    }

    const removed = await FeedService.removeReaction(findId, user_id as string, reactionType);

    if (!removed) {
      return sendError(res, 'Reaction not found', 404);
    }

    sendSuccess(res, {
      message: 'Reaction removed',
    });
  } catch (error) {
    sendError(res, (error as Error).message, 500);
  }
});

/**
 * GET /feed/:findId/reactions
 * Get all reactions for a find
 */
router.get('/:findId/reactions', async (req: Request, res: Response) => {
  try {
    const findId = req.params.findId;

    const reactions = await FeedService.getReactions(findId);

    sendSuccess(res, {
      find_id: findId,
      reactions,
    });
  } catch (error) {
    sendError(res, (error as Error).message, 500);
  }
});

export default router;
