import { Server } from 'socket.io';
import { prisma } from '../config/database';
import { redis } from '../config/redis';
import { logger } from '../utils/logger';

export class NotificationService {
  private io: Server | null = null;
  
  setSocketServer(io: Server) {
    this.io = io;
  }
  
  async sendToUser(userId: string, event: string, data: any) {
    if (!this.io) {
      logger.warn('Socket.io server not initialized');
      return;
    }
    
    // Send to user's room
    this.io.to(`user:${userId}`).emit(event, data);
    
    // Store notification in database
    await this.storeNotification(userId, event, data);
  }
  
  async sendToGame(gameId: string, event: string, data: any) {
    if (!this.io) return;
    
    this.io.to(`game:${gameId}`).emit(event, data);
  }
  
  async sendToAll(event: string, data: any) {
    if (!this.io) return;
    
    this.io.emit(event, data);
  }
  
  async broadcast(event: string, data: any, excludeUserId?: string) {
    if (!this.io) return;
    
    if (excludeUserId) {
      this.io.except(`user:${excludeUserId}`).emit(event, data);
    } else {
      this.io.emit(event, data);
    }
  }
  
  private async storeNotification(userId: string, event: string, data: any) {
    const key = `notifications:${userId}`;
    const notification = {
      event,
      data,
      timestamp: new Date().toISOString(),
      read: false,
    };
    
    // Store in Redis list (keep last 100)
    await redis.lpush(key, JSON.stringify(notification));
    await redis.ltrim(key, 0, 99);
    await redis.expire(key, 7 * 24 * 60 * 60); // 7 days
  }
  
  async getUnreadNotifications(userId: string) {
    const key = `notifications:${userId}`;
    const notifications = await redis.lrange(key, 0, -1);
    
    return notifications
      .map(n => JSON.parse(n))
      .filter(n => !n.read);
  }
  
  async markAsRead(userId: string, notificationIds: string[]) {
    // Implementation depends on notification storage strategy
    // This is a simplified version
    const key = `notifications:${userId}`;
    const notifications = await redis.lrange(key, 0, -1);
    
    const updated = notifications.map(n => {
      const parsed = JSON.parse(n);
      if (notificationIds.includes(parsed.id)) {
        parsed.read = true;
      }
      return JSON.stringify(parsed);
    });
    
    await redis.del(key);
    if (updated.length > 0) {
      await redis.rpush(key, ...updated);
    }
  }
}

export const notificationService = new NotificationService();