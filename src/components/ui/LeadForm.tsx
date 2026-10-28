'use client';

import { useState, type FormEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowUpRight, Loader2 } from 'lucide-react';
import { SERVICES } from '@/lib/content';

type Status = 'idle' | 'sending' | 'done' | 'error';

/**
 * The final chamber — a visitor's idea re-enters the laboratory.
 */
export default function LeadForm({ source = 'contact' }: { source?: string }) {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [doneMsg, setDoneMsg] = useState('');
  const params = useSearchParams();
  const pre = params.get('service') ?? '';
  const preselect = SERVICES.some((s) => s.title === pre) ? pre : '';

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const payload = {
      name: data.get('name'),
      email: data.get('email'),
      company: data.get('company'),
      service: data.get('service'),
      message: data.get('message'),
      source,
    };
    setStatus('sending');
    setError('');
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.error ?? 'Your message could not be sent. Please try again.');
        setStatus('error');
        return;
      }
      setDoneMsg(json.message ?? 'The idea has been received.');
      setStatus('done');
      form.reset();
    } catch {
      setError('We couldn’t send your message. Please check your connection and try again.');
      setStatus('error');
    }
  };

  if (status === 'done') {
    return (
      <div className="glass sheen flex flex-col items-center px-8 py-14 text-center">
        <span className="spark-core h-12 w-12" />
        <h3 className="mt-8 font-display text-3xl tracking-tight text-[#fcfcf7]">
          Thanks for <em className="not-italic text-[#c5b0ff]">saying hello.</em>
        </h3>
        <p className="mt-4 max-w-sm text-[14.5px] leading-relaxed text-[#9a97a8]">{doneMsg}</p>
        <button onClick={() => setStatus('idle')} className="btn-ghost mt-8 px-6 py-3 text-[13px]">
          Send another enquiry
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="glass sheen p-6 md:p-9" aria-label="Project enquiry form">
      <p className="font-mono text-[10px] tracking-[0.34em] text-[#7e6ff0] uppercase">LET’S START SOMETHING</p>
      <h3 className="mt-3 font-display text-2xl tracking-tight text-[#fcfcf7] md:text-[28px]">Tell us what you have in mind.</h3>

      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block font-mono text-[10px] tracking-[0.24em] text-[#9a97a8] uppercase">Your name *</span>
          <input required minLength={2} maxLength={160} name="name" className="field" placeholder="Ada Lovelace" autoComplete="name" />
        </label>
        <label className="block">
          <span className="mb-2 block font-mono text-[10px] tracking-[0.24em] text-[#9a97a8] uppercase">Email *</span>
          <input required type="email" name="email" className="field" placeholder="ada@company.com" autoComplete="email" />
        </label>
        <label className="block">
          <span className="mb-2 block font-mono text-[10px] tracking-[0.24em] text-[#9a97a8] uppercase">Company</span>
          <input name="company" className="field" placeholder="Company / brand" autoComplete="organization" />
        </label>
        <label className="block">
          <span className="mb-2 block font-mono text-[10px] tracking-[0.24em] text-[#9a97a8] uppercase">What can we help with?</span>
          <select name="service" className="field" defaultValue={preselect} key={preselect}>
            <option value="">Not sure yet — guide me</option>
            {SERVICES.map((s) => (
              <option key={s.id} value={s.title}>
                {s.title}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="mt-4 block">
        <span className="mb-2 block font-mono text-[10px] tracking-[0.24em] text-[#9a97a8] uppercase">The idea *</span>
        <textarea
          required
          name="message"
          minLength={10}
          maxLength={4000}
          rows={5}
          className="field resize-none"
          placeholder="Where is your business today — and where must it be in twelve months?"
        />
      </label>

      {status === 'error' && (
        <p role="alert" className="mt-4 rounded-xl border border-[rgba(247,173,133,0.35)] bg-[rgba(247,173,133,0.08)] px-4 py-3 text-[13px] text-[#f7ad85]">
          {error}
        </p>
      )}

      <div className="mt-7 flex flex-wrap items-center gap-5">
        <button type="submit" disabled={status === 'sending'} className="btn-drop sheen px-7 py-3.5 text-sm font-medium disabled:opacity-70">
          {status === 'sending' ? (
            <>
              Sending your message
              <Loader2 className="h-4 w-4 animate-spin" />
            </>
          ) : (
            <>
              Send your enquiry
              <ArrowUpRight className="h-4 w-4" />
            </>
          )}
        </button>
        <p className="font-mono text-[10px] tracking-[0.2em] text-[#545454] uppercase">Response within one business day</p>
      </div>
    </form>
  );
}
