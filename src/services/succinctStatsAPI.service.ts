import axios from 'axios';
import { ethers } from 'ethers';
import jwt from 'jsonwebtoken';
import { redis } from '../config/redis';
import { config } from '../config/env';
import { logger } from '../utils/logger';

// Types based on Succinct Stats API documentation
interface SuccinctStatsUser {
  rank: number;
  name: string; // Can be @username or 0x address
  stars: number;
  cycles: number;
  proofs: number;
  invitedBy?: string;
  inviteCode?: string;
}

interface UserProgress {
  proofs: number; // percentage
  stars: number; // percentage
  cycles: number; // percentage
}

interface NetworkStats {
  totalProvers: number;
  totalStars: number;
  totalCycles: number;
  totalProofs: number;
}

interface StarRange {
  range: string;
  count: number;
}

interface TopInviter {
  rank: number;
  inviter: string;
  count: number;
}

export class SuccinctStatsAPIService {
  private readonly API_BASE = 'https://www.succinct-stats.xyz/api';
  private readonly CACHE_TTL = 300; // 5 minutes cache
  
  /**
   * Get user data from Succinct Stats leaderboard
   */
  async getUserStats(identifier: string): Promise<{
    data: SuccinctStatsUser | null;
    progress: UserProgress;
    topPercentage: string;
    isVerified: boolean;
  }> {
    try {
      // Check cache first
      const cacheKey = `succinct:stats:${identifier.toLowerCase()}`;
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // Fetch from API
      const response = await axios.get(`${this.API_BASE}/leaderboard`, {
        params: {
          action: 'getByUsername',
          username: identifier
        }
      });

      if (!response.data || response.data.error) {
        logger.warn(`User not found in Succinct Stats: ${identifier}`);
        return {
          data: null,
          progress: { proofs: 0, stars: 0, cycles: 0 },
          topPercentage: '100',
          isVerified: false
        };
      }

      const result = {
        ...response.data,
        isVerified: this.evaluateUserVerification(response.data)
      };

      // Cache the result
      await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(result));

      return result;
    } catch (error) {
      logger.error('Failed to fetch user stats:', error);
      throw new Error('Failed to verify user with Succinct Stats');
    }
  }

  /**
   * Get network statistics
   */
  async getNetworkStats(): Promise<NetworkStats> {
    try {
      const cacheKey = 'succinct:network:stats';
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const response = await axios.get(`${this.API_BASE}/leaderboard`, {
        params: {
          action: 'getNetworkStats'
        }
      });

      if (response.data) {
        await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(response.data));
      }

      return response.data;
    } catch (error) {
      logger.error('Failed to fetch network stats:', error);
      throw error;
    }
  }

  /**
   * Get top performers
   */
  async getTopPerformers(limit: number = 10): Promise<SuccinctStatsUser[]> {
    try {
      const response = await axios.get(`${this.API_BASE}/leaderboard`, {
        params: {
          action: 'getTopPerformers',
          limit
        }
      });

      return response.data || [];
    } catch (error) {
      logger.error('Failed to fetch top performers:', error);
      return [];
    }
  }

  /**
   * Check if user is in top percentage
   */
  async isTopPerformer(identifier: string, threshold: number = 10): Promise<boolean> {
    try {
      const userStats = await this.getUserStats(identifier);
      return parseFloat(userStats.topPercentage) <= threshold;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get paginated leaderboard
   */
  async getLeaderboard(page: number = 1, entriesPerPage: number = 100): Promise<{
    data: SuccinctStatsUser[];
    total: number;
  }> {
    try {
      const response = await axios.get(`${this.API_BASE}/leaderboard`, {
        params: {
          action: 'getByPage',
          page,
          entriesPerPage
        }
      });

      return response.data || { data: [], total: 0 };
    } catch (error) {
      logger.error('Failed to fetch leaderboard:', error);
      return { data: [], total: 0 };
    }
  }

  /**
   * Evaluate if user meets verification criteria
   */
  private evaluateUserVerification(userData: any): boolean {
    if (!userData || !userData.data) return false;

    const user = userData.data;
    const progress = userData.progress || {};
    const topPercentage = parseFloat(userData.topPercentage || '100');

    // Verification criteria
    const criteria = {
      hasActivity: user.proofs > 0 || user.stars > 0 || user.cycles > 0,
      isTopPerformer: topPercentage <= 50, // Top 50% of users
      hasMinimumProofs: user.proofs >= 1,
      hasMinimumStars: user.stars >= 100,
      hasGoodProgress: progress.proofs >= 10 || progress.stars >= 10 || progress.cycles >= 10
    };

    // User is verified if they meet any of these conditions
    return (
      criteria.hasMinimumProofs ||
      criteria.hasMinimumStars ||
      criteria.isTopPerformer ||
      (criteria.hasActivity && criteria.hasGoodProgress)
    );
  }

  /**
   * Determine member tier based on stats
   */
  determineMemberTier(userData: any): 'basic' | 'premium' | 'enterprise' {
    if (!userData || !userData.data) return 'basic';

    const user = userData.data;
    const topPercentage = parseFloat(userData.topPercentage || '100');

    // Enterprise: Top 1% or exceptional stats
    if (topPercentage <= 1 || user.stars >= 10000 || user.proofs >= 1000) {
      return 'enterprise';
    }

    // Premium: Top 10% or good stats
    if (topPercentage <= 10 || user.stars >= 1000 || user.proofs >= 100) {
      return 'premium';
    }

    return 'basic';
  }
}