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

export async function session(tokenOverride?: string) {
  let token = tokenOverride;
  if (!token) {
    try {
      const c = await cookies();
      token = c.get('cms_session')?.value;
    } catch {}
  }
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
    const userEmail = String(u.email || '').toLowerCase().trim();
    // All @thinklabdigitalsolutions.com and @thinklab.com users have full admin editing rights
    const isAdmin =
      u.role === 'admin' ||
      userEmail.endsWith('@thinklabdigitalsolutions.com') ||
      userEmail.endsWith('@thinklab.com') ||
      userEmail === (process.env.DEFAULT_ADMIN_EMAIL || 'admin@thinklab.com').toLowerCase().trim();
    const finalRole: Role = isAdmin ? 'admin' : ((u.role as Role) || 'editor');
    return { id: u.id, email: u.email, role: finalRole };
  } catch {
    return null;
  }
}

export async function requireUser(publish = false, tokenOverride?: string) {
  const u = await session(tokenOverride);
  if (!u) throw new Error('Unauthorized');
  if (publish && u.role === 'editor') throw new Error('Forbidden');
  return u;
}
