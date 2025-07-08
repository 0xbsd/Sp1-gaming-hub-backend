import { Router } from 'express';
import authRoutes from './auth.routes';
import gameRoutes from './game.routes';
import userRoutes from './user.routes';
import proofRoutes from './proof.routes';
import leaderboardRoutes from './leaderboard.routes';
import tournamentRoutes from './tournament.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/games', gameRoutes);
router.use('/users', userRoutes);
router.use('/proofs', proofRoutes);
router.use('/leaderboard', leaderboardRoutes);
router.use('/tournaments', tournamentRoutes);

export default router;