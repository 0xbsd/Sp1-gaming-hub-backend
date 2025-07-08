import { SuccinctStatsAPIService } from './succinctStatsAPI.service';

export class SuccinctAuthService {
  private succinctStatsAPI: SuccinctStatsAPIService;

  constructor() {
    this.succinctStatsAPI = new SuccinctStatsAPIService();
  }

  /**
   * Verify wallet address using Succinct Stats API
   */
  async verifyWalletAddress(address: string, signature: string, message: string): Promise<{
    address: string;
    isVerified: boolean;
    memberTier: 'basic' | 'premium' | 'enterprise';
    stats?: any;
  }> {
    try {
      // Verify signature
      const recoveredAddress = ethers.verifyMessage(message, signature);
      if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
        throw new Error('Invalid signature');
      }

      // Check Succinct Stats API
      const userStats = await this.succinctStatsAPI.getUserStats(address);

      if (!userStats.isVerified) {
        throw new Error('Address not found in Succinct Network or insufficient activity');
      }

      return {
        address,
        isVerified: true,
        memberTier: this.succinctStatsAPI.determineMemberTier(userStats),
        stats: {
          rank: userStats.data?.rank,
          stars: userStats.data?.stars,
          proofs: userStats.data?.proofs,
          cycles: userStats.data?.cycles,
          topPercentage: userStats.topPercentage,
          progress: userStats.progress
        }
      };
    } catch (error) {
      logger.error('Wallet verification failed:', error);
      throw error;
    }
  }

  /**
   * Verify GitHub username using Succinct Stats API
   */
  async verifyGitHubAccount(username: string): Promise<{
    githubUsername: string;
    isVerified: boolean;
    memberTier: 'basic' | 'premium' | 'enterprise';
    stats?: any;
  }> {
    try {
      // Format username with @ if not present
      const formattedUsername = username.startsWith('@') ? username : `@${username}`;
      
      // Check Succinct Stats API
      const userStats = await this.succinctStatsAPI.getUserStats(formattedUsername);

      if (!userStats.isVerified) {
        throw new Error('GitHub account not found in Succinct Network');
      }

      return {
        githubUsername: username,
        isVerified: true,
        memberTier: this.succinctStatsAPI.determineMemberTier(userStats),
        stats: {
          rank: userStats.data?.rank,
          stars: userStats.data?.stars,
          proofs: userStats.data?.proofs,
          cycles: userStats.data?.cycles,
          topPercentage: userStats.topPercentage,
          progress: userStats.progress
        }
      };
    } catch (error) {
      logger.error('GitHub verification failed:', error);
      throw error;
    }
  }

  /**
   * Generate access token for verified member
   */
  async generateAccessToken(member: any): Promise<string> {
    const payload = {
      identifier: member.address || member.githubUsername,
      memberTier: member.memberTier,
      isSuccinctMember: true,
      stats: member.stats,
      timestamp: new Date().toISOString()
    };

    const token = jwt.sign(payload, config.jwt.secret, {
      expiresIn: '7d'
    });

    // Store session
    const sessionKey = `session:${payload.identifier}`;
    await redis.setex(sessionKey, 604800, JSON.stringify(member)); // 7 days

    return token;
  }
}