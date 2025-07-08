import { PrismaClient } from '@prisma/client';
import { redis } from '../config/redis';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class LeaderboardService {
  private readonly CACHE_TTL = 300; // 5 minutes
  
  async getGlobalLeaderboard(options: {
    limit: number;
    offset: number;
    period: string;
  }) {
    const cacheKey = `leaderboard:global:${options.period}:${options.offset}:${options.limit}`;
    
    // Check cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Build date filter based on period
    const dateFilter = this.getDateFilter(options.period);
    
    // Get leaderboard data
    const leaderboard = await prisma.$queryRaw`
      SELECT 
        u.id as "userId",
        u.username,
        u.avatar,
        u.zk_points as "zkPoints",
        COUNT(DISTINCT gs.id) as "gamesPlayed",
        AVG(gs.score) as "averageScore",
        COUNT(DISTINCT gs.id) FILTER (WHERE gs.status = 'completed') as "gamesCompleted",
        AVG(p.generation_time) as "avgProofTime",
        ROW_NUMBER() OVER (ORDER BY u.zk_points DESC) as rank
      FROM users u
      LEFT JOIN game_sessions gs ON u.id = gs.user_id
      LEFT JOIN proofs p ON u.id = p.user_id
      WHERE gs.created_at >= ${dateFilter}
      GROUP BY u.id
      ORDER BY u.zk_points DESC
      LIMIT ${options.limit}
      OFFSET ${options.offset}
    `;
    
    // Cache result
    await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(leaderboard));
    
    return leaderboard;
  }
  
  async getGameLeaderboard(gameId: string, options: {
    limit: number;
    offset: number;
    period: string;
  }) {
    const cacheKey = `leaderboard:game:${gameId}:${options.period}:${options.offset}:${options.limit}`;
    
    // Check cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    
    const dateFilter = this.getDateFilter(options.period);
    
    const leaderboard = await prisma.$queryRaw`
      SELECT 
        u.id as "userId",
        u.username,
        u.avatar,
        MAX(gs.score) as "highScore",
        COUNT(gs.id) as "gamesPlayed",
        AVG(gs.score) as "averageScore",
        AVG(gs.time_elapsed) as "avgCompletionTime",
        ROW_NUMBER() OVER (ORDER BY MAX(gs.score) DESC) as rank
      FROM users u
      INNER JOIN game_sessions gs ON u.id = gs.user_id
      WHERE gs.game_id = ${gameId}
        AND gs.status = 'completed'
        AND gs.created_at >= ${dateFilter}
      GROUP BY u.id
      ORDER BY MAX(gs.score) DESC
      LIMIT ${options.limit}
      OFFSET ${options.offset}
    `;
    
    // Cache result
    await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(leaderboard));
    
    return leaderboard;
  }
  
  async getUserRank(userId: string, gameId?: string) {
    const cacheKey = `rank:${userId}:${gameId || 'global'}`;
    
    // Check cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    
    let rankData;
    
    if (gameId) {
      // Game-specific rank
      rankData = await prisma.$queryRaw`
        WITH user_scores AS (
          SELECT 
            user_id,
            MAX(score) as high_score,
            ROW_NUMBER() OVER (ORDER BY MAX(score) DESC) as rank
          FROM game_sessions
          WHERE game_id = ${gameId}
            AND status = 'completed'
          GROUP BY user_id
        )
        SELECT 
          rank,
          high_score as score,
          (SELECT COUNT(DISTINCT user_id) FROM game_sessions WHERE game_id = ${gameId}) as "totalPlayers"
        FROM user_scores
        WHERE user_id = ${userId}
      `;
    } else {
      // Global rank
      rankData = await prisma.$queryRaw`
        WITH user_ranks AS (
          SELECT 
            id,
            zk_points,
            ROW_NUMBER() OVER (ORDER BY zk_points DESC) as rank
          FROM users
        )
        SELECT 
          rank,
          zk_points as score,
          (SELECT COUNT(*) FROM users) as "totalPlayers"
        FROM user_ranks
        WHERE id = ${userId}
      `;
    }
    
    const result = rankData[0] || { rank: null, score: 0, totalPlayers: 0 };
    
    // Cache result
    await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(result));
    
    return result;
  }
  
  async updateLeaderboards(userId: string, gameId: string, score: number) {
    try {
      // Update user's zkPoints
      await prisma.user.update({
        where: { id: userId },
        data: {
          zkPoints: {
            increment: Math.floor(score / 10), // 1 zkPoint per 10 score
          },
        },
      });
      
      // Invalidate relevant caches
      const patterns = [
        `leaderboard:global:*`,
        `leaderboard:game:${gameId}:*`,
        `rank:${userId}:*`,
      ];
      
      for (const pattern of patterns) {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      }
      
      // Emit real-time update
      this.emitLeaderboardUpdate(userId, gameId);
    } catch (error) {
      logger.error('Failed to update leaderboards:', error);
    }
  }
  
  private getDateFilter(period: string): Date {
    const now = new Date();
    
    switch (period) {
      case 'daily':
        return new Date(now.setDate(now.getDate() - 1));
      case 'weekly':
        return new Date(now.setDate(now.getDate() - 7));
      case 'monthly':
        return new Date(now.setMonth(now.getMonth() - 1));
      case 'all-time':
      default:
        return new Date(0); // Beginning of time
    }
  }
  
  private emitLeaderboardUpdate(userId: string, gameId: string) {
    // This would emit through WebSocket to update real-time leaderboards
    // Implementation depends on WebSocket setup
  }
}

export const leaderboardService = new LeaderboardService();

// ===== src/services/game.service.ts =====
import { PrismaClient } from '@prisma/client';
import { redis } from '../config/redis';
import { logger } from '../utils/logger';
import { leaderboardService } from './leaderboard.service';

const prisma = new PrismaClient();

export class GameService {
  async getAllGames(filters: { isActive?: boolean; category?: string }) {
    const games = await prisma.game.findMany({
      where: {
        isActive: filters.isActive,
        category: filters.category,
      },
      include: {
        _count: {
          select: {
            sessions: true,
          },
        },
      },
    });
    
    return games.map(game => ({
      ...game,
      playerCount: game._count.sessions,
    }));
  }
  
  async getGameById(id: string) {
    const game = await prisma.game.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            sessions: true,
          },
        },
      },
    });
    
    if (game) {
      // Get additional stats from cache
      const stats = await this.getGameStatsFromCache(id);
      return {
        ...game,
        playerCount: game._count.sessions,
        stats,
      };
    }
    
    return null;
  }
  
  async startGameSession(data: {
    gameId: string;
    userId: string;
    settings?: any;
  }) {
    // Check if user has any active sessions
    const activeSessions = await prisma.gameSession.findMany({
      where: {
        userId: data.userId,
        status: 'active',
      },
    });
    
    // End any active sessions
    if (activeSessions.length > 0) {
      await prisma.gameSession.updateMany({
        where: {
          userId: data.userId,
          status: 'active',
        },
        data: {
          status: 'abandoned',
          completedAt: new Date(),
        },
      });
    }
    
    // Create new session
    const session = await prisma.gameSession.create({
      data: {
        gameId: data.gameId,
        userId: data.userId,
        status: 'active',
        score: 0,
        timeElapsed: 0,
        settings: data.settings || {},
      },
    });
    
    // Cache session data
    await redis.setex(
      `session:${session.id}`,
      3600, // 1 hour TTL
      JSON.stringify(session)
    );
    
    // Update game player count
    await this.incrementGamePlayerCount(data.gameId);
    
    return session;
  }
  
  async submitScore(data: {
    sessionId: string;
    userId: string;
    score: number;
    proofData?: any;
  }) {
    // Verify session belongs to user
    const session = await prisma.gameSession.findFirst({
      where: {
        id: data.sessionId,
        userId: data.userId,
        status: 'active',
      },
    });
    
    if (!session) {
      throw new Error('Invalid or inactive session');
    }
    
    // Update session
    const updatedSession = await prisma.gameSession.update({
      where: { id: data.sessionId },
      data: {
        score: data.score,
        status: 'completed',
        completedAt: new Date(),
        proofData: data.proofData,
      },
    });
    
    // Update leaderboards
    await leaderboardService.updateLeaderboards(
      data.userId,
      session.gameId,
      data.score
    );
    
    // Check for achievements
    await this.checkAchievements(data.userId, session.gameId, data.score);
    
    // Update cache
    await redis.del(`session:${data.sessionId}`);
    
    return {
      session: updatedSession,
      newAchievements: [], // Would be populated by checkAchievements
    };
  }
  
  async getGameStats(gameId: string) {
    const cacheKey = `game:${gameId}:stats`;
    
    // Check cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Calculate stats
    const stats = await prisma.gameSession.aggregate({
      where: {
        gameId,
        status: 'completed',
      },
      _count: true,
      _avg: {
        score: true,
        timeElapsed: true,
      },
      _max: {
        score: true,
      },
      _min: {
        timeElapsed: true,
      },
    });
    
    const uniquePlayers = await prisma.gameSession.groupBy({
      by: ['userId'],
      where: {
        gameId,
      },
      _count: true,
    });
    
    const result = {
      totalGames: stats._count,
      uniquePlayers: uniquePlayers.length,
      averageScore: stats._avg.score || 0,
      highScore: stats._max.score || 0,
      averageTime: stats._avg.timeElapsed || 0,
      bestTime: stats._min.timeElapsed || 0,
    };
    
    // Cache for 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(result));
    
    return result;
  }
  
  private async incrementGamePlayerCount(gameId: string) {
    const key = `game:${gameId}:players:${new Date().toISOString().split('T')[0]}`;
    await redis.incr(key);
    await redis.expire(key, 86400 * 7); // Keep for 7 days
  }
  
  private async getGameStatsFromCache(gameId: string) {
    const today = new Date().toISOString().split('T')[0];
    const key = `game:${gameId}:players:${today}`;
    const dailyPlayers = await redis.get(key);
    
    return {
      dailyPlayers: parseInt(dailyPlayers || '0'),
    };
  }
  
  private async checkAchievements(userId: string, gameId: string, score: number) {
    // Implementation for achievement checking
    // This would check various conditions and award achievements
    logger.info(`Checking achievements for user ${userId}, game ${gameId}, score ${score}`);
  }
}

export const gameService = new GameService();