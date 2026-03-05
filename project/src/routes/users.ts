import { Router, Request, Response } from 'express';
import { UserService } from '../services/UserService';
import { sendSuccess, sendError } from '../middleware/errorHandler';

const router = Router();

/**
 * POST /users
 * Create a new user
 * Body:
 *   - username: string
 *   - email: string
 *   - country_code: string (optional)
 *   - avatar_url: string (optional)
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { username, email, country_code, avatar_url } = req.body;

    if (!username || !email) {
      return sendError(res, 'Missing required fields: username, email', 400);
    }

    // Check availability
    const usernameAvailable = await UserService.isUsernameAvailable(username);
    const emailAvailable = await UserService.isEmailAvailable(email);

    if (!usernameAvailable) {
      return sendError(res, 'Username already taken', 400);
    }

    if (!emailAvailable) {
      return sendError(res, 'Email already registered', 400);
    }

    const user = await UserService.createUser(username, email, country_code, avatar_url);

    sendSuccess(
      res,
      {
        id: user.id,
        username: user.username,
        email: user.email,
        country_code: user.country_code,
        avatar_url: user.avatar_url,
        created_at: user.created_at,
      },
      201
    );
  } catch (error) {
    sendError(res, (error as Error).message, 500);
  }
});

/**
 * GET /users/:userId
 * Get user profile
 */
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const user = await UserService.getUserById(userId);

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    sendSuccess(res, {
      id: user.id,
      username: user.username,
      email: user.email,
      country_code: user.country_code,
      avatar_url: user.avatar_url,
      created_at: user.created_at,
      updated_at: user.updated_at,
    });
  } catch (error) {
    sendError(res, (error as Error).message, 500);
  }
});

/**
 * GET /users/username/:username
 * Get user by username
 */
router.get('/username/:username', async (req: Request, res: Response) => {
  try {
    const { username } = req.params;

    const user = await UserService.getUserByUsername(username);

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    sendSuccess(res, {
      id: user.id,
      username: user.username,
      email: user.email,
      country_code: user.country_code,
      avatar_url: user.avatar_url,
      created_at: user.created_at,
      updated_at: user.updated_at,
    });
  } catch (error) {
    sendError(res, (error as Error).message, 500);
  }
});

/**
 * PUT /users/:userId
 * Update user profile
 * Body:
 *   - username: string (optional)
 *   - email: string (optional)
 *   - country_code: string (optional)
 *   - avatar_url: string (optional)
 */
router.put('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    const user = await UserService.updateUser(userId, updates);

    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    sendSuccess(res, {
      id: user.id,
      username: user.username,
      email: user.email,
      country_code: user.country_code,
      avatar_url: user.avatar_url,
      created_at: user.created_at,
      updated_at: user.updated_at,
    });
  } catch (error) {
    sendError(res, (error as Error).message, 500);
  }
});

/**
 * DELETE /users/:userId
 * Delete user account
 */
router.delete('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const deleted = await UserService.deleteUser(userId);

    if (!deleted) {
      return sendError(res, 'User not found', 404);
    }

    sendSuccess(res, {
      message: 'User deleted successfully',
    });
  } catch (error) {
    sendError(res, (error as Error).message, 500);
  }
});

export default router;
