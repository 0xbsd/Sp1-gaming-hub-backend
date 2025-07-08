import { Router } from 'express';
import { LeaderboardController } from '../controllers/leaderboard.controller';
import { optionalAuth } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { z } from 'zod';

const router = Router();
const leaderboardController = new LeaderboardController();

// Validation schemas
const leaderboardQuerySchema = z.object({
  query: z.object({
    limit: z.string().regex(/^\d+$/).optional().default('100'),
    offset: z.string().regex(/^\d+$/).optional().default('0'),
    period: z.enum(['daily', 'weekly', 'monthly', 'all-time']).optional().default('all-time'),
  }),
});

// Public routes with optional auth
router.get(
  '/',
  optionalAuth,
  validate(leaderboardQuerySchema),
  leaderboardController.getGlobalLeaderboard
);

router.get(
  '/game/:gameId',
  optionalAuth,
  validate(leaderboardQuerySchema),
  leaderboardController.getGameLeaderboard
);

router.get(
  '/rank',
  optionalAuth,
  leaderboardController.getUserRank
);

export default router;