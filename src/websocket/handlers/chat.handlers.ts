import { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS } from '../events';
import { z } from 'zod';

const chatMessageSchema = z.object({
  gameId: z.string().optional(),
  message: z.string().min(1).max(500),
});

export function chatHandlers(io: Server, socket: Socket) {
  socket.on(SOCKET_EVENTS.CHAT_MESSAGE, async (data) => {
    try {
      const validated = chatMessageSchema.parse(data);
      const userId = socket.data.user.id;
      const username = socket.data.user.username || 'Anonymous';
      
      const message = {
        id: Date.now().toString(),
        userId,
        username,
        message: validated.message,
        timestamp: new Date().toISOString(),
      };
      
      if (validated.gameId) {
        // Send to game room
        io.to(`game:${validated.gameId}`).emit(SOCKET_EVENTS.CHAT_MESSAGE, message);
      } else {
        // Send to global chat
        io.emit(SOCKET_EVENTS.CHAT_MESSAGE, message);
      }
    } catch (error) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: 'Invalid message format' });
    }
  });
  
  socket.on(SOCKET_EVENTS.CHAT_TYPING, (data: { gameId?: string }) => {
    const room = data.gameId ? `game:${data.gameId}` : 'global';
    socket.to(room).emit(SOCKET_EVENTS.CHAT_TYPING, {
      userId: socket.data.user.id,
      username: socket.data.user.username,
    });
  });
  
  socket.on(SOCKET_EVENTS.CHAT_STOP_TYPING, (data: { gameId?: string }) => {
    const room = data.gameId ? `game:${data.gameId}` : 'global';
    socket.to(room).emit(SOCKET_EVENTS.CHAT_STOP_TYPING, {
      userId: socket.data.user.id,
    });
  });
}