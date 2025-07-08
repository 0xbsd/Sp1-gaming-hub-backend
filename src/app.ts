import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { config } from './config/env';
import { errorHandler } from './middleware/error.middleware';
import { rateLimiter } from './middleware/rateLimit.middleware';
import routes from './routes';
import { initializeWebSocket } from './websocket/server';
import { connectDatabase } from './config/database';
import { connectRedis } from './config/redis';
import { logger } from './utils/logger';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: config.cors.origin,
    credentials: true,
  },
});

// Middleware
app.use(helmet());
app.use(cors({ origin: config.cors.origin, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

// Routes
app.use('/api/v1', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: packageJson.version 
  });
});

// Error handling
app.use(errorHandler);

// Initialize services
async function startServer() {
  try {
    // Connect to databases
    await connectDatabase();
    await connectRedis();
    
    // Initialize WebSocket
    initializeWebSocket(io);
    
    // Start server
    httpServer.listen(config.port, () => {
      logger.info(`🚀 Server running on port ${config.port}`);
      logger.info(`📡 WebSocket server initialized`);
      logger.info(`🔗 Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();


