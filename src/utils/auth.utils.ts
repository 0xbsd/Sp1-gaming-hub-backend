import jwt from 'jsonwebtoken';
import { config } from '../config/env';

export async function verifySocketToken(token: string): Promise<any> {
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

export function generateGameToken(gameId: string, userId: string): string {
  return jwt.sign(
    { gameId, userId },
    config.jwt.secret,
    { expiresIn: '2h' }
  );
}

export function verifyGameToken(token: string): { gameId: string; userId: string } {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as any;
    return { gameId: decoded.gameId, userId: decoded.userId };
  } catch {
    throw new Error('Invalid game token');
  }
}
