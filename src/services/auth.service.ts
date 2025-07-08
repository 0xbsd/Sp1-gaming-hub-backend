import * as jwt from 'jsonwebtoken';
import { ethers } from 'ethers';
import { prisma } from '../config/database';
import { redis } from '../config/redis';
import { config } from '../config/env';
import { logger } from '../utils/logger';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  private generateTokens(userId: string, address: string): AuthTokens {
    const accessToken = jwt.sign(
      { userId, address },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
    
    const refreshToken = jwt.sign(
      { userId, address, type: 'refresh' },
      config.jwt.secret,
      { expiresIn: '30d' }
    );
    
    return { accessToken, refreshToken };
  }
  
  async authenticateWallet(data: {
    address: string;
    signature: string;
    message: string;
  }): Promise<{ user: any; tokens: AuthTokens }> {
    try {
      // Verify signature
      const recoveredAddress = ethers.verifyMessage(data.message, data.signature);
      
      if (recoveredAddress.toLowerCase() !== data.address.toLowerCase()) {
        throw new Error('Invalid signature');
      }
      
      // Check if message is recent (prevent replay attacks)
      const messageTime = this.extractTimestampFromMessage(data.message);
      const currentTime = Date.now();
      const timeDiff = currentTime - messageTime;
      
      if (timeDiff > 5 * 60 * 1000) { // 5 minutes
        throw new Error('Message expired');
      }
      
      // Find or create user
      let user = await prisma.user.findUnique({
        where: { address: data.address.toLowerCase() },
      });
      
      if (!user) {
        user = await prisma.user.create({
          data: {
            address: data.address.toLowerCase(),
            username: `Player${Date.now().toString(36)}`,
          },
        });
      }
      
      // Generate tokens
      const tokens = this.generateTokens(user.id, user.address);
      
      // Store refresh token in Redis
      await redis.setex(
        `refresh_token:${user.id}`,
        30 * 24 * 60 * 60, // 30 days
        tokens.refreshToken
      );
      
      return { user, tokens };
    } catch (error) {
      logger.error('Wallet authentication failed:', error);
      throw error;
    }
  }
  
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.secret) as any;
      
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }
      
      // Check if token exists in Redis
      const storedToken = await redis.get(`refresh_token:${decoded.userId}`);
      
      if (!storedToken || storedToken !== refreshToken) {
        throw new Error('Invalid refresh token');
      }
      
      // Generate new tokens
      const tokens = this.generateTokens(decoded.userId, decoded.address);
      
      // Update refresh token in Redis
      await redis.setex(
        `refresh_token:${decoded.userId}`,
        30 * 24 * 60 * 60,
        tokens.refreshToken
      );
      
      return tokens;
    } catch (error) {
      logger.error('Token refresh failed:', error);
      throw error;
    }
  }
  
  async logout(userId: string): Promise<void> {
    await redis.del(`refresh_token:${userId}`);
  }
  
  private extractTimestampFromMessage(message: string): number {
    const match = message.match(/Timestamp: (\d+)/);
    return match ? parseInt(match[1]) : 0;
  }
}

export const authService = new AuthService();