import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { redis } from '../config/redis';

interface SuccinctUser {
  address?: string;
  githubUsername?: string;
  memberTier: string;
  isSuccinctMember: boolean;
}

declare global {
  namespace Express {
    interface Request {
      succinctUser?: SuccinctUser;
    }
  }
}

/**
 * Middleware to verify Succinct Network membership
 */
export const requireSuccinctMember = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No authentication token provided'
      });
    }

    // Verify JWT
    const decoded = jwt.verify(token, config.jwt.secret) as any;

    if (!decoded.isSuccinctMember) {
      return res.status(403).json({
        success: false,
        error: 'Access restricted to Succinct Network members'
      });
    }

    // Check if session is still valid
    const sessionKey = `session:${decoded.address || decoded.githubUsername}`;
    const session = await redis.get(sessionKey);

    if (!session) {
      return res.status(401).json({
        success: false,
        error: 'Session expired. Please login again.'
      });
    }

    req.succinctUser = decoded;
    req.user = { 
      userId: decoded.userId,
      address: decoded.address 
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
};

/**
 * Middleware to check member tier
 */
export const requireMemberTier = (minTier: 'basic' | 'premium' | 'enterprise') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.succinctUser;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated'
      });
    }

    const tierLevels = { basic: 1, premium: 2, enterprise: 3 };
    const userTierLevel = tierLevels[user.memberTier as keyof typeof tierLevels] || 0;
    const requiredTierLevel = tierLevels[minTier];

    if (userTierLevel < requiredTierLevel) {
      return res.status(403).json({
        success: false,
        error: `This feature requires ${minTier} tier or higher`
      });
    }

    next();
  };
};