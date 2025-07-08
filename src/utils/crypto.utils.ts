import crypto from 'crypto';
import bcrypt from 'bcrypt';

export function generateRandomString(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

export function generateSessionId(): string {
  return `session_${Date.now()}_${generateRandomString(16)}`;
}

export function generateProofId(): string {
  return `proof_${Date.now()}_${generateRandomString(16)}`;
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateNonce(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function hashData(data: any): string {
  const str = typeof data === 'string' ? data : JSON.stringify(data);
  return crypto.createHash('sha256').update(str).digest('hex');
}

export function verifySignature(
  message: string,
  signature: string,
  publicKey: string
): boolean {
  try {
    // Implementation depends on your signature scheme
    // This is a placeholder
    return true;
  } catch {
    return false;
  }
}
