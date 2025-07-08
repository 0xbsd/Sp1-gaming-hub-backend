import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { redis } from '../config/redis';

const createTournamentSchema = z.object({
  name: z.string().min(3).max(100),
  gameId: z.string().uuid(),
  maxParticipants: z.number().min(2).max(1000),
  entryFee: z.number().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  rules: z.object({
    format: z.enum(['single-elimination', 'round-robin', 'swiss']),
    timeLimit: z.number().optional(),
    scoreSystem: z.enum(['highest', 'cumulative', 'average']),
  }),
});

export class TournamentController {
  async create(req: Request, res: Response) {
    try {
      const data = createTournamentSchema.parse(req.body);
      
      // Verify game exists
      const game = await prisma.game.findUnique({
        where: { id: data.gameId },
      });
      
      if (!game) {
        return res.status(404).json({
          success: false,
          error: 'Game not found',
        });
      }
      
      // Create tournament
      const tournament = await prisma.tournament.create({
        data: {
          ...data,
          status: 'upcoming',
          prizePool: BigInt(0),
        },
      });
      
      res.json({
        success: true,
        data: tournament,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof z.ZodError ? error.errors : 'Failed to create tournament',
      });
    }
  }
  
  async getAll(req: Request, res: Response) {
    try {
      const status = req.query.status as string;
      const gameId = req.query.gameId as string;
      
      const where: any = {};
      if (status) where.status = status;
      if (gameId) where.gameId = gameId;
      
      const tournaments = await prisma.tournament.findMany({
        where,
        include: {
          game: true,
          _count: {
            select: { participants: true },
          },
        },
        orderBy: { startTime: 'asc' },
      });
      
      res.json({
        success: true,
        data: tournaments.map(t => ({
          ...t,
          participantCount: t._count.participants,
        })),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch tournaments',
      });
    }
  }
  
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const tournament = await prisma.tournament.findUnique({
        where: { id },
        include: {
          game: true,
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  avatar: true,
                },
              },
            },
            orderBy: { rank: 'asc' },
          },
        },
      });
      
      if (!tournament) {
        return res.status(404).json({
          success: false,
          error: 'Tournament not found',
        });
      }
      
      res.json({
        success: true,
        data: tournament,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch tournament',
      });
    }
  }
  
  async join(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      
      const tournament = await prisma.tournament.findUnique({
        where: { id },
        include: {
          _count: {
            select: { participants: true },
          },
        },
      });
      
      if (!tournament) {
        return res.status(404).json({
          success: false,
          error: 'Tournament not found',
        });
      }
      
      if (tournament.status !== 'upcoming') {
        return res.status(400).json({
          success: false,
          error: 'Tournament has already started',
        });
      }
      
      if (tournament._count.participants >= tournament.maxParticipants) {
        return res.status(400).json({
          success: false,
          error: 'Tournament is full',
        });
      }
      
      // Check if already joined
      const existing = await prisma.tournamentParticipant.findUnique({
        where: {
          tournamentId_userId: {
            tournamentId: id,
            userId: userId!,
          },
        },
      });
      
      if (existing) {
        return res.status(400).json({
          success: false,
          error: 'Already joined this tournament',
        });
      }
      
      // Join tournament
      const participant = await prisma.tournamentParticipant.create({
        data: {
          tournamentId: id,
          userId: userId!,
        },
      });
      
      // Update prize pool if there's an entry fee
      if (tournament.entryFee) {
        await prisma.tournament.update({
          where: { id },
          data: {
            prizePool: {
              increment: tournament.entryFee,
            },
          },
        });
      }
      
      res.json({
        success: true,
        data: participant,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to join tournament',
      });
    }
  }
  
  async leave(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.userId;
      
      const tournament = await prisma.tournament.findUnique({
        where: { id },
      });
      
      if (!tournament || tournament.status !== 'upcoming') {
        return res.status(400).json({
          success: false,
          error: 'Cannot leave tournament',
        });
      }
      
      await prisma.tournamentParticipant.delete({
        where: {
          tournamentId_userId: {
            tournamentId: id,
            userId: userId!,
          },
        },
      });
      
      // Refund entry fee if applicable
      if (tournament.entryFee) {
        await prisma.tournament.update({
          where: { id },
          data: {
            prizePool: {
              decrement: tournament.entryFee,
            },
          },
        });
      }
      
      res.json({
        success: true,
        message: 'Left tournament successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to leave tournament',
      });
    }
  }
  
  async getLeaderboard(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const participants = await prisma.tournamentParticipant.findMany({
        where: { tournamentId: id },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
        },
        orderBy: [
          { score: 'desc' },
          { joinedAt: 'asc' },
        ],
      });
      
      res.json({
        success: true,
        data: participants.map((p, index) => ({
          ...p,
          rank: index + 1,
        })),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch leaderboard',
      });
    }
  }
}