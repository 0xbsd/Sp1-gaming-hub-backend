export const SOCKET_EVENTS = {
  // Connection events
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  
  // Authentication
  AUTH_SUCCESS: 'auth:success',
  AUTH_FAILURE: 'auth:failure',
  
  // Game events
  GAME_JOIN: 'game:join',
  GAME_JOINED: 'game:joined',
  GAME_LEAVE: 'game:leave',
  GAME_LEFT: 'game:left',
  GAME_START: 'game:start',
  GAME_STARTED: 'game:started',
  GAME_UPDATE: 'game:update',
  GAME_STATE_UPDATED: 'game:stateUpdated',
  GAME_END: 'game:end',
  GAME_ENDED: 'game:ended',
  
  // Player events
  PLAYER_JOINED: 'game:playerJoined',
  PLAYER_LEFT: 'game:playerLeft',
  PLAYER_READY: 'player:ready',
  PLAYER_MOVE: 'player:move',
  PLAYER_SCORE: 'player:score',
  PLAYER_UPDATE: 'player:update',
  
  // Proof events
  PROOF_GENERATING: 'proof:generating',
  PROOF_PROGRESS: 'proof:progress',
  PROOF_GENERATED: 'proof:generated',
  PROOF_VERIFIED: 'proof:verified',
  PROOF_FAILED: 'proof:failed',
  
  // Score events
  SCORE_UPDATE: 'game:scoreUpdate',
  SCORE_UPDATED: 'game:scoreUpdated',
  LEADERBOARD_UPDATE: 'leaderboard:update',
  
  // Chat events
  CHAT_MESSAGE: 'chat:message',
  CHAT_TYPING: 'chat:typing',
  CHAT_STOP_TYPING: 'chat:stopTyping',
  
  // Notification events
  NOTIFICATION: 'notification',
  ACHIEVEMENT_UNLOCKED: 'achievement:unlocked',
  
  // Tournament events
  TOURNAMENT_UPDATE: 'tournament:update',
  TOURNAMENT_START: 'tournament:start',
  TOURNAMENT_END: 'tournament:end',
  MATCH_START: 'match:start',
  MATCH_END: 'match:end',
  
  // System events
  MAINTENANCE: 'system:maintenance',
  ANNOUNCEMENT: 'system:announcement',
};