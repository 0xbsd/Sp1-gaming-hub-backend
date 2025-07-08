import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient({
  log: ['error', 'warn'],
  errorFormat: 'pretty',
});

export async function connectDatabase() {
  try {
    await prisma.$connect();
    logger.info('✅ Database connected successfully');
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    throw error;
  }
}

export async function disconnectDatabase() {
  await prisma.$disconnect();
}

// Handle graceful shutdown
process.on('beforeExit', async () => {
  await disconnectDatabase();
});

export { prisma };