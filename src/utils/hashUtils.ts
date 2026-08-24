import crypto from 'crypto';

/**
 * Generate SHA-256 hash of a JSON object
 * @param data - Object or string to hash
 * @returns SHA-256 hash string
 */
export function generateHash(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}
