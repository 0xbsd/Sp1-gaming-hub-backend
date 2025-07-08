import { PrismaClient } from '@prisma/client';
import { redis } from '../config/redis';
import { generateZKProof, verifyZKProof } from '../utils/zkProof.utils';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export class ProofService {
  async generateProof(data: {
    userId: string;
    gameId: string;
    sessionId: string;
    proofType: string;
    inputData: any;
  }) {
    const startTime = Date.now();
    
    try {
      // Generate the actual ZK proof
      const proofData = await generateZKProof({
        type: data.proofType,
        input: data.inputData,
      });
      
      const generationTime = Date.now() - startTime;
      
      // Store proof in database
      const proof = await prisma.proof.create({
        data: {
          userId: data.userId,
          gameId: data.gameId,
          sessionId: data.sessionId,
          proofType: data.proofType,
          proofData,
          generationTime,
          verificationStatus: 'pending',
        },
      });
      
      // Cache for quick access
      await redis.setex(
        `proof:${proof.id}`,
        3600, // 1 hour TTL
        JSON.stringify(proof)
      );
      
      // Update user stats
      await this.updateUserProofStats(data.userId, generationTime);
      
      // Trigger verification
      this.verifyProofAsync(proof.id);
      
      return proof;
    } catch (error) {
      logger.error('Proof generation failed:', error);
      throw new Error('Failed to generate proof');
    }
  }
  
  async verifyProof(proofId: string) {
    try {
      // Get proof from cache or database
      const cachedProof = await redis.get(`proof:${proofId}`);
      const proof = cachedProof 
        ? JSON.parse(cachedProof)
        : await prisma.proof.findUnique({ where: { id: proofId } });
      
      if (!proof) {
        throw new Error('Proof not found');
      }
      
      // Verify the proof
      const isValid = await verifyZKProof({
        type: proof.proofType,
        proofData: proof.proofData,
      });
      
      // Update verification status
      const updatedProof = await prisma.proof.update({
        where: { id: proofId },
        data: {
          verificationStatus: isValid ? 'verified' : 'failed',
          verifiedAt: new Date(),
        },
      });
      
      // Update cache
      await redis.setex(
        `proof:${proofId}`,
        3600,
        JSON.stringify(updatedProof)
      );
      
      return {
        isValid,
        proof: updatedProof,
      };
    } catch (error) {
      logger.error('Proof verification failed:', error);
      throw new Error('Failed to verify proof');
    }
  }
  
  async getUserProofs(userId: string, options: { limit: number; offset: number }) {
    const proofs = await prisma.proof.findMany({
      where: { userId },
      include: {
        game: true,
      },
      orderBy: { createdAt: 'desc' },
      take: options.limit,
      skip: options.offset,
    });
    
    const total = await prisma.proof.count({ where: { userId } });
    
    return {
      proofs,
      total,
      hasMore: options.offset + options.limit < total,
    };
  }
  
  async getProofStats(userId: string) {
    const stats = await prisma.proof.aggregate({
      where: { userId },
      _count: true,
      _avg: {
        generationTime: true,
      },
    });
    
    const verifiedCount = await prisma.proof.count({
      where: {
        userId,
        verificationStatus: 'verified',
      },
    });
    
    return {
      totalProofs: stats._count,
      verifiedProofs: verifiedCount,
      averageGenerationTime: stats._avg.generationTime || 0,
      successRate: stats._count > 0 ? (verifiedCount / stats._count) * 100 : 0,
    };
  }
  
  private async updateUserProofStats(userId: string, generationTime: number) {
    // Update cached stats
    const key = `user:${userId}:proofStats`;
    const stats = await redis.get(key);
    
    if (stats) {
      const parsed = JSON.parse(stats);
      parsed.count += 1;
      parsed.totalTime += generationTime;
      parsed.avgTime = parsed.totalTime / parsed.count;
      
      await redis.setex(key, 86400, JSON.stringify(parsed)); // 24h TTL
    } else {
      await redis.setex(key, 86400, JSON.stringify({
        count: 1,
        totalTime: generationTime,
        avgTime: generationTime,
      }));
    }
  }
  
  private async verifyProofAsync(proofId: string) {
    // Queue proof verification job
    setTimeout(async () => {
      try {
        await this.verifyProof(proofId);
      } catch (error) {
        logger.error(`Async proof verification failed for ${proofId}:`, error);
      }
    }, 100);
  }
}

export const proofService = new ProofService();