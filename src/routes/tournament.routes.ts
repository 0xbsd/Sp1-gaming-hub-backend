
import { Router } from 'express';
import { TournamentController } from '../controllers/tournament.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireMemberTier } from '../middleware/succinctAuth.middleware';
import { validate, schemas } from '../middleware/validation.middleware';

const router = Router();
const tournamentController = new TournamentController();

// Public routes
router.get('/', tournamentController.getAll);
router.get('/:id', validate(schemas.uuidParam), tournamentController.getById);
router.get('/:id/leaderboard', validate(schemas.uuidParam), tournamentController.getLeaderboard);

// Protected routes
router.use(authenticate);

router.post(
  '/:id/join',
  validate(schemas.uuidParam),
  tournamentController.join
);

router.post(
  '/:id/leave',
  validate(schemas.uuidParam),
  tournamentController.leave
);

// Premium member routes
router.post(
  '/create',
  requireMemberTier('premium'),
  tournamentController.create
);

export default router;