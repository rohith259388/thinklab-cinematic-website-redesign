import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHash,
} from 'node:crypto';
import { cookies } from 'next/headers';
import { query } from './store';
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
  if (!token || !process.env.DATABASE_URL) return null;
  const r = await query(
    'SELECT u.id,u.email,u.role FROM cms_sessions s JOIN cms_users u ON u.id=s.user_id WHERE s.token=$1 AND s.expires>now()',
    [hashToken(token)],
  );
  return r.rows[0] as { id: string; email: string; role: Role } | undefined;
}
export async function requireUser(publish = false) {
  const u = await session();
  if (!u) throw new Error('Unauthorized');
  if (publish && u.role === 'editor') throw new Error('Forbidden');
  return u;
}
