import { NextResponse } from 'next/server';
import { getDb, releaseDb } from '@/db';
import { SERVICES } from '@/lib/content';
import { spawn } from 'node:child_process';
import path from 'node:path';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ ok: false, error: 'Invalid payload.' }, { status: 400 });
    }

    const name = String(body.name ?? '').trim();
    const email = String(body.email ?? '').trim();
    const company = String(body.company ?? '').trim() || null;
    const service = String(body.service ?? '').trim() || null;
    const message = String(body.message ?? '').trim();
    const source = String(body.source ?? 'contact').slice(0, 60) || 'contact';

    if (name.length < 2) return NextResponse.json({ ok: false, error: 'Please tell us your name.' }, { status: 422 });
    if (!EMAIL_RE.test(email)) return NextResponse.json({ ok: false, error: 'Please use a valid email address.' }, { status: 422 });
    if (message.length < 10) return NextResponse.json({ ok: false, error: 'Give your idea a few more words (min 10 characters).' }, { status: 422 });
    if (service && !SERVICES.some((s) => s.title === service)) {
      return NextResponse.json({ ok: false, error: 'Unknown service selected.' }, { status: 422 });
    }

    const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
    if (!uri) {
      return NextResponse.json({ ok: false, error: 'Online enquiries are temporarily unavailable. Please email info@thinklabdigitalsolutions.com or call +91 93475 80911.' }, { status: 503 });
    }

    const db = await getDb();
    const createdAt = new Date();
    await db.collection('leads').insertOne({
      name: name.slice(0, 160),
      email: email.slice(0, 220),
      company: company?.slice(0, 220) ?? null,
      service,
      message: message.slice(0, 4000),
      source,
      createdAt,
    });

    // Asynchronously dispatch admin notification via Python script (unlimited, no paid API caps)
    try {
      const scriptPath = path.join(process.cwd(), 'scripts', 'send_lead_email.py');
      const pythonBin = process.env.PYTHON_BIN || (process.platform === 'win32' ? 'python' : 'python3');
      const py = spawn(/*turbopackIgnore: true*/ pythonBin, [scriptPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      const leadPayload = JSON.stringify({
        name,
        email,
        company,
        service,
        message,
        source,
        createdAt: createdAt.toLocaleString('en-US', {
          timeZone: 'Asia/Kolkata',
          dateStyle: 'medium',
          timeStyle: 'short',
        }),
      });

      py.stdin.write(leadPayload);
      py.stdin.end();

      py.stdout.on('data', (chunk) => {
        console.log('[leads:mail]', chunk.toString().trim());
      });

      py.stderr.on('data', (chunk) => {
        console.warn('[leads:mail:err]', chunk.toString().trim());
      });

      py.on('error', (err) => {
        console.warn('[leads:mail] Could not spawn Python mail script:', err.message);
      });
    } catch (mailErr) {
      console.warn('[leads:mail] Background dispatch exception:', mailErr);
    }

    return NextResponse.json({ ok: true, message: 'The idea has been received. We respond within one business day.' });
  } catch (err) {
    console.error('[leads] insert failed', err);
    return NextResponse.json({ ok: false, error: 'The laboratory is momentarily busy. Please try again.' }, { status: 500 });
  } finally {
    await releaseDb();
  }
}
