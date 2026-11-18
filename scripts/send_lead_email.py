#!/usr/bin/env python3
"""
ThinkLab Digital Solutions - Lead Notification Dispatcher
Sends clean, professional, high-deliverability email alerts to admin (info@thinklabdigitalsolutions.com)
whenever a visitor submits the website contact form.

Aesthetic: White & warm beige editorial luxury palette.
Spam Prevention: Clean semantic HTML (no spam-trigger SVG scripts or CSS hacks),
matching From/Auth headers, RFC 2822 timestamps, Message-ID, and direct Reply-To.
"""

import sys
import os
import json
import uuid
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formatdate, make_msgid
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
                k = k.strip()
                v = v.strip().strip("'").strip('"')
                os.environ[k] = v
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

# Clean Google App Password: strip spaces if 16-character format
if len(raw_pass.replace(' ', '')) == 16:
    SMTP_PASS = raw_pass.replace(' ', '')
else:
    SMTP_PASS = raw_pass

# For high deliverability, sender address MUST match SMTP_USER to pass Gmail/SPF/DMARC checks
# Display name can still be branded as "ThinkLab Digital Solutions"
if SMTP_USER:
    DEFAULT_FROM = f"ThinkLab Notifications <{SMTP_USER}>"
else:
    DEFAULT_FROM = f"ThinkLab Notifications <{ADMIN_EMAIL}>"

SMTP_FROM = os.environ.get('SMTP_FROM', DEFAULT_FROM)
SMTP_SECURE = os.environ.get('SMTP_SECURE', 'false').lower() in ('true', '1', 'yes') or SMTP_PORT == 465

# ---------------------------------------------------------------------------
# Clean White & Beige Professional Editorial Template
# ---------------------------------------------------------------------------
def generate_html_template(data: dict) -> str:
    name = data.get('name', 'Anonymous Visitor')
    email = data.get('email', 'N/A')
    company = data.get('company') or 'Individual / Direct'
    service = data.get('service') or 'General Enquiry'
    message = data.get('message', 'No details provided.')
    source = data.get('source', 'Website Contact Form')
    created_at = data.get('createdAt') or datetime.now().strftime('%d %B %Y, %I:%M %p IST')

    formatted_message = message.replace('\n', '<br>')

    return f"""<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Project Enquiry | ThinkLab</title>
  <style type="text/css">
    body {{
      margin: 0;
      padding: 0;
      background-color: #f7f6f2;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #1a1a1a;
      -webkit-font-smoothing: antialiased;
    }}
    table {{
      border-collapse: separate;
    }}
    @media only screen and (max-width: 600px) {{
      .mobile-pad {{ padding: 24px 18px !important; }}
      .mobile-col {{ display: block !important; width: 100% !important; padding-left: 0 !important; padding-right: 0 !important; margin-bottom: 16px !important; }}
      .mobile-title {{ font-size: 22px !important; }}
    }}
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f7f6f2; color: #1a1a1a;">

  <!-- Outer Canvas (Soft Beige Linen) -->
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f7f6f2; padding: 40px 16px;">
    <tr>
      <td align="center">

        <!-- Main Card (Crisp White Card with subtle warm border) -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 620px; background-color: #ffffff; border: 1px solid #e5e3dc; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);">
          
          <!-- Top Accent Ribbon (Warm Bronze / Gold Accent Line) -->
          <tr>
            <td height="4" style="background-color: #18181b;"></td>
          </tr>

          <!-- Header Section -->
          <tr>
            <td style="padding: 36px 40px 24px 40px; border-bottom: 1px solid #f0eee8;" class="mobile-pad">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <!-- Brand Wordmark -->
                    <div style="font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 11px; letter-spacing: 0.28em; text-transform: uppercase; color: #8e8a7e; margin-bottom: 8px;">
                      THINKLAB DIGITAL SOLUTIONS • INCOMING TRANSMISSION
                    </div>
                    <h1 class="mobile-title" style="margin: 0; font-size: 26px; font-weight: 600; letter-spacing: -0.02em; color: #18181b; line-height: 1.25;">
                      New Project Enquiry
                    </h1>
                  </td>
                  <td align="right" valign="top" style="display: none;" class="mobile-hide">
                    <!-- Status Pill -->
                    <span style="font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 10px; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; padding: 4px 10px; background-color: #f4f2ec; border: 1px solid #e4e0d7; border-radius: 20px; color: #5c584e;">
                      VERIFIED
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Lead Details Matrix -->
          <tr>
            <td style="padding: 28px 40px 36px 40px;" class="mobile-pad">
              
              <!-- Key Value Info Box (Warm Beige Inset) -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #faf9f6; border: 1px solid #ece9e2; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 18px 22px; border-bottom: 1px solid #ece9e2;" class="mobile-col">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="50%" valign="top" style="padding-right: 12px;" class="mobile-col">
                          <div style="font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: #8c887b; margin-bottom: 4px;">
                            Client Name
                          </div>
                          <div style="font-size: 16px; font-weight: 600; color: #18181b;">
                            {name}
                          </div>
                        </td>
                        <td width="50%" valign="top" style="padding-left: 12px;" class="mobile-col">
                          <div style="font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: #8c887b; margin-bottom: 4px;">
                            Email Address
                          </div>
                          <div style="font-size: 15px;">
                            <a href="mailto:{email}" style="color: #18181b; font-weight: 500; text-decoration: underline; text-decoration-color: #d1cdbf;">
                              {email}
                            </a>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 18px 22px;" class="mobile-col">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="50%" valign="top" style="padding-right: 12px;" class="mobile-col">
                          <div style="font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: #8c887b; margin-bottom: 4px;">
                            Company / Brand
                          </div>
                          <div style="font-size: 15px; font-weight: 500; color: #2e2d2a;">
                            {company}
                          </div>
                        </td>
                        <td width="50%" valign="top" style="padding-left: 12px;" class="mobile-col">
                          <div style="font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: #8c887b; margin-bottom: 4px;">
                            Selected Service
                          </div>
                          <div style="display: inline-block; font-size: 12.5px; font-weight: 600; color: #433f38; background-color: #eeece5; border: 1px solid #ded9cd; border-radius: 14px; padding: 3px 10px;">
                            {service}
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Project Message Box -->
              <div style="margin-bottom: 28px;">
                <div style="font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 10.5px; letter-spacing: 0.22em; text-transform: uppercase; color: #8c887b; margin-bottom: 8px;">
                  The Project Vision / Message
                </div>
                <div style="background-color: #ffffff; border: 1px solid #e5e2da; border-left: 3px solid #18181b; border-radius: 8px; padding: 18px 20px; font-size: 15px; line-height: 1.65; color: #2b2a27; word-break: break-word;">
                  {formatted_message}
                </div>
              </div>

              <!-- Action Buttons -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 10px;">
                <tr>
                  <td>
                    <!-- Primary Dark Button -->
                    <a href="mailto:{email}?subject=Re:%20Your%20Enquiry%20with%20ThinkLab%20Digital%20Solutions" style="display: inline-block; background-color: #18181b; color: #ffffff; text-decoration: none; font-size: 13.5px; font-weight: 500; letter-spacing: 0.02em; padding: 12px 24px; border-radius: 8px; margin-right: 10px; margin-bottom: 8px;">
                      Reply to {name} &rarr;
                    </a>
                    <!-- Secondary Outline Button -->
                    <a href="https://www.thinklabdigitalsolutions.com/admin" style="display: inline-block; background-color: #faf9f6; color: #403e38; text-decoration: none; font-size: 13.5px; font-weight: 500; padding: 11px 20px; border: 1px solid #dcd8ce; border-radius: 8px; margin-bottom: 8px;">
                      Open Admin Portal
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer Information -->
          <tr>
            <td style="background-color: #fcfbf9; padding: 22px 40px; border-top: 1px solid #f0eee8; text-align: left;" class="mobile-pad">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 10.5px; color: #9c978b;">
                    Source: <strong style="color: #5c584e;">{source}</strong> &bull; {created_at}
                  </td>
                  <td align="right" style="font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 10.5px; color: #9c978b;">
                    ThinkLab &bull; Vijayawada & Sydney
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
"""

# ---------------------------------------------------------------------------
# Dispatch Logic with Deliverability Headers
# ---------------------------------------------------------------------------
def send_email(data: dict) -> dict:
    recipient = ADMIN_EMAIL
    client_name = data.get('name', 'Client')
    service = data.get('service') or 'ThinkLab Collaboration'
    subject = f"New Project Enquiry from {client_name} ({service})"
    html_content = generate_html_template(data)

    # Save preview copy
    preview_dir = project_root / '.system_generated' / 'emails'
    try:
        preview_dir.mkdir(parents=True, exist_ok=True)
        preview_file = preview_dir / 'latest_lead_preview.html'
        with open(preview_file, 'w', encoding='utf-8') as f:
            f.write(html_content)
    except Exception:
        preview_file = None

    # Check for placeholder
    if not SMTP_USER or not SMTP_PASS or 'yourgmail@gmail.com' in SMTP_USER:
        msg = (
            f"[send_lead_email] Notice: SMTP_USER is set to '{SMTP_USER}'.\n"
            f"Please update SMTP_USER in .env.local to the actual Gmail address.\n"
            f"Preview saved: {preview_file}\n"
        )
        print(msg, file=sys.stderr)
        return {
            "ok": False,
            "status": "user_placeholder",
            "message": "SMTP_USER in .env.local must be your actual Gmail address.",
            "preview_file": str(preview_file) if preview_file else None,
            "recipient": recipient
        }

    # Construct MIME message
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    
    # Deliverability: Ensure From header matches authenticated SMTP account
    from_header = f"ThinkLab Studio <{SMTP_USER}>"
    msg['From'] = from_header
    msg['To'] = recipient
    
    # Do not set mismatched external Reply-To header as Gmail flags cross-domain Reply-To as phishing/spam.
    # The client email is clickable directly inside the message body and via the action button.

    # Standard email headers for inbox deliverability
    domain = SMTP_USER.split('@')[-1] if '@' in SMTP_USER else 'thinklabdigitalsolutions.com'
    msg['Message-ID'] = make_msgid(domain=domain)
    msg['Date'] = formatdate(localtime=True)

    # Clean plaintext alternative
    plain_text = (
        f"NEW PROJECT ENQUIRY — THINKLAB DIGITAL SOLUTIONS\n\n"
        f"Client Name: {client_name}\n"
        f"Email: {data.get('email', 'N/A')}\n"
        f"Company: {data.get('company', 'N/A')}\n"
        f"Service: {service}\n"
        f"Date: {data.get('createdAt', datetime.now().strftime('%Y-%m-%d %H:%M'))}\n"
        f"Source: {data.get('source', 'Website Contact Form')}\n\n"
        f"The Idea / Message:\n"
        f"--------------------------------------------------\n"
        f"{data.get('message', 'No details provided.')}\n"
        f"--------------------------------------------------\n\n"
        f"Reply to this email to respond directly to {client_name}.\n"
    )

    msg.attach(MIMEText(plain_text, 'plain', 'utf-8'))
    msg.attach(MIMEText(html_content, 'html', 'utf-8'))

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
        print(f"[send_lead_email] Successfully delivered clean notification to {recipient}")
        return {"ok": True, "status": "sent", "recipient": recipient}
    except smtplib.SMTPAuthenticationError as auth_err:
        err_msg = (
            f"[send_lead_email] Authentication failed for '{SMTP_USER}': {auth_err}\n"
            f"Check that SMTP_USER is your exact Gmail address and SMTP_PASS is the 16-character App Password."
        )
        print(err_msg, file=sys.stderr)
        return {"ok": False, "error": str(auth_err), "preview_file": str(preview_file) if preview_file else None}
    except Exception as e:
        # Fallback to SSL on 465 if 587 dropped
        if SMTP_PORT == 587:
            try:
                print(f"[send_lead_email] Port 587 notice ({e}). Retrying with SSL on port 465...", file=sys.stderr)
                try_send(SMTP_HOST, 465, True)
                print(f"[send_lead_email] Successfully delivered email to {recipient} via port 465 SSL")
                return {"ok": True, "status": "sent", "recipient": recipient}
            except Exception as e2:
                err_msg = f"[send_lead_email] Failed to send email via SMTP ({SMTP_HOST}:587 & 465): {e2}"
                print(err_msg, file=sys.stderr)
                return {"ok": False, "error": str(e2), "preview_file": str(preview_file) if preview_file else None}
        else:
            err_msg = f"[send_lead_email] Failed to send email via SMTP ({SMTP_HOST}:{SMTP_PORT}): {e}"
            print(err_msg, file=sys.stderr)
            return {"ok": False, "error": str(e), "preview_file": str(preview_file) if preview_file else None}

# ---------------------------------------------------------------------------
# CLI / Stdin Entrypoint
# ---------------------------------------------------------------------------
def main():
    payload = None

    if len(sys.argv) > 1:
        arg = sys.argv[1].strip()
        if arg == '--test':
            payload = {
                "name": "Sarah Jenkins",
                "email": "sarah.jenkins@lumina-retail.com",
                "company": "Lumina Luxury Retail",
                "service": "Shopify E-Commerce Website",
                "message": "We are seeking a premium, fast e-commerce presence for our new designer collection. We need bespoke interactions, ERP inventory integration, and a mobile-first checkout experience.",
                "source": "contact",
                "createdAt": datetime.now().strftime('%d %B %Y, %I:%M %p IST')
            }
        else:
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

    result = send_email(payload)
    print(json.dumps(result))

if __name__ == '__main__':
    main()
