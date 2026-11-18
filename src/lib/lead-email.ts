/**
 * Lead notification email — rendering + delivery.
 *
 * Production runs on Cloudflare Workers, which cannot spawn processes, so the
 * email is sent over Gmail SMTP (port 465, TLS) with `worker-mailer`, which
 * uses Cloudflare TCP sockets. In local `next dev` (plain Node.js) the same
 * rendered email is handed to scripts/send_lead_email.py instead.
 *
 * Required env (Workers: `wrangler secret put …`, local: .env.local):
 *   SMTP_USER, SMTP_PASS, ADMIN_NOTIFICATION_EMAIL   optional: SMTP_FROM, SITE_URL
 */

export type Lead = {
  name: string;
  email: string;
  company: string | null;
  service: string | null;
  message: string;
  source: string;
  createdAt: string; // already formatted for display
};

export type RenderedEmail = { subject: string; html: string; text: string };

// ---------------------------------------------------------------------------
// Rendering (white & warm-beige editorial palette)
//   canvas #f7f6f2 · card #ffffff · inset #faf9f6 · hairline #ece9e2
//   ink #18181b · body #2b2a27 · muted #8c887b · chip #eeece5
// ---------------------------------------------------------------------------
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** Collapse whitespace/CR/LF so visitor input can never inject email headers. */
const headerSafe = (s: string, limit = 120) => s.replace(/\s+/g, ' ').trim().slice(0, limit);

function fields(lead: Lead) {
  const source = (lead.source || 'contact').replace(/-/g, ' ');
  return {
    name: lead.name.trim() || 'Website visitor',
    email: lead.email.trim(),
    company: lead.company?.trim() || 'Not provided',
    service: lead.service?.trim() || 'General enquiry',
    message: lead.message.trim() || 'No message provided.',
    source: source.charAt(0).toUpperCase() + source.slice(1),
    createdAt: lead.createdAt,
  };
}

function detailRow(label: string, valueHtml: string, last = false) {
  const border = last ? '' : 'border-bottom: 1px solid #ece9e2;';
  return `
                <tr>
                  <td class="stack label-cell" width="34%" valign="top" style="padding: 14px 0; ${border} font-family: ${MONO}; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #8c887b;">${label}</td>
                  <td class="stack" valign="top" style="padding: 14px 0; ${border} font-family: ${FONT}; font-size: 15px; line-height: 1.5; color: #18181b;">${valueHtml}</td>
                </tr>`;
}

export function renderLeadEmail(lead: Lead, siteUrl: string): RenderedEmail {
  const f = fields(lead);
  const e = Object.fromEntries(Object.entries(f).map(([k, v]) => [k, esc(v)])) as typeof f;
  const firstName = esc(f.name.split(/\s+/)[0]);
  const messageHtml = e.message.replace(/\r?\n/g, '<br>');
  const preheader = esc(`${f.service} · ${f.message.replace(/\s+/g, ' ').slice(0, 110)}`);

  const replyHref = f.email
    ? `mailto:${encodeURIComponent(f.email).replace(/%40/g, '@')}?subject=${encodeURIComponent('Re: Your enquiry with ThinkLab Digital Solutions')}`
    : '';
  const emailHtml = f.email
    ? `<a href="${esc(replyHref)}" style="color: #18181b; text-decoration: underline; text-decoration-color: #cfcabd;">${e.email}</a>`
    : 'Not provided';

  const rows = [
    detailRow('Name', `<strong style="font-weight: 600;">${e.name}</strong>`),
    detailRow('Email', emailHtml),
    detailRow('Company', e.company),
    detailRow(
      'Service',
      `<span style="display: inline-block; padding: 3px 11px; background-color: #eeece5; border: 1px solid #ded9cd; border-radius: 999px; font-size: 13px; font-weight: 600; color: #433f38;">${e.service}</span>`,
    ),
    detailRow('Received', e.createdAt),
    detailRow('Source', `${e.source} form`, true),
  ].join('');

  const replyButton = replyHref
    ? `
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 0 0 4px 0;">
                <tr>
                  <td align="center" bgcolor="#18181b" style="border-radius: 10px;">
                    <a href="${esc(replyHref)}" style="display: inline-block; padding: 14px 26px; font-family: ${FONT}; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 10px;">Reply to ${firstName}&nbsp;&rarr;</a>
                  </td>
                </tr>
              </table>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>New enquiry from ${e.name}</title>
  <style type="text/css">
    body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; }
    a { color: #18181b; }
    @media only screen and (max-width: 620px) {
      .px { padding-left: 22px !important; padding-right: 22px !important; }
      .title { font-size: 24px !important; }
      .stack { display: block !important; width: 100% !important; }
      .label-cell { padding-bottom: 2px !important; border-bottom: 0 !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f7f6f2;">
  <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">${preheader}</div>
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#f7f6f2" style="background-color: #f7f6f2;">
    <tr>
      <td align="center" style="padding: 36px 14px;">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px;">
          <tr>
            <td style="padding: 0 6px 16px 6px;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="font-family: ${FONT}; font-size: 17px; font-weight: 700; letter-spacing: -0.01em; color: #18181b;">ThinkLab<span style="font-weight: 400; color: #8c887b;"> Digital Solutions</span></td>
                  <td align="right" style="font-family: ${MONO}; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #8c887b;">Lead alert</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #ffffff; border: 1px solid #e5e3dc; border-radius: 16px;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td class="px" style="padding: 36px 40px 28px 40px;">
                    <span style="display: inline-block; padding: 4px 12px; background-color: #f4f2ec; border: 1px solid #e4e0d7; border-radius: 999px; font-family: ${MONO}; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: #5c584e;">&#9679;&nbsp; New enquiry</span>
                    <h1 class="title" style="margin: 18px 0 10px 0; font-family: ${FONT}; font-size: 28px; font-weight: 600; line-height: 1.25; letter-spacing: -0.02em; color: #18181b;">${e.name} wants to talk about ${e.service}</h1>
                    <p style="margin: 0 0 26px 0; font-family: ${FONT}; font-size: 15px; line-height: 1.6; color: #6b675d;">${e.company} &middot; ${e.createdAt}</p>
                    ${replyButton}
                  </td>
                </tr>
                <tr>
                  <td class="px" style="padding: 0 40px 8px 40px;">
                    <p style="margin: 0 0 10px 0; font-family: ${MONO}; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #8c887b;">Their message</p>
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding: 20px 22px; background-color: #faf9f6; border: 1px solid #ece9e2; border-left: 3px solid #18181b; border-radius: 10px; font-family: ${FONT}; font-size: 15px; line-height: 1.7; color: #2b2a27; word-break: break-word;">${messageHtml}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td class="px" style="padding: 28px 40px 12px 40px;">
                    <p style="margin: 0 0 2px 0; font-family: ${MONO}; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #8c887b;">Lead details</p>
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">${rows}
                    </table>
                  </td>
                </tr>
                <tr>
                  <td class="px" style="padding: 16px 40px 32px 40px;">
                    <p style="margin: 0; font-family: ${FONT}; font-size: 13px; line-height: 1.6; color: #8c887b;">Replying to this email goes straight to ${firstName}. The lead is also saved in the <a href="${esc(siteUrl)}/admin" style="color: #433f38; text-decoration: underline; text-decoration-color: #cfcabd;">admin portal</a>.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding: 22px 6px 0 6px; font-family: ${FONT}; font-size: 12px; line-height: 1.6; color: #9c978b;">
              Sent automatically by the contact form on thinklabdigitalsolutions.com<br>
              ThinkLab Digital Solutions &middot; Vijayawada &amp; Sydney
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const rule = '-'.repeat(48);
  const text = [
    `New enquiry from ${f.name} - ${f.service}`,
    '='.repeat(48),
    '',
    `Name:     ${f.name}`,
    `Email:    ${f.email || 'Not provided'}`,
    `Company:  ${f.company}`,
    `Service:  ${f.service}`,
    `Received: ${f.createdAt}`,
    `Source:   ${f.source} form`,
    '',
    'Their message',
    rule,
    f.message,
    rule,
    '',
    `Reply to this email to respond directly to ${f.name}.`,
    `Admin portal: ${siteUrl}/admin`,
    '',
    'ThinkLab Digital Solutions - Vijayawada & Sydney',
    '',
  ].join('\n');

  return { subject: headerSafe(`New enquiry from ${f.name} - ${f.service}`, 150), html, text };
}

// ---------------------------------------------------------------------------
// Delivery
// ---------------------------------------------------------------------------
const isCloudflareWorker = () =>
  typeof navigator !== 'undefined' && navigator.userAgent === 'Cloudflare-Workers';

/** Display name from SMTP_FROM; the address is always SMTP_USER (SPF/DMARC alignment). */
function senderName() {
  const m = /^\s*"?([^"<]*?)"?\s*</.exec(process.env.SMTP_FROM ?? '');
  return m?.[1]?.trim() || 'ThinkLab Website';
}

export async function sendLeadEmail(lead: Lead): Promise<void> {
  const smtpUser = (process.env.SMTP_USER ?? '').trim();
  const rawPass = (process.env.SMTP_PASS ?? '').trim();
  const smtpPass = rawPass.replace(/\s/g, '').length === 16 ? rawPass.replace(/\s/g, '') : rawPass;
  const admin = (process.env.ADMIN_NOTIFICATION_EMAIL ?? 'info@thinklabdigitalsolutions.com').trim();
  const siteUrl = (process.env.SITE_URL ?? 'https://www.thinklabdigitalsolutions.com').replace(/\/+$/, '');

  if (!smtpUser || !smtpPass) {
    console.warn('[leads:mail] SMTP_USER / SMTP_PASS are not set — notification skipped.');
    return;
  }

  const rendered = renderLeadEmail(lead, siteUrl);
  const clientEmail = headerSafe(lead.email, 220);
  const replyTo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)
    ? { name: headerSafe(lead.name, 80), email: clientEmail }
    : undefined;

  if (isCloudflareWorker()) {
    const { WorkerMailer } = await import('worker-mailer');
    await WorkerMailer.send(
      {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: 465,
        secure: true,
        credentials: { username: smtpUser, password: smtpPass },
        authType: 'plain',
        name: 'thinklabdigitalsolutions.com',
        socketTimeoutMs: 15000,
        responseTimeoutMs: 15000,
      },
      {
        from: { name: senderName(), email: smtpUser },
        to: { email: admin },
        reply: replyTo,
        subject: rendered.subject,
        text: rendered.text,
        html: rendered.html,
        headers: { 'Auto-Submitted': 'auto-generated', 'X-Auto-Response-Suppress': 'OOF, AutoReply' },
      },
    );
    console.log(`[leads:mail] Delivered notification to ${admin} via SMTP`);
    return;
  }

  // Local Node.js (next dev / next start): hand the rendered email to the Python dispatcher.
  const { spawn } = await import('node:child_process');
  const path = await import('node:path');
  const scriptPath = path.join(process.cwd(), 'scripts', 'send_lead_email.py');
  const pythonBin = process.env.PYTHON_BIN || (process.platform === 'win32' ? 'python' : 'python3');

  await new Promise<void>((resolve, reject) => {
    const py = spawn(/*turbopackIgnore: true*/ pythonBin, [scriptPath], { stdio: ['pipe', 'pipe', 'pipe'] });
    py.stdout.on('data', (c) => console.log('[leads:mail]', c.toString().trim()));
    py.stderr.on('data', (c) => console.warn('[leads:mail:err]', c.toString().trim()));
    py.on('error', reject);
    py.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`send_lead_email.py exited with ${code}`))));
    py.stdin.end(JSON.stringify({ ...lead, rendered }));
  });
}
