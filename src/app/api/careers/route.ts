import { NextResponse, after } from 'next/server';
import { Binary } from 'mongodb';
import { getDb, releaseDb } from '@/db';
import { sendApplicationEmail } from '@/lib/career-email';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+()\-\s0-9]{7,20}$/;
const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const RESUME_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

export const dynamic = 'force-dynamic';

const str = (v: FormDataEntryValue | null, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const fail = (error: string, status = 422) => NextResponse.json({ ok: false, error }, { status });

/**
 * Job applications from the careers pages. Saved to `career_applications`;
 * the business suite (CRM) imports them into Careers → Applications.
 */
export async function POST(req: Request) {
  try {
    const form = await req.formData().catch(() => null);
    if (!form) return fail('Invalid submission.', 400);

    // Honeypot: real visitors never see or fill this field.
    if (str(form.get('website'), 200)) return NextResponse.json({ ok: true, message: 'Application received.' });

    const name = str(form.get('name'), 160);
    const email = str(form.get('email'), 220);
    const phone = str(form.get('phone'), 40);
    const role = str(form.get('role'), 200);
    const roleSlug = str(form.get('roleSlug'), 200) || null;
    const location = str(form.get('location'), 160) || null;
    const experience = str(form.get('experience'), 60) || null;
    const portfolio = str(form.get('portfolio'), 500) || null;
    const message = str(form.get('message'), 4000) || null;
    const resume = form.get('resume');

    if (name.length < 2) return fail('Please tell us your name.');
    if (!EMAIL_RE.test(email)) return fail('Please use a valid email address.');
    if (!PHONE_RE.test(phone)) return fail('Please enter a valid phone number.');
    if (role.length < 2) return fail('Please choose the role you are applying for.');
    if (portfolio && !/^https?:\/\/\S+$/i.test(portfolio)) return fail('Portfolio / LinkedIn must be a full link starting with https://');
    if (!(resume instanceof File) || resume.size === 0) return fail('Please attach your resume.');
    if (resume.size > MAX_RESUME_BYTES) return fail('Your resume must be 5 MB or smaller.');
    const ext = (resume.name.split('.').pop() || '').toLowerCase();
    if (!RESUME_TYPES[ext]) return fail('Resume must be a PDF or Word document (.pdf, .doc, .docx).');

    const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
    if (!uri) return fail('Online applications are temporarily unavailable. Please email info@thinklabdigitalsolutions.com.', 503);

    const bytes = new Uint8Array(await resume.arrayBuffer());
    const db = await getDb();
    const createdAt = new Date();
    await db.collection('career_applications').insertOne({
      name,
      email,
      phone,
      role,
      roleSlug,
      location,
      experience,
      portfolio,
      message,
      resume: {
        name: resume.name.replace(/[\\/\x00-\x1f]/g, '_').slice(0, 200),
        type: RESUME_TYPES[ext],
        size: resume.size,
        data: new Binary(bytes),
      },
      createdAt,
    });

    after(() =>
      sendApplicationEmail({
        name, email, phone, role, location, experience, portfolio, message,
        resumeName: resume.name,
        createdAt: createdAt.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) + ' IST',
      }).catch((err) => console.error('[careers:mail] notification failed:', err)),
    );

    return NextResponse.json({ ok: true, message: 'Your application has been received. Our team will get in touch if your profile is a fit.' });
  } catch (err) {
    console.error('[careers] insert failed', err);
    return fail('We could not submit your application right now. Please try again.', 500);
  } finally {
    await releaseDb();
  }
}
