import { Request, Response } from 'express';
import { leaderboardService } from '../services/leaderboard.service';

export class LeaderboardController {
  async getGlobalLeaderboard(req: Request, res: Response) {
    try {
      const { limit = 100, offset = 0, period = 'all-time' } = req.query;
      
      const leaderboard = await leaderboardService.getGlobalLeaderboard({
        limit: Number(limit),
        offset: Number(offset),
        period: period as string,
      });
      
      res.json({
        success: true,
        data: leaderboard,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch leaderboard',
      });
    }
  }
  
  async getGameLeaderboard(req: Request, res: Response) {
    try {
      const { gameId } = req.params;
      const { limit = 100, offset = 0, period = 'all-time' } = req.query;
      
      const leaderboard = await leaderboardService.getGameLeaderboard(gameId, {
        limit: Number(limit),
        offset: Number(offset),
        period: period as string,
      });
      
      res.json({
        success: true,
        data: leaderboard,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch game leaderboard',
      });
    }
  }
  
  async getUserRank(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      const { gameId } = req.query;
      
      const rank = await leaderboardService.getUserRank(userId, gameId as string);
      
      res.json({
        success: true,
        data: rank,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user rank',
      });
    }
  }
}
