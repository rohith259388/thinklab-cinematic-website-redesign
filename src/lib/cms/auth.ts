import {
  randomBytes,
  timingSafeEqual,
  createHash,
  pbkdf2Sync,
} from 'node:crypto';
import { cookies } from 'next/headers';
import { ObjectId } from 'mongodb';
import { getDb } from './store';
import type { Role } from './schema';

export const hashToken = (s: string) =>
  createHash('sha256').update(s).digest('hex');

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(password, salt, 1000, 32, 'sha256').toString('hex');
  return `pbkdf2:${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !password) return false;

  // Modern PBKDF2 format (fast & 100% compatible with Cloudflare Workers / workerd)
  if (storedHash.startsWith('pbkdf2:')) {
    const parts = storedHash.split(':');
    const salt = parts[1];
    const key = parts[2];
    if (!salt || !key) return false;
    const actual = pbkdf2Sync(password, salt, 1000, 32, 'sha256');
    const expected = Buffer.from(key, 'hex');
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }

  // Legacy format: salt:key
  const parts = storedHash.split(':');
  if (parts.length === 2) {
    const [salt, key] = parts;
    try {
      const { scryptSync } = require('node:crypto');
      if (typeof scryptSync === 'function') {
        const actual = scryptSync(password, salt, 64);
        const expected = Buffer.from(key, 'hex');
        if (actual.length === expected.length && timingSafeEqual(actual, expected)) {
          return true;
        }
      }
    } catch {}

    try {
      const actualPbk = pbkdf2Sync(password, salt, 1000, 32, 'sha256');
      const expected = Buffer.from(key, 'hex');
      if (actualPbk.length === expected.length && timingSafeEqual(actualPbk, expected)) {
        return true;
      }
    } catch {}
  }

  return false;
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
    const userQuery: any[] = [];
    if (s.user_id) {
      userQuery.push({ id: s.user_id });
      try {
        if (ObjectId.isValid(s.user_id)) {
          userQuery.push({ _id: new ObjectId(s.user_id) });
        }
      } catch {}
      userQuery.push({ _id: s.user_id });
    }
    if (s.email) {
      userQuery.push({ email: s.email });
    }
    const u = userQuery.length > 0 ? await db.collection('cms_users').findOne({ $or: userQuery }) : null;
    if (!u) return null;
    const userEmail = String(u.email || '').toLowerCase().trim();
    // All @thinklabdigitalsolutions.com and @thinklab.com users have full admin editing rights
    const isAdmin =
      u.role === 'admin' ||
      userEmail.endsWith('@thinklabdigitalsolutions.com') ||
      userEmail.endsWith('@thinklab.com') ||
      userEmail === (process.env.DEFAULT_ADMIN_EMAIL || 'admin@thinklab.com').toLowerCase().trim();
    const finalRole: Role = isAdmin ? 'admin' : ((u.role as Role) || 'editor');
    return { id: u.id || String(u._id), email: u.email, role: finalRole };
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
