import { Server, Socket } from 'socket.io';

export function gameHandlers(io: Server, socket: Socket) {
  // Join game room
  socket.on('game:join', async (data: { gameId: string; sessionId: string }) => {
    const { gameId, sessionId } = data;
    const roomName = `game:${gameId}:${sessionId}`;
    
    socket.join(roomName);
    socket.emit('game:joined', { roomName });
    
    // Notify others in the game
    socket.to(roomName).emit('game:playerJoined', {
      userId: socket.data.user.id,
      username: socket.data.user.username,
    });
  });
  
  // Game state updates
  socket.on('game:updateState', async (data: any) => {
    const { gameId, sessionId, state } = data;
    const roomName = `game:${gameId}:${sessionId}`;
    
    // Broadcast to all players in the game
    io.to(roomName).emit('game:stateUpdated', {
      userId: socket.data.user.id,
      state,
      timestamp: new Date(),
    });
  });
  
  // Proof generation progress
  socket.on('proof:generating', async (data: { progress: number }) => {
    socket.emit('proof:progress', data);
  });
  
  // Real-time score updates
  socket.on('game:scoreUpdate', async (data: { score: number; combo: number }) => {
    const { gameId, sessionId } = socket.data.currentGame || {};
    if (!gameId || !sessionId) return;
    
    const roomName = `game:${gameId}:${sessionId}`;
    
    io.to(roomName).emit('game:scoreUpdated', {
      userId: socket.data.user.id,
      score: data.score,
      combo: data.combo,
      timestamp: new Date(),
    });
  });
}