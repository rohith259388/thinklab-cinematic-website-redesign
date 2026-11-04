'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import '@/components/cms/studio.css';

interface AuthCardProps {
  initialMode: 'login' | 'register';
}

export default function AuthCard({ initialMode }: AuthCardProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'otp'>(initialMode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [googleClientId, setGoogleClientId] = useState('');

  useEffect(() => {
    fetch('/api/cms/auth-config')
      .then((r) => r.json())
      .then((data) => {
        if (data?.googleClientId) {
          setGoogleClientId(data.googleClientId);
          if (!document.getElementById('google-gsi-client')) {
            const s = document.createElement('script');
            s.id = 'google-gsi-client';
            s.src = 'https://accounts.google.com/gsi/client';
            s.async = true;
            s.defer = true;
            document.body.appendChild(s);
          }
        }
      })
      .catch(() => {});
  }, []);

  const api = async (action: string, payload?: unknown) => {
    const res = await fetch(`/api/cms/${action}`, {
      method: payload !== undefined ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: payload !== undefined ? JSON.stringify(payload) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.error || 'Authentication request failed.');
    }
    return data;
  };

  const handleGoogleLogin = () => {
    if (!googleClientId) {
      setError(
        'Google Sign-In requires NEXT_PUBLIC_GOOGLE_CLIENT_ID to be configured. You can sign in with your email and password above.'
      );
      return;
    }
    const win = window as any;
    if (win.google?.accounts?.id) {
      win.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response: any) => {
          if (response?.credential) {
            setBusy(true);
            setError('');
            try {
              await api('google-login', { credential: response.credential });
              window.location.href = '/admin';
            } catch (err: any) {
              setError(err.message || 'Google authentication failed.');
            } finally {
              setBusy(false);
            }
          }
        },
      });
      win.google.accounts.id.prompt();
    } else {
      setError('Loading Google authentication service... please try again in a moment.');
    }
  };

  const onLoginSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError('');
    try {
      await api('login', Object.fromEntries(f));
      window.location.href = '/admin';
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setBusy(false);
    }
  };

  const onRegisterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get('email') || '').trim().toLowerCase();
    const password = String(f.get('password') || '');
    const confirmPassword = String(f.get('confirmPassword') || '');

    if (!email.endsWith('@thinklabdigitalsolutions.com')) {
      setError('Registration is restricted to @thinklabdigitalsolutions.com email addresses.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      const res = await api('register-otp', { email, password, confirmPassword });
      setRegEmail(email);
      setMode('otp');
      setInfoMsg(res?.message || `Verification code sent to ${email}`);
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code.');
    } finally {
      setBusy(false);
    }
  };

  const onOtpSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const otp = String(f.get('otp') || '').trim();
    if (otp.length < 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      await api('verify-otp', { email: regEmail, otp });
      window.location.href = '/admin';
    } catch (err: any) {
      setError(err.message || 'Invalid verification code.');
    } finally {
      setBusy(false);
    }
  };

  const onResendOtp = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await api('resend-otp', { email: regEmail });
      setInfoMsg(res?.message || 'A new verification code has been sent.');
    } catch (err: any) {
      setError(err.message || 'Failed to resend code.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="cms-login">
      {mode === 'login' && (
        <form onSubmit={onLoginSubmit}>
          <div className="cms-brand">
            thinklab<span> / studio</span>
          </div>
          <h1>Welcome back.</h1>
          <p>Sign in to your ThinkLab management workspace.</p>

          <label>
            Email
            <input
              name="email"
              type="email"
              autoComplete="username"
              placeholder="name@thinklabdigitalsolutions.com"
              required
            />
          </label>

          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>

          {error && (
            <p role="alert" className="cms-error">
              {error}
            </p>
          )}

          <button disabled={busy} className="cms-primary" type="submit">
            {busy ? 'Signing in…' : 'Sign in'}
          </button>

          <div className="cms-auth-divider">
            <span>or</span>
          </div>

          <button
            type="button"
            className="cms-google-btn"
            onClick={handleGoogleLogin}
            disabled={busy}
          >
            <svg className="cms-google-icon" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Continue with Google
          </button>

          <div className="cms-auth-toggle">
            Don’t have an account?{' '}
            <Link href="/admin/register" className="cms-link-action">
              Register
            </Link>
          </div>
        </form>
      )}

      {mode === 'register' && (
        <form onSubmit={onRegisterSubmit}>
          <div className="cms-brand">
            thinklab<span> / studio</span>
          </div>
          <h1>Create account.</h1>
          <p>Exclusive to team members (@thinklabdigitalsolutions.com)</p>

          <label>
            Work Email
            <input
              name="email"
              type="email"
              autoComplete="email"
              placeholder="name@thinklabdigitalsolutions.com"
              required
            />
            <small style={{ color: '#9b94aa', marginTop: 4 }}>
              Must be an official @thinklabdigitalsolutions.com email.
            </small>
          </label>

          <label>
            Password
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              placeholder="Minimum 8 characters"
              required
            />
          </label>

          <label>
            Confirm Password
            <input
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={8}
              placeholder="Re-enter password"
              required
            />
          </label>

          {error && (
            <p role="alert" className="cms-error">
              {error}
            </p>
          )}

          <button disabled={busy} className="cms-primary" type="submit">
            {busy ? 'Sending code…' : 'Next →'}
          </button>

          <div className="cms-auth-toggle">
            Already have an account?{' '}
            <Link href="/admin/login" className="cms-link-action">
              Sign in
            </Link>
          </div>
        </form>
      )}

      {mode === 'otp' && (
        <form onSubmit={onOtpSubmit}>
          <div className="cms-brand">
            thinklab<span> / studio</span>
          </div>
          <h1>Verify your email.</h1>
          <p>
            We sent a 6-digit verification code to <br />
            <strong style={{ color: '#eeeef3' }}>{regEmail}</strong>
          </p>

          {infoMsg && <div className="cms-info">{infoMsg}</div>}

          <label>
            Verification Code
            <input
              name="otp"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="000000"
              className="cms-otp-input"
              autoComplete="one-time-code"
              autoFocus
              required
            />
          </label>

          {error && (
            <p role="alert" className="cms-error">
              {error}
            </p>
          )}

          <button disabled={busy} className="cms-primary" type="submit">
            {busy ? 'Verifying…' : 'Verify & Complete Registration'}
          </button>

          <div className="cms-btn-row">
            <button
              type="button"
              disabled={busy}
              onClick={onResendOtp}
            >
              Resend Code
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError('');
                setInfoMsg('');
              }}
            >
              Change Email
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

