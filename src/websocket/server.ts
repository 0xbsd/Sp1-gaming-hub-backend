import { Server, Socket } from 'socket.io';
import { verifySocketToken } from '../utils/auth.utils';
import { gameHandlers } from './handlers/game.handlers';
import { chatHandlers } from './handlers/chat.handlers';
import { notificationHandlers } from './handlers/notification.handlers';

export function initializeWebSocket(io: Server) {
  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const user = await verifySocketToken(token);
      socket.data.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });
  
  io.on('connection', (socket: Socket) => {
    console.log(`User ${socket.data.user.id} connected`);
    
    // Join user's personal room
    socket.join(`user:${socket.data.user.id}`);
    
    // Register handlers
    gameHandlers(io, socket);
    chatHandlers(io, socket);
    notificationHandlers(io, socket);
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User ${socket.data.user.id} disconnected`);
    });
  });
}