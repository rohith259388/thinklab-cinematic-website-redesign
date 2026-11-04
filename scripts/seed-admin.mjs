#!/usr/bin/env node
import { randomBytes, randomUUID, scryptSync } from 'node:crypto';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Load environment variables from .env.local
dotenv.config({ path: path.join(rootDir, '.env.local') });

const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
if (!uri) {
  console.error('\n❌ ERROR: MONGODB_URI is not set.');
  console.error('Please configure your MongoDB connection string in .env.local first.\n');
  process.exit(1);
}

// Parse custom arguments or use defaults
// Password MUST be at least 14 characters to satisfy ThinkLab CMS rules
const args = process.argv.slice(2);
let email = process.env.DEFAULT_ADMIN_EMAIL || 'admin@thinklab.com';
let password = process.env.DEFAULT_ADMIN_PASSWORD || 'AdminThinkLab2026!';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--email' && args[i + 1]) email = args[i + 1];
  if (args[i] === '--password' && args[i + 1]) password = args[i + 1];
}

if (password.length < 14) {
  console.error('\n❌ ERROR: Password must be at least 14 characters long.\n');
  process.exit(1);
}

if (!email.includes('@')) {
  console.error('\n❌ ERROR: Invalid email address.\n');
  process.exit(1);
}

async function seed() {
  console.log('Connecting to MongoDB Atlas...');
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('thinklab');

    // 1. Ensure indexes
    await Promise.allSettled([
      db.collection('cms_users').createIndex({ email: 1 }, { unique: true }),
      db.collection('cms_documents').createIndex({ kind: 1, slug: 1 }, { unique: true }),
      db.collection('cms_sessions').createIndex({ token: 1 }, { unique: true }),
    ]);

    // 2. Hash password with scrypt (matches src/lib/cms/auth.ts)
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');
    const storedHash = `${salt}:${hash}`;

    const normalizedEmail = email.toLowerCase().trim();

    // 3. Upsert admin user
    await db.collection('cms_users').updateOne(
      { email: normalizedEmail },
      {
        $set: {
          password: storedHash,
          role: 'admin',
        },
        $setOnInsert: {
          id: randomUUID(),
          email: normalizedEmail,
        },
      },
      { upsert: true }
    );

    const origin = process.env.CMS_ORIGIN || 'http://localhost:3000';

    console.log('\n==================================================');
    console.log('🎉 ThinkLab Studio Admin Account Ready on MongoDB!');
    console.log('==================================================');
    console.log(` Admin URL:  ${origin}/admin`);
    console.log(` Email:      ${normalizedEmail}`);
    console.log(` Password:   ${password}`);
    console.log('==================================================\n');
  } catch (err) {
    console.error('\n❌ Failed to seed admin user:', err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seed();
