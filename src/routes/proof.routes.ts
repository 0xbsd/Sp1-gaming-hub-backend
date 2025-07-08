import { Router } from 'express';
import { ProofController } from '../controllers/proof.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate, schemas } from '../middleware/validation.middleware';
import { gameLimiter } from '../middleware/rateLimit.middleware';
import { z } from 'zod';

const router = Router();
const proofController = new ProofController();

// Validation schemas
const generateProofSchema = z.object({
  body: z.object({
    gameId: z.string().uuid(),
    sessionId: z.string().uuid(),
    proofType: z.string(),
    inputData: z.any(),
  }),
});

// All proof routes require authentication
router.use(authenticate);

router.post(
  '/generate',
  gameLimiter,
  validate(generateProofSchema),
  proofController.generateProof
);

router.get(
  '/verify/:proofId',
  validate(schemas.uuidParam),
  proofController.verifyProof
);

router.get(
  '/',
  validate(schemas.pagination),
  proofController.getUserProofs
);

router.get(
  '/stats',
  proofController.getProofStats
);

export default router;