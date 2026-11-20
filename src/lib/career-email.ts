/**
 * Notification email for a new job application. Same SMTP setup as lead-email.ts.
 */
import { sendMail } from './smtp';

export type Application = {
  name: string;
  email: string;
  phone: string;
  role: string;
  location: string | null;
  experience: string | null;
  portfolio: string | null;
  message: string | null;
  resumeName: string;
  createdAt: string;
};

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const headerSafe = (s: string, limit = 150) => s.replace(/\s+/g, ' ').trim().slice(0, limit);

export async function sendApplicationEmail(app: Application): Promise<void> {
  const smtpUser = (process.env.SMTP_USER ?? '').trim();
  const rawPass = (process.env.SMTP_PASS ?? '').trim();
  const smtpPass = rawPass.replace(/\s/g, '').length === 16 ? rawPass.replace(/\s/g, '') : rawPass;
  const admin = (process.env.ADMIN_NOTIFICATION_EMAIL ?? 'info@thinklabdigitalsolutions.com').trim();
  if (!smtpUser || !smtpPass) {
    console.warn('[careers:mail] SMTP_USER / SMTP_PASS are not set — notification skipped.');
    return;
  }

  const rows: [string, string][] = [
    ['Role', app.role],
    ['Name', app.name],
    ['Email', app.email],
    ['Phone', app.phone],
    ['Location', app.location || 'Not provided'],
    ['Experience', app.experience || 'Not provided'],
    ['Portfolio', app.portfolio || 'Not provided'],
    ['Resume', `${app.resumeName} (open it in the business suite: Careers → Applications)`],
    ['Received', app.createdAt],
  ];
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;color:#18181b;max-width:600px">
<h2 style="margin:0 0 16px">New application: ${esc(app.role)}</h2>
<table cellpadding="8" style="border-collapse:collapse;width:100%">${rows
    .map(([k, v]) => `<tr><td style="color:#8c887b;width:30%;border-bottom:1px solid #ece9e2">${k}</td><td style="border-bottom:1px solid #ece9e2">${esc(v)}</td></tr>`)
    .join('')}</table>
${app.message ? `<p style="margin:20px 0 6px;color:#8c887b">Cover note</p><p style="white-space:pre-wrap;margin:0">${esc(app.message)}</p>` : ''}
</div>`;
  const text = [`New application: ${app.role}`, '', ...rows.map(([k, v]) => `${k}: ${v}`), '', app.message ? `Cover note:\n${app.message}` : ''].join('\n');

  await sendMail(
    { host: process.env.SMTP_HOST || 'smtp.gmail.com', port: 465, username: smtpUser, password: smtpPass, heloName: 'thinklabdigitalsolutions.com' },
    {
      from: { name: 'ThinkLab Careers', email: smtpUser },
      to: { email: admin },
      subject: headerSafe(`New application: ${app.role} - ${app.name}`),
      text,
      html,
    },
  );
}
