import { ethers } from 'ethers';

export function validateAddress(address: string): boolean {
  try {
    return ethers.isAddress(address);
  } catch {
    return false;
  }
}

export function validateUsername(username: string): boolean {
  // Username rules: 3-20 chars, alphanumeric + underscore
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  return usernameRegex.test(username);
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function sanitizeInput(input: string): string {
  // Remove any HTML tags and trim whitespace
  return input.replace(/<[^>]*>/g, '').trim();
}

export function validateGameSettings(settings: any, gameType: string): boolean {
  // Validate settings based on game type
  switch (gameType) {
    case 'proof-puzzle':
      return true; // No special settings
      
    case 'zk-sudoku':
      return (
        !settings.difficulty ||
        ['easy', 'medium', 'hard'].includes(settings.difficulty)
      );
      
    case 'memory-matrix':
      return (
        !settings.gridSize ||
        (settings.gridSize >= 3 && settings.gridSize <= 6)
      );
      
    case 'proof-racing':
      return (
        !settings.difficulty ||
        ['sprint', 'circuit', 'endurance'].includes(settings.difficulty)
      );
      
    default:
      return true;
  }
}

export function validateScore(score: number, gameType: string): boolean {
  // Validate score ranges based on game type
  const scoreRanges: Record<string, { min: number; max: number }> = {
    'proof-puzzle': { min: 0, max: 10000 },
    'zk-sudoku': { min: 0, max: 5000 },
    'memory-matrix': { min: 0, max: 10000 },
    'proof-racing': { min: 0, max: 20000 },
  };
  
  const range = scoreRanges[gameType];
  if (!range) return true;
  
  return score >= range.min && score <= range.max;
}