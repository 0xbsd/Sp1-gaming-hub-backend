import { Request, Response } from 'express';
import { proofService } from '../services/proof.service';
import { z } from 'zod';

const generateProofSchema = z.object({
  gameId: z.string().uuid(),
  sessionId: z.string().uuid(),
  proofType: z.string(),
  inputData: z.any(),
});

export class ProofController {
  async generateProof(req: Request, res: Response) {
    try {
      const { gameId, sessionId, proofType, inputData } = generateProofSchema.parse(req.body);
      const userId = req.user.id;
      
      const proof = await proofService.generateProof({
        userId,
        gameId,
        sessionId,
        proofType,
        inputData,
      });
      
      res.json({
        success: true,
        data: proof,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
  
  async verifyProof(req: Request, res: Response) {
    try {
      const { proofId } = req.params;
      
      const result = await proofService.verifyProof(proofId);
      
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: 'Proof verification failed',
      });
    }
  }
  
  async getUserProofs(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const { limit = 20, offset = 0 } = req.query;
      
      const proofs = await proofService.getUserProofs(userId, {
        limit: Number(limit),
        offset: Number(offset),
      });
      
      res.json({
        success: true,
        data: proofs,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch proofs',
      });
    }
  }
  
  async getProofStats(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      
      const stats = await proofService.getProofStats(userId);
      
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch proof stats',
      });
    }
  }
}