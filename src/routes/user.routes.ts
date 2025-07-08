import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate, schemas } from '../middleware/validation.middleware';

const router = Router();
const userController = new UserController();

// All user routes require authentication
router.use(authenticate);

router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.get('/stats', userController.getStats);
router.get('/games', validate(schemas.pagination), userController.getGameHistory);
router.get('/achievements', userController.getAchievements);

export default router;