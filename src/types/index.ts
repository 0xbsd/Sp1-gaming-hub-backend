export interface User {
  id: string;
  address: string;
  username?: string;
  email?: string;
  avatar?: string;
  level: number;
  experience: number;
  zkPoints: number;
  achievements: Achievement[];
  statistics: UserStatistics;
  createdAt: Date;
  updatedAt: Date;
}

export interface Game {
  id: string;
  name: string;
  slug: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  category: string;
  iconUrl?: string;
  isActive: boolean;
  playerCount: number;
  settings: GameSettings;
  createdAt: Date;
}

export interface GameSession {
  id: string;
  gameId: string;
  userId: string;
  status: 'active' | 'completed' | 'abandoned';
  score: number;
  timeElapsed: number;
  proofData?: any;
  startedAt: Date;
  completedAt?: Date;
}

export interface Proof {
  id: string;
  userId: string;
  gameId: string;
  sessionId: string;
  proofType: string;
  proofData: any;
  verificationStatus: 'pending' | 'verified' | 'failed';
  generationTime: number;
  gasUsed?: bigint;
  createdAt: Date;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirements: AchievementRequirement[];
  zkPoints: number;
  unlockedBy: string[];
}

export interface Tournament {
  id: string;
  name: string;
  gameId: string;
  status: 'upcoming' | 'active' | 'completed';
  entryFee?: bigint;
  prizePool: bigint;
  maxParticipants: number;
  participants: TournamentParticipant[];
  startTime: Date;
  endTime: Date;
  rules: TournamentRules;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  score: number;
  gamesPlayed: number;
  winRate: number;
  zkPoints: number;
  proofGenerationSpeed: number;
}