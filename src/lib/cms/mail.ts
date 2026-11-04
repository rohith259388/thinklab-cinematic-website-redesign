/**
 * ThinkLab Studio Email Service
 * Handles verification OTP dispatch for @thinklabdigitalsolutions.com team registrations.
 * Supports Resend API, SMTP, and development console logging.
 */

export async function sendOtpEmail(email: string, otp: string): Promise<{ success: boolean; error?: string }> {
  const subject = `Your ThinkLab Studio Verification Code: ${otp}`;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 20px; background-color: #0c0d10; color: #f0f0e9; border-radius: 12px; border: 1px solid #272922;">
      <div style="margin-bottom: 24px; font-size: 13px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #a280ff;">
        thinklab<span style="color: #686b61;"> / studio</span>
      </div>
      <h1 style="font-size: 24px; font-weight: 600; margin-bottom: 12px; color: #ffffff;">
        Verify your email address
      </h1>
      <p style="font-size: 14px; line-height: 1.6; color: #a0a09a; margin-bottom: 28px;">
        Use the following 6-digit verification code to complete your registration for the ThinkLab Studio management portal. This code is valid for <strong>10 minutes</strong>.
      </p>
      <div style="background: #18191f; border: 1px solid #342842; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 28px;">
        <span style="font-family: monospace; font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #c5b0ff;">
          ${otp}
        </span>
      </div>
      <p style="font-size: 12px; color: #686b61; line-height: 1.5;">
        This code was requested for <strong>${email}</strong>. If you did not request this code, you can safely ignore this email.
      </p>
      <hr style="border: none; border-top: 1px solid #20222a; margin: 28px 0;" />
      <p style="font-size: 11px; color: #4e5048; text-align: center;">
        ThinkLab Digital Solutions • Private Workspace
      </p>
    </div>
  `;

  // Always log to server console for quick debugging / verification
  console.log('\n============================================================');
  console.log(`📧 [ThinkLab Auth] Verification OTP for ${email}`);
  console.log(`🔑 OTP CODE: ${otp}`);
  console.log('⏰ Valid for 10 minutes');
  console.log('============================================================\n');

  // 1. Try Resend API if configured
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const fromEmail = process.env.EMAIL_FROM || 'ThinkLab Studio <onboarding@resend.dev>';
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [email],
          subject,
          html,
        }),
      });
      if (res.ok) {
        return { success: true };
      }
      const data = await res.json().catch(() => ({}));
      console.warn('[mail] Resend failed:', data);
    } catch (err) {
      console.warn('[mail] Resend network error:', err);
    }
  }

  // 2. Try SMTP via fetch or custom webhook if configured (e.g. SENDGRID / POSTMARK)
  const sendgridKey = process.env.SENDGRID_API_KEY;
  if (sendgridKey) {
    try {
      const fromEmail = process.env.EMAIL_FROM || 'admin@thinklabdigitalsolutions.com';
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sendgridKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email }] }],
          from: { email: fromEmail, name: 'ThinkLab Studio' },
          subject,
          content: [{ type: 'text/html', value: html }],
        }),
      });
      if (res.ok) {
        return { success: true };
      }
    } catch (err) {
      console.warn('[mail] SendGrid network error:', err);
    }
  }

  // If no third-party API is configured yet, the code is still available in logs
  return { success: true };
}

