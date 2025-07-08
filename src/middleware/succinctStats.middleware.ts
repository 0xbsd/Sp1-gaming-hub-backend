export const requireMinimumStats = (requirements: {
  minProofs?: number;
  minStars?: number;
  minCycles?: number;
  maxTopPercentage?: number;
}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.succinctUser;
      if (!user || !user.stats) {
        return res.status(403).json({
          success: false,
          error: 'Stats not available'
        });
      }

      const stats = user.stats;
      
      // Check requirements
      if (requirements.minProofs && stats.proofs < requirements.minProofs) {
        return res.status(403).json({
          success: false,
          error: `Minimum ${requirements.minProofs} proofs required. You have ${stats.proofs}.`
        });
      }

      if (requirements.minStars && stats.stars < requirements.minStars) {
        return res.status(403).json({
          success: false,
          error: `Minimum ${requirements.minStars} stars required. You have ${stats.stars}.`
        });
      }

      if (requirements.minCycles && stats.cycles < requirements.minCycles) {
        return res.status(403).json({
          success: false,
          error: `Minimum ${requirements.minCycles} cycles required. You have ${stats.cycles}.`
        });
      }

      if (requirements.maxTopPercentage && 
          parseFloat(stats.topPercentage) > requirements.maxTopPercentage) {
        return res.status(403).json({
          success: false,
          error: `Must be in top ${requirements.maxTopPercentage}% of users.`
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to verify stats requirements'
      });
    }
  };
};
