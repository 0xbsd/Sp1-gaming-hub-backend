import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/zkgaming',
  },
  
  redis: {
    url: process.env.REDIS_URL || 'https://pleasing-seagull-45766.upstash.io',
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  
  blockchain: {
    rpcUrl: process.env.RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/your-key',
    chainId: parseInt(process.env.CHAIN_ID || '1'),
  },
  
  succinct: {
    apiKey: process.env.SUCCINCT_API_KEY,
    statsApiUrl: process.env.SUCCINCT_STATS_API || 'https://api.succinct.xyz/stats',
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  },
  
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  },
};