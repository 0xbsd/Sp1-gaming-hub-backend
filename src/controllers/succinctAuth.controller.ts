export class SuccinctAuthController {
  private succinctStatsAPI = new SuccinctStatsAPIService();

  /**
   * Get current network stats
   */
  async getNetworkStats(req: Request, res: Response) {
    try {
      const stats = await this.succinctStatsAPI.getNetworkStats();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch network stats'
      });
    }
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 100;
      
      const leaderboard = await this.succinctStatsAPI.getLeaderboard(page, limit);
      
      res.json({
        success: true,
        data: leaderboard
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch leaderboard'
      });
    }
  }

  /**
   * Check if user is eligible
   */
  async checkEligibility(req: Request, res: Response) {
    try {
      const { identifier } = req.params;
      
      const userStats = await this.succinctStatsAPI.getUserStats(identifier);
      
      res.json({
        success: true,
        data: {
          isEligible: userStats.isVerified,
          stats: userStats.data,
          progress: userStats.progress,
          topPercentage: userStats.topPercentage,
          memberTier: userStats.isVerified 
            ? this.succinctStatsAPI.determineMemberTier(userStats)
            : null
        }
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
  }
}