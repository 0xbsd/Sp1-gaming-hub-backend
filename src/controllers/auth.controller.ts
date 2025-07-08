import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { validateAddress } from '../utils/validation.utils';
import { z } from 'zod';

const connectWalletSchema = z.object({
  address: z.string().refine(validateAddress, 'Invalid wallet address'),
  signature: z.string(),
  message: z.string(),
});

export class AuthController {
  async connectWallet(req: Request, res: Response) {
    try {
      const { address, signature, message } = connectWalletSchema.parse(req.body);
      
      const result = await authService.authenticateWallet({
        address,
        signature,
        message,
      });
      
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
  
  async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      const result = await authService.refreshToken(refreshToken);
      
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
      });
    }
  }
  
  async logout(req: Request, res: Response) {
    try {
      const userId = req.user.id;
      await authService.logout(userId);
      
      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Logout failed',
      });
    }
  }
}