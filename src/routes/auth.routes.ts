import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authLimiter } from '../middleware/rateLimit.middleware';
import { validate, schemas } from '../middleware/validation.middleware';
import { z } from 'zod';

const router = Router();
const authController = new AuthController();

// Validation schemas
const connectWalletSchema = z.object({
  body: z.object({
    address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    signature: z.string(),
    message: z.string(),
  }),
});

const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string(),
  }),
});

// Routes
router.post(
  '/connect-wallet',
  authLimiter,
  validate(connectWalletSchema),
  authController.connectWallet
);

router.post(
  '/refresh',
  authLimiter,
  validate(refreshTokenSchema),
  authController.refreshToken
);

router.post(
  '/logout',
  authController.logout
);

export default router;