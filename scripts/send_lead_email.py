#!/usr/bin/env python3
"""
ThinkLab Digital Solutions - Lead Notification Dispatcher
Sends high-fidelity, 3D animated email alerts to admin (info@thinklabdigitalsolutions.com)
whenever a visitor submits the website contact form.

Uses pure Python standard library (smtplib + email) - zero third-party API limits.
"""

import sys
import os
import json
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from datetime import datetime

# ---------------------------------------------------------------------------
# Load .env / .env.local manually without external dependencies
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
                # Override to ensure latest values from .env.local take effect
                os.environ[k] = v
    except Exception as e:
        print(f"[send_lead_email] Warning loading {filepath}: {e}", file=sys.stderr)

# Discover project root
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

# Clean Google App Password: strip spaces if 16-character format (e.g. "abcd efgh ijkl mnop" -> "abcdefghijklmnop")
if len(raw_pass.replace(' ', '')) == 16:
    SMTP_PASS = raw_pass.replace(' ', '')
else:
    SMTP_PASS = raw_pass

SMTP_FROM = os.environ.get('SMTP_FROM', f"ThinkLab Studio <{SMTP_USER or ADMIN_EMAIL}>")
SMTP_SECURE = os.environ.get('SMTP_SECURE', 'false').lower() in ('true', '1', 'yes') or SMTP_PORT == 465

# ---------------------------------------------------------------------------
# HTML Email Template with Website Color Palette & 3D Animation
# ---------------------------------------------------------------------------
def generate_html_template(data: dict) -> str:
    name = data.get('name', 'Anonymous Visitor')
    email = data.get('email', 'N/A')
    company = data.get('company') or 'Individual / Direct'
    service = data.get('service') or 'General Exploration / Strategy'
    message = data.get('message', 'No details provided.')
    source = data.get('source', 'Website Contact Form')
    created_at = data.get('createdAt') or datetime.now().strftime('%d %B %Y, %I:%M %p IST')

    # Convert newlines to HTML breaks for message
    formatted_message = message.replace('\n', '<br>')

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Project Enquiry | ThinkLab</title>
  <style>
    /* CSS3 3D Animations for supporting email clients */
    @keyframes spin3D {{
      0% {{ transform: rotateY(0deg) rotateX(20deg); }}
      50% {{ transform: rotateY(180deg) rotateX(-20deg); }}
      100% {{ transform: rotateY(360deg) rotateX(20deg); }}
    }}
    @keyframes pulseGlow {{
      0%, 100% {{ box-shadow: 0 0 25px rgba(162, 128, 255, 0.4), 0 0 60px rgba(126, 111, 240, 0.2); }}
      50% {{ box-shadow: 0 0 45px rgba(162, 128, 255, 0.7), 0 0 90px rgba(228, 195, 144, 0.35); }}
    }}
    @keyframes floatOrb {{
      0%, 100% {{ transform: translateY(0px) scale(1); }}
      50% {{ transform: translateY(-8px) scale(1.03); }}
    }}
    .animated-3d-box {{
      animation: floatOrb 4.5s ease-in-out infinite, pulseGlow 3s ease-in-out infinite;
    }}
    @media only screen and (max-width: 600px) {{
      .mobile-padding {{ padding: 20px 14px !important; }}
      .mobile-title {{ font-size: 24px !important; }}
    }}
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #06070a; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #fcfcf7; -webkit-font-smoothing: antialiased;">

  <!-- Background Wrapper -->
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background: radial-gradient(circle at 50% 10%, #17112c 0%, #08090d 55%, #040507 100%); padding: 40px 15px;">
    <tr>
      <td align="center">

        <!-- Outer Glass Card Container -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 640px; background-color: #0d0f16; border: 1px solid rgba(162, 128, 255, 0.28); border-radius: 24px; overflow: hidden; box-shadow: 0 35px 80px -15px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.05);">
          
          <!-- Top Accent Light Line -->
          <tr>
            <td height="3" style="background: linear-gradient(90deg, #7e6ff0 0%, #a280ff 30%, #e4c390 70%, #7e6ff0 100%);"></td>
          </tr>

          <!-- Header Section with 3D Holographic Visual Badge -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center;" class="mobile-padding">
              
              <!-- 3D Holographic Animated Core -->
              <div style="display: inline-block; margin-bottom: 24px; position: relative;">
                <div class="animated-3d-box" style="width: 76px; height: 76px; margin: 0 auto; border-radius: 22px; background: linear-gradient(135deg, rgba(30, 22, 60, 0.95), rgba(12, 14, 25, 0.95)); border: 1.5px solid rgba(197, 176, 255, 0.4); display: flex; align-items: center; justify-content: center; box-shadow: 0 20px 40px rgba(0,0,0,0.6), inset 0 2px 4px rgba(255,255,255,0.2);">
                  <!-- 3D Geometric Gyroscope SVG with active rotation animations -->
                  <svg width="44" height="44" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: block; margin: 16px auto;">
                    <defs>
                      <linearGradient id="orbitGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#E4C390" />
                        <stop offset="50%" stop-color="#A280FF" />
                        <stop offset="100%" stop-color="#7E6FF0" />
                      </linearGradient>
                      <linearGradient id="bulbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#FFFFFF" />
                        <stop offset="40%" stop-color="#C5B0FF" />
                        <stop offset="100%" stop-color="#6044B5" />
                      </linearGradient>
                      <filter id="glow3d" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>
                    <!-- Outer 3D Orbit Ring -->
                    <ellipse cx="50" cy="50" rx="42" ry="18" stroke="url(#orbitGrad1)" stroke-width="3" fill="none" opacity="0.85" transform="rotate(-30 50 50)">
                      <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="12s" repeatCount="indefinite" />
                    </ellipse>
                    <!-- Counter 3D Orbit Ring -->
                    <ellipse cx="50" cy="50" rx="38" ry="14" stroke="#E4C390" stroke-width="2" fill="none" opacity="0.7" transform="rotate(45 50 50)">
                      <animateTransform attributeName="transform" type="rotate" from="360 50 50" to="0 50 50" dur="9s" repeatCount="indefinite" />
                    </ellipse>
                    <!-- Core 3D Diamond / Spark -->
                    <polygon points="50,22 68,50 50,78 32,50" fill="url(#bulbGrad)" filter="url(#glow3d)">
                      <animate attributeName="opacity" values="0.85;1;0.85" dur="3s" repeatCount="indefinite" />
                    </polygon>
                    <circle cx="50" cy="50" r="5" fill="#FFFFFF" />
                  </svg>
                </div>
              </div>

              <!-- Brand kicker -->
              <p style="margin: 0 0 10px 0; font-family: 'SF Mono', Consolas, Monaco, monospace; font-size: 11px; letter-spacing: 0.35em; color: #a280ff; text-transform: uppercase;">
                THINKLAB DIGITAL SOLUTIONS // INCOMING TRANSMISSION
              </p>

              <!-- Main Title -->
              <h1 class="mobile-title" style="margin: 0; font-size: 32px; font-weight: 600; letter-spacing: -0.03em; color: #ffffff; line-height: 1.2;">
                New Project Enquiry
              </h1>

              <p style="margin: 12px 0 0 0; font-size: 14px; color: #9a97a8; line-height: 1.6;">
                A new client lead has been captured from the website contact portal and archived in the laboratory registry.
              </p>
            </td>
          </tr>

          <!-- Lead Details Matrix -->
          <tr>
            <td style="padding: 10px 36px 30px 36px;" class="mobile-padding">

              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background: rgba(20, 22, 34, 0.7); border: 1px solid rgba(162, 128, 255, 0.16); border-radius: 16px; overflow: hidden; margin-bottom: 24px;">
                
                <!-- Client Name & Email Row -->
                <tr>
                  <td style="padding: 22px 24px; border-bottom: 1px solid rgba(255, 255, 255, 0.06);">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="50%" valign="top" style="padding-right: 12px;">
                          <div style="font-family: monospace; font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase; color: #7e6ff0; margin-bottom: 6px;">Client Name</div>
                          <div style="font-size: 18px; font-weight: 600; color: #ffffff;">{name}</div>
                        </td>
                        <td width="50%" valign="top" style="padding-left: 12px;">
                          <div style="font-family: monospace; font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase; color: #7e6ff0; margin-bottom: 6px;">Email Address</div>
                          <div style="font-size: 15px; font-weight: 500;">
                            <a href="mailto:{email}" style="color: #c5b0ff; text-decoration: none; border-bottom: 1px dotted #a280ff;">{email}</a>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Company & Service Row -->
                <tr>
                  <td style="padding: 22px 24px; border-bottom: 1px solid rgba(255, 255, 255, 0.06);">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="50%" valign="top" style="padding-right: 12px;">
                          <div style="font-family: monospace; font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase; color: #7e6ff0; margin-bottom: 6px;">Company / Brand</div>
                          <div style="font-size: 15px; color: #e9e3dc; font-weight: 500;">{company}</div>
                        </td>
                        <td width="50%" valign="top" style="padding-left: 12px;">
                          <div style="font-family: monospace; font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase; color: #7e6ff0; margin-bottom: 6px;">Requested Service</div>
                          <div style="display: inline-block; font-size: 13px; font-weight: 600; color: #e4c390; background: rgba(228, 195, 144, 0.12); border: 1px solid rgba(228, 195, 144, 0.35); border-radius: 20px; padding: 4px 12px;">
                            {service}
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Message Box -->
                <tr>
                  <td style="padding: 24px;">
                    <div style="font-family: monospace; font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase; color: #7e6ff0; margin-bottom: 10px;">The Project Vision & Idea</div>
                    <div style="background: rgba(10, 11, 18, 0.9); border-left: 3px solid #a280ff; border-radius: 8px; padding: 18px 20px; font-size: 14.5px; line-height: 1.7; color: #f0f0ea; word-break: break-word;">
                      {formatted_message}
                    </div>
                  </td>
                </tr>

                <!-- Meta footer -->
                <tr>
                  <td style="padding: 14px 24px; background: rgba(8, 9, 14, 0.85); border-top: 1px solid rgba(255, 255, 255, 0.04);">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="font-family: monospace; font-size: 10.5px; color: #6e6b7b;">
                          Captured via <span style="color: #9a97a8;">{source}</span>
                        </td>
                        <td align="right" style="font-family: monospace; font-size: 10.5px; color: #6e6b7b;">
                          {created_at}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>

              <!-- Interactive Quick Actions (3D Pill Button) -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 10px;">
                <tr>
                  <td align="center">
                    <a href="mailto:{email}?subject=Re:%20Your%20Enquiry%20with%20ThinkLab%20Digital%20Solutions" style="display: inline-block; background: linear-gradient(135deg, #a280ff 0%, #7e6ff0 100%); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; letter-spacing: 0.02em; padding: 14px 34px; border-radius: 40px; box-shadow: 0 10px 25px -5px rgba(126, 111, 240, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.4); margin-right: 12px; margin-bottom: 10px;">
                      ⚡ Reply to {name}
                    </a>
                    <a href="https://www.thinklabdigitalsolutions.com/admin" style="display: inline-block; background: rgba(30, 22, 60, 0.6); color: #c5b0ff; text-decoration: none; font-size: 14px; font-weight: 500; padding: 13px 26px; border-radius: 40px; border: 1px solid rgba(162, 128, 255, 0.35); margin-bottom: 10px;">
                      Open Studio Admin
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer Information -->
          <tr>
            <td style="background-color: #07080c; padding: 28px 40px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.05);">
              <p style="margin: 0 0 8px 0; font-family: monospace; font-size: 11px; letter-spacing: 0.25em; text-transform: uppercase; color: #5a5766;">
                THINKLAB DIGITAL SOLUTIONS • PRIVATE AUTOMATION
              </p>
              <p style="margin: 0; font-size: 12px; color: #4e4c59; line-height: 1.5;">
                Vijayawada, AP, India & Mascot, Sydney, Australia<br>
                Direct enquiries routed to <a href="mailto:{ADMIN_EMAIL}" style="color: #7e6ff0; text-decoration: none;">{ADMIN_EMAIL}</a>
              </p>
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
# Dispatch Logic
# ---------------------------------------------------------------------------
def send_email(data: dict) -> dict:
    recipient = ADMIN_EMAIL
    subject = f"⚡ New Project Lead: {data.get('name', 'Client')} — {data.get('service') or 'ThinkLab Collaboration'}"
    html_content = generate_html_template(data)

    # Save preview copy for local validation / debugging
    preview_dir = project_root / '.system_generated' / 'emails'
    try:
        preview_dir.mkdir(parents=True, exist_ok=True)
        preview_file = preview_dir / 'latest_lead_preview.html'
        with open(preview_file, 'w', encoding='utf-8') as f:
            f.write(html_content)
    except Exception as e:
        preview_file = None

    # Check if SMTP credentials are provided or still placeholder
    if not SMTP_USER or not SMTP_PASS or 'yourgmail@gmail.com' in SMTP_USER:
        msg = (
            f"[send_lead_email] Notice: SMTP_USER is still set to '{SMTP_USER}'.\n"
            f"Please update SMTP_USER in .env.local to the exact Gmail address that generated the App Password (e.g. samhithbasa12@gmail.com).\n"
            f"Email preview generated at: {preview_file}\n"
        )
        print(msg, file=sys.stderr)
        return {
            "ok": False,
            "status": "user_placeholder",
            "message": "SMTP_USER in .env.local must be your actual Gmail address, not yourgmail@gmail.com.",
            "preview_file": str(preview_file) if preview_file else None,
            "recipient": recipient
        }

    # Construct MIME message
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = SMTP_FROM
    msg['To'] = recipient
    msg['Reply-To'] = data.get('email', recipient)

    # Plaintext fallback
    plain_text = (
        f"NEW PROJECT ENQUIRY - THINKLAB DIGITAL SOLUTIONS\n\n"
        f"Client Name: {data.get('name')}\n"
        f"Email: {data.get('email')}\n"
        f"Company: {data.get('company', 'N/A')}\n"
        f"Service: {data.get('service', 'N/A')}\n"
        f"Source: {data.get('source', 'Contact Form')}\n\n"
        f"Message:\n{data.get('message')}\n"
    )
    msg.attach(MIMEText(plain_text, 'plain', 'utf-8'))
    msg.attach(MIMEText(html_content, 'html', 'utf-8'))

    # Helper connection logic with automatic SSL (465) fallback if STARTTLS (587) fails
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
        print(f"[send_lead_email] Successfully delivered email to {recipient}")
        return {"ok": True, "status": "sent", "recipient": recipient}
    except smtplib.SMTPAuthenticationError as auth_err:
        err_msg = (
            f"[send_lead_email] Authentication failed for '{SMTP_USER}':\n"
            f"{auth_err}\n"
            f"Check that SMTP_USER is your actual Gmail address and SMTP_PASS is the 16-character App Password."
        )
        print(err_msg, file=sys.stderr)
        return {"ok": False, "error": str(auth_err), "preview_file": str(preview_file) if preview_file else None}
    except Exception as e:
        # If 587 dropped, try port 465 with SSL automatically
        if SMTP_PORT == 587:
            try:
                print(f"[send_lead_email] Port 587 failed ({e}). Retrying with SSL on port 465...", file=sys.stderr)
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

    # Check for CLI arguments or test mode
    if len(sys.argv) > 1:
        arg = sys.argv[1].strip()
        if arg == '--test':
            payload = {
                "name": "Alex Mercer",
                "email": "alex.mercer@futurecraft.studio",
                "company": "FutureCraft Creative Labs",
                "service": "Custom Web Development",
                "message": "We need a cinematic, high-speed 3D web platform with bespoke micro-interactions and headless architecture for our global luxury brand launch.",
                "source": "contact",
                "createdAt": datetime.now().strftime('%d %B %Y, %I:%M %p IST')
            }
        else:
            try:
                payload = json.loads(arg)
            except Exception:
                pass

    # Otherwise read from stdin
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
