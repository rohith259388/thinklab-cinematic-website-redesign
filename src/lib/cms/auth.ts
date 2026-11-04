import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHash,
} from 'node:crypto';
import { cookies } from 'next/headers';
import { getDb } from './store';
import type { Role } from './schema';

export const hashToken = (s: string) =>
  createHash('sha256').update(s).digest('hex');

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  return salt + ':' + scryptSync(password, salt, 64).toString('hex');
}

export function verifyPassword(password: string, hash: string) {
  const [salt, key] = hash.split(':');
  if (!salt || !key) return false;
  const actual = scryptSync(password, salt, 64),
    expected = Buffer.from(key, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function session() {
  const token = (await cookies()).get('cms_session')?.value;
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
  if (!token || !uri) return null;
  try {
    const db = await getDb();
    const tokenHash = hashToken(token);
    const s = await db.collection('cms_sessions').findOne({
      token: tokenHash,
      expires: { $gt: new Date() },
    });
    if (!s) return null;
    const u = await db.collection('cms_users').findOne({ id: s.user_id });
    if (!u) return null;
    return { id: u.id, email: u.email, role: u.role as Role };
  } catch {
    return null;
  }
}

export async function requireUser(publish = false) {
  const u = await session();
  if (!u) throw new Error('Unauthorized');
  if (publish && u.role === 'editor') throw new Error('Forbidden');
  return u;
}
