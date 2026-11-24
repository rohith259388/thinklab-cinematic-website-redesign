'use client';
import { useCanvasContent } from '@/components/cms/Canvas';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { ensureGsap } from '@/lib/gsap';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import StageSetter from '@/components/experience/StageSetter';
import RichContent, { faqJsonLd } from './RichContent';
import { type LiveEntry } from '@/lib/live';
import type { PageKey } from '@/lib/motion';
import { Reveal } from '@/components/ui/Reveal';
import CareerApplyForm from '@/components/ui/CareerApplyForm';
import GrowCtaCard from '@/components/ui/GrowCtaCard';
import ProjectHero from './ProjectHero';
import ArticleFaqSection from './ArticleFaqSection';
import type { ArticleFaqData } from '@/lib/cms/schema';
import { GalleryBackLink } from '@/components/transition/ProjectTransition';

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
  const faq = 'faq' in entry ? (entry.faq as ArticleFaqData | undefined) : undefined;
  const faqItems = (faq?.items ?? []).filter((it) => it.title.trim() && it.body.trim());
  // FAQ structured data covers FAQ blocks inside the body and the article's own FAQ section.
  const faqData = faqJsonLd(faqItems.length ? [...blocks, { type: 'faqs', text: faq!.heading, items: faqItems }] : blocks);
  const altText = 'alt' in entry && typeof entry.alt === 'string' ? entry.alt : entry.title;
  const projectHero = page === 'projects' && Boolean(entry.image);
  const body = useRef<HTMLDivElement>(null);
  const editing = Boolean(canvas.previewId);

  // Case-study content rises into the expanded page block by block as it scrolls in.
  useEffect(() => {
    const root = body.current;
    if (!projectHero || editing || !root || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const { gsap, ScrollTrigger } = ensureGsap();
    const ctx = gsap.context(() => {
      const items = root.querySelectorAll<HTMLElement>('.detail-aside, .project-metrics > div, .rich-copy > *, .detail-end > *');
      gsap.set(items, { y: 56, autoAlpha: 0 });
      ScrollTrigger.batch(items, {
        start: 'top 90%',
        once: true,
        onEnter: (batch) => gsap.to(batch, { y: 0, autoAlpha: 1, duration: 1, stagger: 0.09, ease: 'power3.out', overwrite: true }),
      });
    }, root);
    return () => ctx.revert();
  }, [projectHero, editing, entry.slug]);
  return <><StageSetter page={page} />{projectHero && <ProjectHero slug={entry.slug} title={entry.title} summary={entry.summary} category={entry.category} date={entry.date} image={entry.image} alt={altText} back={back} label={label} />}<div ref={body} className={projectHero ? 'project-detail-body' : 'ink-surface'} {...(projectHero ? { 'data-light-surface': '' } : {})}>{!projectHero && <header className="detail-header"><GalleryBackLink href={back} className="text-link"><ArrowLeft size={15} /> {label}</GalleryBackLink>{page === 'blog' ? (
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
  )}</header>}
    <div className={`detail-layout${projectHero ? ' detail-layout--after-hero' : ''}`}><aside className="detail-aside"><span className="micro-label">{label}</span><p>Ideas, expertise and a shared ambition.<br />Thinklab Digital Solutions.</p><Link href={destination}>{cta}<ArrowUpRight size={16} /></Link><GalleryBackLink href={back}>Explore more<ArrowUpRight size={16} /></GalleryBackLink></aside><article>
      {entry.image && !projectHero && (
        <div data-cms-entry="image" className="detail-image">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={entry.image}
            alt={altText}
            loading="eager"
            decoding="async"
            className="detail-adaptive-img"
          />
        </div>
      )}
      {metrics.length > 0 && <div className="project-metrics">{metrics.map(m => <div key={m.label}><strong>{m.value}</strong><span>{m.label}</span></div>)}</div>}
      {faqData && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: faqData }} />}
      <RichContent blocks={blocks} editable={Boolean(canvas.previewId)} html={'html' in entry ? (entry.html as string) : undefined} />
      {faq && faq.items.length > 0 && <ArticleFaqSection faq={faq} editable={editing} />}
      {entry.slug === 'pr-events' && <a href="https://events.thinklabdigitalsolutions.com" className="btn-drop px-7 py-4 mt-8">Visit Thinklab Events <ArrowUpRight size={18} /></a>}
      {isJob && <CareerApplyForm role={entry.title} roleSlug={entry.slug} />}
      <div className="detail-end">{!isJob && <><Link href={destination} className="btn-drop px-7 py-4">{cta}<ArrowUpRight size={18} /></Link><p className="mt-6 text-xs text-[#aaa6b2]">Have a different challenge in mind? We’d love to hear it.</p></>}<GalleryBackLink href={back} className="text-link mt-7"><ArrowLeft size={15} /> Back to {label.toLowerCase()}</GalleryBackLink></div>
    </article></div></div></>;
}
