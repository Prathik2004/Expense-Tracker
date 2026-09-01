import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';

const ALGORITHM = 'aes-256-gcm';

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET;
  if (!key) throw new Error('ENCRYPTION_KEY or JWT_SECRET must be set for token encryption');
  // ensure 32 bytes
  return Buffer.from(key.padEnd(32).slice(0, 32));
}

export function encrypt(text: string): string {
  const iv = randomBytes(12);
  const key = getKey();
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

export function decrypt(encoded: string): string {
  const b = Buffer.from(encoded, 'base64');
  const iv = b.slice(0, 12);
  const tag = b.slice(12, 28);
  const data = b.slice(28);
  const key = getKey();
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString('utf8');
}
