import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          errors,
        });
      } else {
        next(error);
      }
    }
  };
};

// Common validation schemas
import { z } from 'zod';

export const schemas = {
  // Pagination
  pagination: z.object({
    query: z.object({
      page: z.string().regex(/^\d+$/).optional().default('1'),
      limit: z.string().regex(/^\d+$/).optional().default('20'),
    }),
  }),
  
  // UUID param
  uuidParam: z.object({
    params: z.object({
      id: z.string().uuid(),
    }),
  }),
  
  // Game session
  gameSession: z.object({
    body: z.object({
      gameId: z.string().uuid(),
      settings: z.record(z.any()).optional(),
    }),
  }),
  
  // Score submission
  scoreSubmission: z.object({
    body: z.object({
      sessionId: z.string().uuid(),
      score: z.number().int().min(0),
      proofData: z.record(z.any()).optional(),
    }),
  }),
};