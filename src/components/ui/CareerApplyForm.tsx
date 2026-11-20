'use client';

import { useState, type FormEvent } from 'react';
import { ArrowUpRight, Loader2 } from 'lucide-react';

type Status = 'idle' | 'sending' | 'done' | 'error';

const label = 'mb-2 block font-mono text-[10px] tracking-[0.24em] text-[#9a97a8] uppercase';

/** Job application form shown on each careers detail page. Posts to /api/careers. */
export default function CareerApplyForm({ role, roleSlug }: { role: string; roleSlug: string }) {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [doneMsg, setDoneMsg] = useState('');

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const file = data.get('resume');
    if (file instanceof File && file.size > 5 * 1024 * 1024) {
      setError('Your resume must be 5 MB or smaller.');
      setStatus('error');
      return;
    }
    data.set('role', role);
    data.set('roleSlug', roleSlug);
    setStatus('sending');
    setError('');
    try {
      const res = await fetch('/api/careers', { method: 'POST', body: data });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setError(json.error ?? 'Your application could not be sent. Please try again.');
        setStatus('error');
        return;
      }
      setDoneMsg(json.message ?? 'Your application has been received.');
      setStatus('done');
      form.reset();
    } catch {
      setError('We couldn’t send your application. Please check your connection and try again.');
      setStatus('error');
    }
  };

  if (status === 'done') {
    return (
      <div id="apply" className="glass sheen mt-12 flex scroll-mt-28 flex-col items-center px-8 py-14 text-center">
        <span className="spark-core h-12 w-12" />
        <h3 className="mt-8 font-display text-3xl tracking-tight text-[#fcfcf7]">
          Thanks for <em className="not-italic text-[#c5b0ff]">applying.</em>
        </h3>
        <p className="mt-4 max-w-sm text-[14.5px] leading-relaxed text-[#9a97a8]">{doneMsg}</p>
      </div>
    );
  }

  return (
    <form id="apply" onSubmit={submit} className="glass sheen mt-12 scroll-mt-28 p-6 md:p-9" aria-label="Job application form">
      <p className="font-mono text-[10px] tracking-[0.34em] text-[#7e6ff0] uppercase">APPLY FOR THIS ROLE</p>
      <h3 className="mt-3 font-display text-2xl tracking-tight text-[#fcfcf7] md:text-[28px]">{role}</h3>

      {/* Honeypot for bots — hidden from people and screen readers. */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />

      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={label}>Full name *</span>
          <input required minLength={2} maxLength={160} name="name" className="field" autoComplete="name" />
        </label>
        <label className="block">
          <span className={label}>Email *</span>
          <input required type="email" name="email" className="field" autoComplete="email" />
        </label>
        <label className="block">
          <span className={label}>Phone *</span>
          <input required type="tel" name="phone" pattern="[+()\-\s0-9]{7,20}" className="field" placeholder="+91 98765 43210" autoComplete="tel" />
        </label>
        <label className="block">
          <span className={label}>Current city</span>
          <input name="location" maxLength={160} className="field" autoComplete="address-level2" />
        </label>
        <label className="block">
          <span className={label}>Experience</span>
          <select name="experience" className="field" defaultValue="">
            <option value="">Select</option>
            <option>Fresher</option>
            <option>Less than 1 year</option>
            <option>1–3 years</option>
            <option>3–5 years</option>
            <option>5+ years</option>
          </select>
        </label>
        <label className="block">
          <span className={label}>Portfolio / LinkedIn</span>
          <input type="url" name="portfolio" maxLength={500} className="field" placeholder="https://" />
        </label>
      </div>
      <label className="mt-4 block">
        <span className={label}>Resume * (PDF or Word, max 5 MB)</span>
        <input
          required
          type="file"
          name="resume"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="field file:mr-4 file:rounded-full file:border-0 file:bg-[#7e6ff0] file:px-4 file:py-1.5 file:text-[12px] file:text-white"
        />
      </label>
      <label className="mt-4 block">
        <span className={label}>Why you?</span>
        <textarea name="message" maxLength={4000} rows={4} className="field resize-none" placeholder="Tell us a little about yourself and your best work." />
      </label>

      {status === 'error' && (
        <p role="alert" className="mt-4 rounded-xl border border-[rgba(247,173,133,0.35)] bg-[rgba(247,173,133,0.08)] px-4 py-3 text-[13px] text-[#f7ad85]">
          {error}
        </p>
      )}

      <div className="mt-7">
        <button type="submit" disabled={status === 'sending'} className="btn-drop sheen px-7 py-3.5 text-sm font-medium disabled:opacity-70">
          {status === 'sending' ? (
            <>Sending your application <Loader2 className="h-4 w-4 animate-spin" /></>
          ) : (
            <>Submit application <ArrowUpRight className="h-4 w-4" /></>
          )}
        </button>
      </div>
    </form>
  );
}
