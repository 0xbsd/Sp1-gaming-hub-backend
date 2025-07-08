export interface TournamentModel {
  id: string;
  name: string;
  gameId: string;
  status: 'upcoming' | 'active' | 'completed';
  entryFee?: bigint;
  prizePool: bigint;
  maxParticipants: number;
  startTime: Date;
  endTime: Date;
  rules: TournamentRules;
  createdAt: Date;
}

export interface TournamentRules {
  format: 'single-elimination' | 'round-robin' | 'swiss';
  timeLimit?: number;
  scoreSystem: 'highest' | 'cumulative' | 'average';
}