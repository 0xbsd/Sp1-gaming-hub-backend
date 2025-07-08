import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// General rate limiter
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true,
});

// Game action rate limiter
export const gameLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // limit each IP to 60 requests per minute
  message: 'Too many game actions, please slow down.',
});

// Custom rate limiter factory
export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}) {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: options.message || 'Too many requests',
    keyGenerator: options.keyGenerator || ((req: Request) => {
      // Use user ID if authenticated, otherwise use IP
      return req.user?.userId || req.ip;
    }),
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        success: false,
        error: options.message || 'Too many requests',
        retryAfter: res.getHeader('Retry-After'),
      });
    },
  });
}