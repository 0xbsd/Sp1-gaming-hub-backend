export const CONSTANTS = {
  // Game configuration
  GAMES: {
    PROOF_PUZZLE: 'proof-puzzle',
    ZK_SUDOKU: 'zk-sudoku',
    MEMORY_MATRIX: 'memory-matrix',
    PROOF_RACING: 'proof-racing',
  },
  
  // Points system
  POINTS: {
    BASE_GAME_COMPLETION: 100,
    DIFFICULTY_MULTIPLIER: {
      easy: 1,
      medium: 1.5,
      hard: 2,
      expert: 3,
    },
    TIME_BONUS_THRESHOLD: 300, // 5 minutes
    TIME_BONUS_POINTS: 50,
    HINT_PENALTY: 10,
    STREAK_MULTIPLIER: 1.1,
  },
  
  // Session configuration
  SESSION: {
    IDLE_TIMEOUT: 30 * 60 * 1000, // 30 minutes
    MAX_DURATION: 2 * 60 * 60 * 1000, // 2 hours
  },
  
  // Leaderboard
  LEADERBOARD: {
    DEFAULT_LIMIT: 100,
    MAX_LIMIT: 500,
    CACHE_TTL: 300, // 5 minutes
  },
  
  // Achievements
  ACHIEVEMENTS: {
    FIRST_GAME: 'first-game',
    FIRST_WIN: 'first-win',
    STREAK_5: 'streak-5',
    STREAK_10: 'streak-10',
    SPEED_DEMON: 'speed-demon',
    PERFECTIONIST: 'perfectionist',
  },
  
  // WebSocket events
  SOCKET_EVENTS: {
    // Game events
    GAME_JOIN: 'game:join',
    GAME_LEAVE: 'game:leave',
    GAME_START: 'game:start',
    GAME_UPDATE: 'game:update',
    GAME_END: 'game:end',
    
    // Player events
    PLAYER_READY: 'player:ready',
    PLAYER_MOVE: 'player:move',
    PLAYER_SCORE: 'player:score',
    
    // Chat events
    CHAT_MESSAGE: 'chat:message',
    CHAT_TYPING: 'chat:typing',
    
    // System events
    ERROR: 'error',
    DISCONNECT: 'disconnect',
  },
};
