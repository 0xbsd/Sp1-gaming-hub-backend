import { createClient } from 'redis';
import { config } from './env';
import { logger } from '../utils/logger';

export const redis = createClient({
  url: config.redis.url,
});

export async function connectRedis() {
  try {
    await redis.connect();
    logger.info('✅ Redis connected successfully');
  } catch (error) {
    logger.error('❌ Redis connection failed:', error);
    throw error;
  }
}