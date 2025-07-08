import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';

const updateProfileSchema = z.object({
  username: z.string().min(3).max(20).optional(),
  email: z.string().email().optional(),
  avatar: z.string().url().optional(),
});

export class UserController {
  async getProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          _count: {
            select: {
              sessions: true,
              achievements: true,
            },
          },
        },
      });
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }
      
      res.json({
        success: true,
        data: {
          ...user,
          gamesPlayed: user._count.sessions,
          achievementsCount: user._count.achievements,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch profile',
      });
    }
  }
  
  async updateProfile(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const data = updateProfileSchema.parse(req.body);
      
      // Check if username is already taken
      if (data.username) {
        const existing = await prisma.user.findFirst({
          where: {
            username: data.username,
            NOT: { id: userId },
          },
        });
        
        if (existing) {
          return res.status(400).json({
            success: false,
            error: 'Username already taken',
          });
        }
      }
      
      const user = await prisma.user.update({
        where: { id: userId },
        data,
      });
      
      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof z.ZodError ? error.errors : 'Failed to update profile',
      });
    }
  }
  
  async getStats(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      
      // Get aggregated stats
      const stats = await prisma.gameSession.aggregate({
        where: { userId },
        _count: true,
        _sum: {
          score: true,
        },
        _avg: {
          score: true,
          timeElapsed: true,
        },
        _max: {
          score: true,
        },
      });
      
      // Get game-specific stats
      const gameStats = await prisma.gameSession.groupBy({
        by: ['gameId'],
        where: { userId },
        _count: true,
        _max: {
          score: true,
        },
      });
      
      res.json({
        success: true,
        data: {
          totalGames: stats._count,
          totalScore: stats._sum.score || 0,
          averageScore: Math.round(stats._avg.score || 0),
          highScore: stats._max.score || 0,
          averageTime: Math.round(stats._avg.timeElapsed || 0),
          gameStats,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch stats',
      });
    }
  }
  
  async getGameHistory(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      
      const sessions = await prisma.gameSession.findMany({
        where: { userId },
        include: {
          game: true,
        },
        orderBy: { startedAt: 'desc' },
        take: limit,
        skip: offset,
      });
      
      const total = await prisma.gameSession.count({
        where: { userId },
      });
      
      res.json({
        success: true,
        data: {
          sessions,
          total,
          hasMore: offset + limit < total,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch game history',
      });
    }
  }
  
  async getAchievements(req: Request, res: Response) {
    try {
      const userId = req.user?.userId;
      
      const achievements = await prisma.userAchievement.findMany({
        where: { userId },
        include: {
          achievement: true,
        },
        orderBy: { unlockedAt: 'desc' },
      });
      
      res.json({
        success: true,
        data: achievements,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch achievements',
      });
    }
  }
}
