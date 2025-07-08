export interface GameModel {
  id: string;
  name: string;
  slug: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  category: string;
  iconUrl?: string;
  isActive: boolean;
  settings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}