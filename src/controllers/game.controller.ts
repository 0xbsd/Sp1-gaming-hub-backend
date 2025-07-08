import { Request, Response } from 'express';
import { gameService } from '../services/game.service';
import { z } from 'zod';

const startGameSchema = z.object({
  gameId: z.string().uuid(),
  settings: z.object({}).optional(),
});

const submitScoreSchema = z.object({
  sessionId: z.string().uuid(),
  score: z.number().positive(),
  proofData: z.any().optional(),
});

export class GameController {
  async getAllGames(req: Request, res: Response) {
    try {
      const games = await gameService.getAllGames({
        isActive: true,
        category: req.query.category as string,
      });
      
      res.json({
        success: true,
        data: games,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch games',
      });
    }
  }
  
  async getGameById(req: Request, res: Response) {
    try {
      const game = await gameService.getGameById(req.params.id);
      
      if (!game) {
        return res.status(404).json({
          success: false,
          error: 'Game not found',
        });
      }
      
      res.json({
        success: true,
        data: game,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch game',
      });
    }
  }
  
  async startGameSession(req: Request, res: Response) {
    try {
      const { gameId, settings } = startGameSchema.parse(req.body);
      const userId = req.user.id;
      
      const session = await gameService.startGameSession({
        gameId,
        userId,
        settings,
      });
      
      res.json({
        success: true,
        data: session,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
  
  async submitScore(req: Request, res: Response) {
    try {
      const { sessionId, score, proofData } = submitScoreSchema.parse(req.body);
      const userId = req.user.id;
      
      const result = await gameService.submitScore({
        sessionId,
        userId,
        score,
        proofData,
      });
      
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
  
  async getGameStats(req: Request, res: Response) {
    try {
      const stats = await gameService.getGameStats(req.params.id);
      
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch game stats',
      });
    }
  }
}