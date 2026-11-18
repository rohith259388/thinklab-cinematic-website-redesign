/**
 * Minimal SMTP client over implicit TLS (port 465), built only on `node:tls`.
 *
 * `node:tls` is native in Cloudflare Workers (nodejs_compat) and in Node.js, so
 * the same code sends mail from `next dev` and from the deployed Worker without
 * spawning processes or importing `cloudflare:sockets` (which OpenNext's
 * bundler cannot resolve).
 */
import tls from 'node:tls';
import { Buffer } from 'node:buffer';

export type Address = { name?: string; email: string };

export type SmtpOptions = {
  host: string;
  port?: number; // implicit TLS port, default 465
  username: string;
  password: string;
  heloName?: string;
  timeoutMs?: number;
};

export type MailOptions = {
  from: Address;
  to: Address;
  replyTo?: Address;
  subject: string;
  text: string;
  html: string;
  headers?: Record<string, string>;
  messageIdDomain?: string;
};

// ---------------------------------------------------------------------------
// MIME
// ---------------------------------------------------------------------------
const oneLine = (s: string) => s.replace(/[\r\n]+/g, ' ').trim();

/** RFC 2047 encoded-word when the value is not plain printable ASCII. */
function encodeWord(value: string): string {
  const v = oneLine(value);
  return /^[\x20-\x7e]*$/.test(v) ? v : `=?UTF-8?B?${Buffer.from(v, 'utf8').toString('base64')}?=`;
}

function formatAddress({ name, email }: Address): string {
  const addr = oneLine(email);
  if (!name) return `<${addr}>`;
  const n = oneLine(name);
  const display = /^[\x20-\x7e]*$/.test(n) ? `"${n.replace(/["\\]/g, '\\$&')}"` : encodeWord(n);
  return `${display} <${addr}>`;
}

/** Base64 body wrapped at 76 chars: no long lines and no leading dots to stuff. */
const base64Body = (s: string) =>
  Buffer.from(s, 'utf8').toString('base64').replace(/.{1,76}/g, '$&\r\n');

export function buildMime(mail: MailOptions): string {
  const boundary = `=_tl_${crypto.randomUUID().replace(/-/g, '')}`;
  const domain = mail.messageIdDomain || mail.from.email.split('@')[1] || 'localhost';
  const headers: Record<string, string> = {
    From: formatAddress(mail.from),
    To: formatAddress(mail.to),
    ...(mail.replyTo ? { 'Reply-To': formatAddress(mail.replyTo) } : {}),
    Subject: encodeWord(mail.subject),
    Date: new Date().toUTCString().replace('GMT', '+0000'),
    'Message-ID': `<${crypto.randomUUID()}@${domain}>`,
    'MIME-Version': '1.0',
    ...Object.fromEntries(Object.entries(mail.headers ?? {}).map(([k, v]) => [oneLine(k), oneLine(v)])),
    'Content-Type': `multipart/alternative; boundary="${boundary}"`,
  };

  return [
    ...Object.entries(headers).map(([k, v]) => `${k}: ${v}`),
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    base64Body(mail.text),
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    base64Body(mail.html),
    `--${boundary}--`,
    '',
  ].join('\r\n');
}

// ---------------------------------------------------------------------------
// SMTP conversation
// ---------------------------------------------------------------------------
export async function sendMail(opts: SmtpOptions, mail: MailOptions): Promise<void> {
  const timeoutMs = opts.timeoutMs ?? 20000;
  const socket = tls.connect({ host: opts.host, port: opts.port ?? 465, servername: opts.host });
  socket.setEncoding('utf8');

  let buffer = '';
  let waiter: { resolve: (r: { code: number; text: string }) => void; reject: (e: Error) => void } | null = null;
  let failure: Error | null = null;

  const tryResolve = () => {
    if (!waiter) return;
    // A complete reply ends with a line "NNN text" (no hyphen after the code).
    const lines = buffer.split('\r\n');
    const endIdx = lines.findIndex((l) => /^\d{3}(?: |$)/.test(l));
    if (endIdx === -1) return;
    const reply = lines.slice(0, endIdx + 1);
    buffer = lines.slice(endIdx + 1).join('\r\n');
    const w = waiter;
    waiter = null;
    w.resolve({ code: Number(reply[endIdx].slice(0, 3)), text: reply.join('\n') });
  };

  socket.on('data', (chunk: string) => {
    buffer += chunk;
    tryResolve();
  });
  const fail = (err: Error) => {
    failure = err;
    if (waiter) {
      const w = waiter;
      waiter = null;
      w.reject(err);
    }
  };
  socket.on('error', fail);
  socket.on('close', () => fail(new Error('SMTP connection closed unexpectedly')));

  const read = () =>
    new Promise<{ code: number; text: string }>((resolve, reject) => {
      if (failure) return reject(failure);
      const timer = setTimeout(() => fail(new Error('SMTP response timed out')), timeoutMs);
      waiter = {
        resolve: (r) => (clearTimeout(timer), resolve(r)),
        reject: (e) => (clearTimeout(timer), reject(e)),
      };
      tryResolve();
    });

  const expect = async (codes: number[], step: string) => {
    const reply = await read();
    if (!codes.includes(reply.code)) throw new Error(`SMTP ${step} failed: ${reply.text}`);
    return reply;
  };

  const command = async (line: string, codes: number[], step: string) => {
    socket.write(`${line}\r\n`);
    return expect(codes, step);
  };

  try {
    await expect([220], 'greeting');
    await command(`EHLO ${opts.heloName || 'localhost'}`, [250], 'EHLO');
    const token = Buffer.from(`\0${opts.username}\0${opts.password}`, 'utf8').toString('base64');
    await command(`AUTH PLAIN ${token}`, [235], 'AUTH');
    await command(`MAIL FROM:<${oneLine(mail.from.email)}>`, [250], 'MAIL FROM');
    await command(`RCPT TO:<${oneLine(mail.to.email)}>`, [250, 251], 'RCPT TO');
    await command('DATA', [354], 'DATA');
    socket.write(buildMime(mail));
    await command('.', [250], 'message body');
    socket.write('QUIT\r\n');
  } finally {
    socket.removeAllListeners('close');
    socket.on('error', () => {}); // ignore errors after we are done
    socket.end();
  }
}
