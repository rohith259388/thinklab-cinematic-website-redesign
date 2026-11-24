'use client';
import { useCanvasContent } from '@/components/cms/Canvas';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import StageSetter from '@/components/experience/StageSetter';
import RichContent, { faqJsonLd } from './RichContent';
import { type LiveEntry } from '@/lib/live';
import type { PageKey } from '@/lib/motion';
import { Reveal } from '@/components/ui/Reveal';
import CareerApplyForm from '@/components/ui/CareerApplyForm';
import GrowCtaCard from '@/components/ui/GrowCtaCard';

export default function DetailPage({ entry: originalEntry, page, back, label }: { entry: LiveEntry; page: PageKey; back: string; label: string }) {
  const canvas=useCanvasContent();
  const entry=canvas.previewId && canvas.page ? {...originalEntry,...canvas.page} : originalEntry;
  const isJob = back === '/careers';
  const destination = isJob ? '#apply' : '/contact';
  const cta = isJob ? 'Apply for this role' : 'Let’s talk about your project';
  const metrics: { value: string; label: string }[] = [];
  if (back === '/projects') { for (let i = 0; i < 4; i += 2) { if (/^[0-9#]/.test(entry.blocks[i]?.text || '') && entry.blocks[i + 1]) metrics.push({ value: entry.blocks[i].text, label: entry.blocks[i + 1].text }); } }
  const metricText = new Set(metrics.flatMap(m => [m.value, m.label]));
  const blocks = entry.blocks.map((b, i) => ({ ...b, i })).filter(b => !['p', 'h2', 'h3', 'h4', 'h5'].includes(b.type) || (!metricText.has(b.text) && b.text !== entry.summary && b.text !== 'Visit our events page'));
  const faqData = faqJsonLd(blocks);
  return <><StageSetter page={page} /><div className="ink-surface"><header className="detail-header"><Link href={back} className="text-link"><ArrowLeft size={15} /> {label}</Link>{page === 'blog' ? (
    <div className="detail-header-grid mt-6">
      <div className="detail-header-main">
        <Reveal>
          <h1 data-cms-entry="title">{entry.title}</h1>
          <p className="micro-label">{entry.category}{entry.date && ` / ${entry.date}`}</p>
          <p data-cms-entry="summary" className="detail-deck mt-7">{entry.summary}</p>
        </Reveal>
      </div>
      <div className="detail-header-aside">
        <Reveal delay={0.2}>
          <GrowCtaCard />
        </Reveal>
      </div>
    </div>
  ) : (
    <Reveal><h1 data-cms-entry="title">{entry.title}</h1><p className="micro-label">{entry.category}{entry.date && ` / ${entry.date}`}</p><p data-cms-entry="summary" className="detail-deck mt-7">{entry.summary}</p></Reveal>
  )}</header>
    <div className="detail-layout"><aside className="detail-aside"><span className="micro-label">{label}</span><p>Ideas, expertise and a shared ambition.<br />Thinklab Digital Solutions.</p><Link href={destination}>{cta}<ArrowUpRight size={16} /></Link><Link href={back}>Explore more<ArrowUpRight size={16} /></Link></aside><article>
      {entry.image && <div data-cms-entry="image" className="detail-image"><Image unoptimized={entry.image.startsWith('/api/cms-media/') || entry.image.startsWith('http')} src={entry.image} alt={('alt' in entry && typeof entry.alt==='string' ? entry.alt : entry.title)} fill sizes="(max-width: 900px) 90vw, 65vw" priority /></div>}
      {metrics.length > 0 && <div className="project-metrics">{metrics.map(m => <div key={m.label}><strong>{m.value}</strong><span>{m.label}</span></div>)}</div>}
      {faqData && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqData }} />}
      <RichContent blocks={blocks} editable={Boolean(canvas.previewId)} />
      {entry.slug === 'pr-events' && <a href="https://events.thinklabdigitalsolutions.com" className="btn-drop px-7 py-4 mt-8">Visit Thinklab Events <ArrowUpRight size={18} /></a>}
      {isJob && <CareerApplyForm role={entry.title} roleSlug={entry.slug} />}
      <div className="detail-end">{!isJob && <><Link href={destination} className="btn-drop px-7 py-4">{cta}<ArrowUpRight size={18} /></Link><p className="mt-6 text-xs text-[#aaa6b2]">Have a different challenge in mind? We’d love to hear it.</p></>}<Link href={back} className="text-link mt-7"><ArrowLeft size={15} /> Back to {label.toLowerCase()}</Link></div>
    </article></div></div></>;
}
