import { Router } from 'express';
import { GameController } from '../controllers/game.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate, schemas } from '../middleware/validation.middleware';
import { gameLimiter } from '../middleware/rateLimit.middleware';

const router = Router();
const gameController = new GameController();

// Public routes
router.get(
  '/',
  validate(schemas.pagination),
  gameController.getAllGames
);

router.get(
  '/:id',
  validate(schemas.uuidParam),
  gameController.getGameById
);

router.get(
  '/:id/stats',
  validate(schemas.uuidParam),
  gameController.getGameStats
);

// Protected routes
router.use(authenticate); // All routes below require authentication

router.post(
  '/start',
  gameLimiter,
  validate(schemas.gameSession),
  gameController.startGameSession
);

router.post(
  '/submit-score',
  gameLimiter,
  validate(schemas.scoreSubmission),
  gameController.submitScore
);

export default router;