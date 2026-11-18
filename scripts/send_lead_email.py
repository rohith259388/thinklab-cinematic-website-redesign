#!/usr/bin/env python3
"""
ThinkLab Digital Solutions - Lead Notification Dispatcher

Sends an admin notification (ADMIN_NOTIFICATION_EMAIL) whenever a visitor
submits the website contact form.

Deliverability notes
--------------------
Inbox placement is decided mostly by DNS authentication, not by this script:
  * SPF  : the domain's SPF record must authorise Google  -> include:_spf.google.com
  * DKIM : Google Workspace DKIM must be enabled (google._domainkey TXT record)
  * DMARC: the domain publishes p=quarantine, so a message that fails BOTH
           SPF and DKIM alignment is sent straight to spam.
What the script does on its side:
  * From address == authenticated SMTP account (aligned with SPF/DKIM)
  * RFC 5322 Date + Message-ID, proper multipart/alternative with plain text
  * All visitor input is HTML-escaped and header-sanitised
  * No hidden content, scripts, tracking pixels or external images

Usage
-----
  echo '{"name": ...}' | python send_lead_email.py   # send (used by /api/leads)
  python send_lead_email.py --test                    # send a sample lead
  python send_lead_email.py --preview                 # render sample, don't send
"""

import sys
import os
import json
import html
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formatdate, make_msgid, formataddr, parseaddr
from urllib.parse import quote
from pathlib import Path
from datetime import datetime


# ---------------------------------------------------------------------------
# Load .env / .env.local
# ---------------------------------------------------------------------------
def load_env_file(filepath: Path):
    if not filepath.exists():
        return
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#') or '=' not in line:
                    continue
                k, v = line.split('=', 1)
                os.environ[k.strip()] = v.strip().strip("'").strip('"')
    except Exception as e:
        print(f"[send_lead_email] Warning loading {filepath}: {e}", file=sys.stderr)


current_dir = Path(__file__).resolve().parent
project_root = current_dir.parent
load_env_file(project_root / '.env')
load_env_file(project_root / '.env.local')

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
ADMIN_EMAIL = os.environ.get('ADMIN_NOTIFICATION_EMAIL', 'info@thinklabdigitalsolutions.com')
SMTP_HOST = os.environ.get('SMTP_HOST', 'smtp.gmail.com')
SMTP_PORT = int(os.environ.get('SMTP_PORT', '587'))
SMTP_USER = os.environ.get('SMTP_USER', os.environ.get('EMAIL_USER', '')).strip()
raw_pass = os.environ.get('SMTP_PASS', os.environ.get('SMTP_PASSWORD', os.environ.get('EMAIL_PASS', ''))).strip()

# Google App Passwords are shown as "abcd efgh ijkl mnop" - strip the spaces
SMTP_PASS = raw_pass.replace(' ', '') if len(raw_pass.replace(' ', '')) == 16 else raw_pass

SMTP_SECURE = os.environ.get('SMTP_SECURE', 'false').lower() in ('true', '1', 'yes') or SMTP_PORT == 465
SITE_URL = os.environ.get('SITE_URL', 'https://www.thinklabdigitalsolutions.com').rstrip('/')


def sender_header() -> str:
    """Display name from SMTP_FROM, but the address is ALWAYS the authenticated
    account so SPF/DKIM/DMARC stay aligned."""
    display, addr = parseaddr(os.environ.get('SMTP_FROM', ''))
    if not display or (addr and addr.lower() != SMTP_USER.lower()):
        display = display or 'ThinkLab Website'
    return formataddr((display, SMTP_USER or ADMIN_EMAIL))


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def clean(value, fallback: str = '') -> str:
    """Normalise a payload field to a stripped string."""
    if value is None:
        return fallback
    value = str(value).strip()
    return value or fallback


def header_safe(value: str, limit: int = 120) -> str:
    """Strip CR/LF so visitor input can never inject extra email headers."""
    return ' '.join(value.split())[:limit]


def lead_fields(data: dict) -> dict:
    return {
        'name': clean(data.get('name'), 'Website visitor'),
        'email': clean(data.get('email')),
        'company': clean(data.get('company'), 'Not provided'),
        'service': clean(data.get('service'), 'General enquiry'),
        'message': clean(data.get('message'), 'No message provided.'),
        'source': clean(data.get('source'), 'contact').replace('-', ' ').title(),
        'created_at': clean(data.get('createdAt'), datetime.now().strftime('%d %b %Y, %I:%M %p')),
    }


# ---------------------------------------------------------------------------
# HTML template  (white & warm-beige editorial palette)
#   canvas #f7f6f2 · card #ffffff · inset #faf9f6 · hairline #ece9e2
#   ink #18181b · body #2b2a27 · muted #8c887b · chip #eeece5
# ---------------------------------------------------------------------------
FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"


def detail_row(label: str, value_html: str, last: bool = False) -> str:
    border = '' if last else 'border-bottom: 1px solid #ece9e2;'
    return f"""
                <tr>
                  <td class="stack label-cell" width="34%" valign="top" style="padding: 14px 0; {border} font-family: {MONO}; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #8c887b;">{label}</td>
                  <td class="stack" valign="top" style="padding: 14px 0; {border} font-family: {FONT}; font-size: 15px; line-height: 1.5; color: #18181b;">{value_html}</td>
                </tr>"""


def generate_html_template(data: dict) -> str:
    f = lead_fields(data)
    e = {k: html.escape(v) for k, v in f.items()}  # escaped copies for HTML
    first_name = html.escape(f['name'].split()[0])
    message_html = e['message'].replace('\n', '<br>')

    preheader = html.escape(f"{f['service']} · {' '.join(f['message'].split())[:110]}")

    reply_subject = quote(f"Re: Your enquiry with ThinkLab Digital Solutions")
    reply_href = f"mailto:{quote(f['email'], safe='@.+-_')}?subject={reply_subject}" if f['email'] else ''
    email_html = (f'<a href="{reply_href}" style="color: #18181b; text-decoration: underline; '
                  f'text-decoration-color: #cfcabd;">{e["email"]}</a>') if f['email'] else 'Not provided'

    rows = ''.join([
        detail_row('Name', f'<strong style="font-weight: 600;">{e["name"]}</strong>'),
        detail_row('Email', email_html),
        detail_row('Company', e['company']),
        detail_row('Service',
                   f'<span style="display: inline-block; padding: 3px 11px; background-color: #eeece5; '
                   f'border: 1px solid #ded9cd; border-radius: 999px; font-size: 13px; font-weight: 600; '
                   f'color: #433f38;">{e["service"]}</span>'),
        detail_row('Received', e['created_at']),
        detail_row('Source', f"{e['source']} form", last=True),
    ])

    reply_button = f"""
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 0 0 4px 0;">
                <tr>
                  <td align="center" bgcolor="#18181b" style="border-radius: 10px;">
                    <a href="{reply_href}" style="display: inline-block; padding: 14px 26px; font-family: {FONT}; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 10px;">Reply to {first_name}&nbsp;&rarr;</a>
                  </td>
                </tr>
              </table>""" if reply_href else ''

    return f"""<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light">
  <meta name="supported-color-schemes" content="light">
  <title>New enquiry from {e['name']}</title>
  <style type="text/css">
    body {{ margin: 0; padding: 0; -webkit-text-size-adjust: 100%; }}
    a {{ color: #18181b; }}
    @media only screen and (max-width: 620px) {{
      .px {{ padding-left: 22px !important; padding-right: 22px !important; }}
      .title {{ font-size: 24px !important; }}
      .stack {{ display: block !important; width: 100% !important; }}
      .label-cell {{ padding-bottom: 2px !important; border-bottom: 0 !important; }}
    }}
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f7f6f2;">
  <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">{preheader}</div>

  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#f7f6f2" style="background-color: #f7f6f2;">
    <tr>
      <td align="center" style="padding: 36px 14px;">

        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px;">

          <!-- Brand bar -->
          <tr>
            <td style="padding: 0 6px 16px 6px;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="font-family: {FONT}; font-size: 17px; font-weight: 700; letter-spacing: -0.01em; color: #18181b;">
                    ThinkLab<span style="font-weight: 400; color: #8c887b;"> Digital Solutions</span>
                  </td>
                  <td align="right" style="font-family: {MONO}; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #8c887b;">
                    Lead alert
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color: #ffffff; border: 1px solid #e5e3dc; border-radius: 16px;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">

                <!-- Hero -->
                <tr>
                  <td class="px" style="padding: 36px 40px 28px 40px;">
                    <span style="display: inline-block; padding: 4px 12px; background-color: #f4f2ec; border: 1px solid #e4e0d7; border-radius: 999px; font-family: {MONO}; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: #5c584e;">
                      &#9679;&nbsp; New enquiry
                    </span>
                    <h1 class="title" style="margin: 18px 0 10px 0; font-family: {FONT}; font-size: 28px; font-weight: 600; line-height: 1.25; letter-spacing: -0.02em; color: #18181b;">
                      {e['name']} wants to talk about {e['service']}
                    </h1>
                    <p style="margin: 0 0 26px 0; font-family: {FONT}; font-size: 15px; line-height: 1.6; color: #6b675d;">
                      {e['company']} &middot; {e['created_at']}
                    </p>
                    {reply_button}
                  </td>
                </tr>

                <!-- Message -->
                <tr>
                  <td class="px" style="padding: 0 40px 8px 40px;">
                    <p style="margin: 0 0 10px 0; font-family: {MONO}; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #8c887b;">Their message</p>
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding: 20px 22px; background-color: #faf9f6; border: 1px solid #ece9e2; border-left: 3px solid #18181b; border-radius: 10px; font-family: {FONT}; font-size: 15px; line-height: 1.7; color: #2b2a27; word-break: break-word;">
                          {message_html}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Details -->
                <tr>
                  <td class="px" style="padding: 28px 40px 12px 40px;">
                    <p style="margin: 0 0 2px 0; font-family: {MONO}; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: #8c887b;">Lead details</p>
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">{rows}
                    </table>
                  </td>
                </tr>

                <!-- Footnote -->
                <tr>
                  <td class="px" style="padding: 16px 40px 32px 40px;">
                    <p style="margin: 0; font-family: {FONT}; font-size: 13px; line-height: 1.6; color: #8c887b;">
                      Replying to this email goes straight to {first_name}. The lead is also saved in the
                      <a href="{SITE_URL}/admin" style="color: #433f38; text-decoration: underline; text-decoration-color: #cfcabd;">admin portal</a>.
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 22px 6px 0 6px; font-family: {FONT}; font-size: 12px; line-height: 1.6; color: #9c978b;">
              Sent automatically by the contact form on thinklabdigitalsolutions.com<br>
              ThinkLab Digital Solutions &middot; Vijayawada &amp; Sydney
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>
"""


def generate_plain_text(data: dict) -> str:
    f = lead_fields(data)
    return (
        f"New enquiry from {f['name']} - {f['service']}\n"
        f"{'=' * 48}\n\n"
        f"Name:     {f['name']}\n"
        f"Email:    {f['email'] or 'Not provided'}\n"
        f"Company:  {f['company']}\n"
        f"Service:  {f['service']}\n"
        f"Received: {f['created_at']}\n"
        f"Source:   {f['source']} form\n\n"
        f"Their message\n"
        f"{'-' * 48}\n"
        f"{f['message']}\n"
        f"{'-' * 48}\n\n"
        f"Reply to this email to respond directly to {f['name']}.\n"
        f"Admin portal: {SITE_URL}/admin\n\n"
        f"ThinkLab Digital Solutions - Vijayawada & Sydney\n"
    )


def save_preview(html_content: str):
    preview_dir = project_root / '.system_generated' / 'emails'
    try:
        preview_dir.mkdir(parents=True, exist_ok=True)
        preview_file = preview_dir / 'latest_lead_preview.html'
        preview_file.write_text(html_content, encoding='utf-8')
        return preview_file
    except Exception:
        return None


# ---------------------------------------------------------------------------
# Dispatch
# ---------------------------------------------------------------------------
def rendered_parts(data: dict):
    """(subject, text, html). The website pre-renders the email in
    src/lib/lead-email.ts and passes it as `rendered`; the CLI uses the
    built-in template."""
    r = data.get('rendered')
    if isinstance(r, dict) and r.get('html') and r.get('subject'):
        return header_safe(str(r['subject']), 150), str(r.get('text') or ''), str(r['html'])
    f = lead_fields(data)
    return (header_safe(f"New enquiry from {f['name']} - {f['service']}", 150),
            generate_plain_text(data), generate_html_template(data))


def build_message(data: dict) -> MIMEMultipart:
    f = lead_fields(data)
    subject, text_part, html_part = rendered_parts(data)
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = sender_header()
    msg['To'] = ADMIN_EMAIL

    # Replies go straight to the visitor
    client_email = header_safe(f['email'], 220)
    if client_email and '@' in parseaddr(client_email)[1]:
        msg['Reply-To'] = formataddr((header_safe(f['name'], 80), parseaddr(client_email)[1]))

    domain = SMTP_USER.split('@')[-1] if '@' in SMTP_USER else 'thinklabdigitalsolutions.com'
    msg['Message-ID'] = make_msgid(domain=domain)
    msg['Date'] = formatdate(localtime=True)
    msg['Auto-Submitted'] = 'auto-generated'
    msg['X-Auto-Response-Suppress'] = 'OOF, AutoReply'

    msg.attach(MIMEText(text_part, 'plain', 'utf-8'))
    msg.attach(MIMEText(html_part, 'html', 'utf-8'))
    return msg


def send_email(data: dict) -> dict:
    recipient = ADMIN_EMAIL
    preview_file = save_preview(rendered_parts(data)[2])
    preview = str(preview_file) if preview_file else None

    if not SMTP_USER or not SMTP_PASS or 'yourgmail@gmail.com' in SMTP_USER or 'your-email@' in SMTP_USER:
        print(f"[send_lead_email] SMTP_USER/SMTP_PASS not configured in .env.local. Preview saved: {preview}",
              file=sys.stderr)
        return {"ok": False, "status": "user_placeholder",
                "message": "Set SMTP_USER and SMTP_PASS in .env.local.",
                "preview_file": preview, "recipient": recipient}

    msg = build_message(data)

    def try_send(host, port, use_ssl):
        if use_ssl:
            srv = smtplib.SMTP_SSL(host, port, timeout=20)
        else:
            srv = smtplib.SMTP(host, port, timeout=20)
            srv.ehlo()
            srv.starttls()
            srv.ehlo()
        srv.login(SMTP_USER, SMTP_PASS)
        srv.sendmail(SMTP_USER, [recipient], msg.as_string())
        srv.quit()

    try:
        try_send(SMTP_HOST, SMTP_PORT, SMTP_SECURE)
        print(f"[send_lead_email] Delivered notification to {recipient}")
        return {"ok": True, "status": "sent", "recipient": recipient}
    except smtplib.SMTPAuthenticationError as auth_err:
        print(f"[send_lead_email] Authentication failed for '{SMTP_USER}': {auth_err}\n"
              f"Check SMTP_USER is the exact mailbox and SMTP_PASS is its 16-character App Password.",
              file=sys.stderr)
        return {"ok": False, "error": str(auth_err), "preview_file": preview}
    except Exception as e:
        if SMTP_PORT == 587:
            try:
                print(f"[send_lead_email] Port 587 failed ({e}). Retrying with SSL on 465...", file=sys.stderr)
                try_send(SMTP_HOST, 465, True)
                print(f"[send_lead_email] Delivered notification to {recipient} via port 465")
                return {"ok": True, "status": "sent", "recipient": recipient}
            except Exception as e2:
                print(f"[send_lead_email] Failed via {SMTP_HOST}:587 and 465: {e2}", file=sys.stderr)
                return {"ok": False, "error": str(e2), "preview_file": preview}
        print(f"[send_lead_email] Failed via {SMTP_HOST}:{SMTP_PORT}: {e}", file=sys.stderr)
        return {"ok": False, "error": str(e), "preview_file": preview}


# ---------------------------------------------------------------------------
# CLI / stdin entrypoint
# ---------------------------------------------------------------------------
SAMPLE_LEAD = {
    "name": "Sarah Jenkins",
    "email": "sarah.jenkins@example.com",
    "company": "Lumina Luxury Retail",
    "service": "Shopify E-Commerce Website",
    "message": "We are seeking a premium, fast e-commerce presence for our new designer collection.\n\n"
               "We need bespoke interactions, ERP inventory integration, and a mobile-first checkout experience.",
    "source": "contact",
}


def main():
    payload = None
    arg = sys.argv[1].strip() if len(sys.argv) > 1 else ''

    if arg in ('--test', '--preview'):
        payload = dict(SAMPLE_LEAD, createdAt=datetime.now().strftime('%d %b %Y, %I:%M %p IST'))
        if arg == '--preview':
            path = save_preview(generate_html_template(payload))
            print(json.dumps({"ok": True, "status": "preview", "preview_file": str(path) if path else None}))
            return
    elif arg:
        try:
            payload = json.loads(arg)
        except Exception:
            pass

    if not payload and not sys.stdin.isatty():
        try:
            stdin_data = sys.stdin.read().strip()
            if stdin_data:
                payload = json.loads(stdin_data)
        except Exception as e:
            print(f"[send_lead_email] Error reading stdin JSON: {e}", file=sys.stderr)

    if not payload:
        print(json.dumps({"ok": False, "error": "No JSON payload provided"}))
        sys.exit(1)

    print(json.dumps(send_email(payload)))


if __name__ == '__main__':
    main()
