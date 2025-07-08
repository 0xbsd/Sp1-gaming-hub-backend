export interface UserModel {
  id: string;
  address: string;
  username?: string;
  email?: string;
  avatar?: string;
  level: number;
  experience: number;
  zkPoints: number;
  createdAt: Date;
  updatedAt: Date;
}