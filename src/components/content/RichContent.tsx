/* eslint-disable @next/next/no-img-element -- article images come from uploads or editor-supplied URLs */
'use client';

import { Fragment, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Check, ChevronDown, Lightbulb, Quote } from 'lucide-react';
import type { ContentBlock } from '@/lib/live';
import type { SectionItem } from '@/lib/cms/schema';
import { ArticleFaq } from '@/components/cms/Sections';
import { sanitizeArticleHtml } from '@/lib/cms/sanitize';
import { structureContent, type Inline, type Section, type StructuredDoc } from '@/lib/cms/structure';

export type RichBlock = ContentBlock & { extra?: string; items?: SectionItem[]; i?: number };

const localLinks: Record<string, string> = { '/projects': '/projects', '/case-studies': '/projects', '/services': '/services', '/contact-us': '/contact', '/about-us': '/about', '/blogs': '/blog' };
function linkedText(text: string) {
  return text.split(/(https?:\/\/[^\s]+)/g).map((part, i) => {
    if (!part.startsWith('http')) return part;
    const clean = part.replace(/[.,)]+$/, '');
    let href = clean;
    try { const url = new URL(clean); if (url.hostname.includes('thinklabdigitalsolutions.com') && localLinks[url.pathname]) href = localLinks[url.pathname]; } catch { return part; }
    return <Fragment key={i}><Link className="underline decoration-[#c5b0ff] underline-offset-4 break-words" href={href}>{href.startsWith('/') ? 'Explore Thinklab' : clean}</Link>{part.slice(clean.length)}</Fragment>;
  });
}

/** Build the auto-laid-out document for an entry (HTML from the rich editor wins over legacy blocks). */
export function structureEntry(blocks: RichBlock[], html?: string): StructuredDoc<RichBlock> {
  return structureContent(blocks, html, sanitizeArticleHtml);
}

type TextTag = 'span' | 'p' | 'h2' | 'h3' | 'strong' | 'blockquote';
const pad = (n: number) => String(n + 1).padStart(2, '0');

/**
 * Renders article content with automatic layout: lists become checklists or cards, "Label: value"
 * lines become a fact table, numbered points become steps, and so on (see lib/cms/structure).
 */
export default function RichContent({
  doc,
  editable = false,
  html,
}: {
  doc: StructuredDoc<RichBlock>;
  editable?: boolean;
  html?: string;
}) {
  const fromHtml = Boolean(html && html.trim());
  /** Click-to-edit path for content that came from a legacy block. */
  const ed = (c?: Inline) => (editable && !fromHtml && c?.src !== undefined ? { 'data-cms-edit': `b:${c.src}` } : {});
  /** Editor text: sanitized inline HTML, or plain text with auto-linked URLs. */
  const t = (c: Inline, Tag: TextTag = 'span', className?: string): ReactNode =>
    c.html !== undefined ? (
      <Tag className={className} {...ed(c)} dangerouslySetInnerHTML={{ __html: c.html }} />
    ) : (
      <Tag className={className} {...ed(c)}>{linkedText(c.text)}</Tag>
    );
  const intro = (c?: Inline) => (c ? t(c, 'p', 'rx-intro') : null);

  const render = (s: Section<RichBlock>, n: number): ReactNode => {
    switch (s.kind) {
      case 'p':
        return <Fragment key={n}>{t(s.c, 'p', s.lead ? 'rx-lead' : s.emphasis ? 'rx-emphasis' : undefined)}</Fragment>;
      case 'h':
        return (
          <div key={n} className={`rx-heading${s.num ? ' rx-heading--num' : ''}`} id={s.id}>
            {s.kicker && t(s.kicker, 'span', 'rx-kicker')}
            {s.num && <span className="rx-num" aria-hidden="true">{s.num}</span>}
            {t(s.c, s.level === 2 ? 'h2' : 'h3')}
          </div>
        );
      case 'checklist':
        return <Checklist key={n} items={s.items} ordered={s.ordered} intro={intro(s.intro)} text={(c) => t(c)} />;
      case 'cards':
        return (
          <div key={n} className="rx-block">
            {intro(s.intro)}
            <div className={`rx-cards${s.items.length % 3 === 0 && s.items.every((it) => (it.body?.text.length ?? 0) < 170) ? ' rx-cards--3' : ''}`}>
              {s.items.map((it, k) => (
                <article key={k} className="rx-card">
                  <span className="rx-card-num" aria-hidden="true">{pad(k)}</span>
                  {t(it.title, 'h3')}
                  {it.body && t(it.body, 'p')}
                </article>
              ))}
            </div>
          </div>
        );
      case 'stats':
        return (
          <div key={n} className="rx-block">
            {intro(s.intro)}
            <div className="rx-stats">
              {s.items.map((it, k) => (
                <div key={k} className="rx-stat" {...ed(it.label)}>
                  <strong>{it.value}</strong>
                  <span className="rx-stat-label">{it.label.text}</span>
                  {it.body && t(it.body, 'p')}
                </div>
              ))}
            </div>
          </div>
        );
      case 'facts':
        return (
          <div key={n} className="rx-block">
            {intro(s.intro)}
            <table className="rx-facts">
              <tbody>
                {s.rows.map((r, k) => (
                  <tr key={k} {...ed(r.value)}>
                    <th scope="row">{r.key}</th>
                    <td>{t(r.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'steps':
        return (
          <div key={n} className="rx-block">
            {intro(s.intro)}
            <ol className="rx-steps">
              {s.items.map((it, k) => (
                <li key={k}>
                  <span className="rx-step-dot" aria-hidden="true">{pad(k)}</span>
                  <div>
                    {t(it.title, 'h3')}
                    {it.body && t(it.body, 'p')}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        );
      case 'quotes':
        return (
          <div key={n} className="rx-block">
            {intro(s.intro)}
            <div className="rx-quotes">
              {s.items.map((q, k) => (
                <figure key={k} className="rx-quote" {...ed(q.quote)}>
                  <Quote size={22} aria-hidden="true" className="rx-quote-mark" />
                  {t(q.quote, 'blockquote')}
                  <figcaption>
                    <span className="rx-avatar" aria-hidden="true">{q.name.trim().charAt(0)}</span>
                    <span>
                      <strong>{q.name}</strong>
                      {q.role && <small>{q.role}</small>}
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        );
      case 'note':
        return (
          <aside key={n} className="rx-note">
            <span className="rx-note-label"><Lightbulb size={15} aria-hidden="true" /> {s.label}</span>
            {t(s.c, 'p')}
          </aside>
        );
      case 'callout':
        return (
          <aside key={n} className="rx-callout">
            {t(s.title, 'h3')}
            {s.body && t(s.body, 'p')}
            <Link href="/contact" className="rx-callout-cta">Talk to our team <ArrowUpRight size={17} /></Link>
          </aside>
        );
      case 'raw':
        return <div key={n} className="rx-raw" dangerouslySetInnerHTML={{ __html: s.html }} />;
      case 'block':
        return <Fragment key={n}>{renderBlock(s.block, n, editable)}</Fragment>;
    }
  };

  return (
    <div className="rich-copy rx" {...(fromHtml ? { 'data-cms-entry': 'html' } : {})}>
      {doc.sections.map(render)}
    </div>
  );
}

/** Long checklists show the first ten items with a "show all" toggle (all items stay in the page for SEO). */
function Checklist({
  items,
  ordered,
  intro,
  text,
}: {
  items: Inline[];
  ordered?: boolean;
  intro: ReactNode;
  text: (c: Inline) => ReactNode;
}) {
  const LIMIT = 10;
  const [all, setAll] = useState(false);
  const long = items.length > LIMIT + 2;
  const two = items.length >= 6 && items.reduce((a, c) => a + c.text.length, 0) / items.length < 150;
  return (
    <div className="rx-block">
      {intro}
      <ul className={`rx-checklist${two ? ' rx-checklist--2' : ''}${long && !all ? ' is-clipped' : ''}`}>
        {items.map((c, k) => (
          <li key={k} hidden={long && !all && k >= LIMIT ? true : undefined}>
            <span className="rx-check" aria-hidden="true">{ordered ? k + 1 : <Check size={13} strokeWidth={2.6} />}</span>
            {text(c)}
          </li>
        ))}
      </ul>
      {long && (
        <button type="button" className="rx-more" data-cms-toggle="" aria-expanded={all} onClick={() => setAll(!all)}>
          {all ? 'Show less' : `Show all ${items.length}`} <ChevronDown size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

/** Legacy block types that aren't prose (FAQs, images, buttons, quotes, dividers). */
function renderBlock(b: RichBlock, n: number, editable: boolean): ReactNode {
  const edit = (extra = false) => (editable && b.i !== undefined ? { 'data-cms-edit': `b:${b.i}${extra ? ':extra' : ''}` } : {});
  switch (b.type) {
    case 'faq':
      return (
        <div className="rich-faq">
          <details>
            <summary data-cms-toggle="">
              <span {...edit()}>{b.text}</span>
              <ChevronDown size={20} aria-hidden="true" className="rich-faq-arrow" />
            </summary>
            <div {...edit(true)}>{(b.extra || '').split(/\n{2,}/).map((p, k) => <p key={k}>{linkedText(p)}</p>)}</div>
          </details>
        </div>
      );
    case 'faqs': {
      const prefix = editable && b.i !== undefined ? `b:${b.i}:` : null;
      return (
        <ArticleFaq
          heading={b.text}
          items={b.items ?? []}
          headingEdit={edit()}
          edit={(path) => (prefix ? { 'data-cms-edit': prefix + path } : {})}
        />
      );
    }
    case 'img':
      if (!b.text) return editable ? <div className="cms-s-placeholder">Choose an image in the editor →</div> : null;
      return (
        <figure className="rich-figure">
          <img src={b.text} alt={b.extra || ''} loading="lazy" {...(editable && b.i !== undefined ? { 'data-cms-pick': `b:${b.i}` } : {})} />
          {b.extra && <figcaption {...edit(true)}>{b.extra}</figcaption>}
        </figure>
      );
    case 'quote':
      return <blockquote className="rich-quote" {...edit()}>{b.text}</blockquote>;
    case 'button': {
      if (!b.text) return null;
      const href = b.extra || '/contact';
      return (
        <p>
          {/^https?:/.test(href)
            ? <a href={href} className="btn-drop px-7 py-4" target="_blank" rel="noreferrer" {...edit()}>{b.text} <ArrowUpRight size={17} /></a>
            : <Link href={href} className="btn-drop px-7 py-4" {...edit()}>{b.text} <ArrowUpRight size={17} /></Link>}
        </p>
      );
    }
    case 'divider':
      return <hr className="rich-divider" />;
    default:
      return b.text ? <p {...edit()}>{linkedText(b.text)}</p> : null;
  }
}

/** FAQ structured data so search engines can show questions in results. */
export function faqJsonLd(blocks: RichBlock[]) {
  const faqs = [
    ...blocks.filter((b) => b.type === 'faq' && b.text && b.extra).map((b) => ({ q: b.text, a: b.extra! })),
    ...blocks.flatMap((b) => (b.type === 'faqs' ? b.items ?? [] : [])).filter((it) => it.title && it.body).map((it) => ({ q: it.title, a: it.body })),
  ];
  if (!faqs.length) return null;
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  }).replace(/</g, '\\u003c');
}
