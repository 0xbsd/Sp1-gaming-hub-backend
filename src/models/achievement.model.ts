export interface AchievementModel {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirements: AchievementRequirement[];
  zkPoints: number;
  createdAt: Date;
}

export interface AchievementRequirement {
  type: 'games_played' | 'score_reached' | 'streak' | 'proofs_generated' | 'custom';
  value: number;
  gameId?: string;
}