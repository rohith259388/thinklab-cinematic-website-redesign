/* eslint-disable @next/next/no-img-element -- article images come from uploads or editor-supplied URLs */
import { Fragment, type ReactNode } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ChevronDown } from 'lucide-react';
import type { ContentBlock } from '@/lib/live';
import type { SectionItem } from '@/lib/cms/schema';
import { ArticleFaq } from '@/components/cms/Sections';

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

/**
 * Renders article blocks. With `editable`, each block carries the attribute the
 * Studio preview uses to edit it in place; `i` is the block's index in the draft.
 */
export default function RichContent({ blocks, editable = false }: { blocks: RichBlock[]; editable?: boolean }) {
  const edit = (b: RichBlock, extra = false) =>
    editable && b.i !== undefined ? { 'data-cms-edit': `b:${b.i}${extra ? ':extra' : ''}` } : {};
  const result: ReactNode[] = [];
  for (let n = 0; n < blocks.length; n++) {
    const b = blocks[n];
    if (b.type === 'li' || b.type === 'ol') {
      const list = [b];
      while (blocks[n + 1]?.type === b.type) list.push(blocks[++n]);
      const items = list.map((item, j) => <li key={j} {...edit(item)}>{linkedText(item.text)}</li>);
      result.push(b.type === 'ol' ? <ol key={n}>{items}</ol> : <ul key={n}>{items}</ul>);
    } else if (b.type === 'faq') {
      const list = [b];
      while (blocks[n + 1]?.type === 'faq') list.push(blocks[++n]);
      result.push(
        <div key={n} className="rich-faq">
          {list.map((item, j) => (
            <details key={j}>
              <summary data-cms-toggle="">
                <span {...edit(item)}>{item.text}</span>
                <ChevronDown size={20} aria-hidden="true" className="rich-faq-arrow" />
              </summary>
              <div {...edit(item, true)}>{(item.extra || '').split(/\n{2,}/).map((p, k) => <p key={k}>{linkedText(p)}</p>)}</div>
            </details>
          ))}
        </div>,
      );
    } else if (b.type === 'faqs') {
      const prefix = editable && b.i !== undefined ? `b:${b.i}:` : null;
      result.push(
        <ArticleFaq
          key={n}
          heading={b.text}
          items={b.items ?? []}
          headingEdit={edit(b)}
          edit={(path) => (prefix ? { 'data-cms-edit': prefix + path } : {})}
        />,
      );
    } else if (b.type === 'img') {
      if (!b.text) { if (editable) result.push(<div key={n} className="cms-s-placeholder">Choose an image in the editor →</div>); continue; }
      result.push(
        <figure key={n} className="rich-figure">
          <img src={b.text} alt={b.extra || ''} loading="lazy" {...(editable && b.i !== undefined ? { 'data-cms-pick': `b:${b.i}` } : {})} />
          {b.extra && <figcaption {...edit(b, true)}>{b.extra}</figcaption>}
        </figure>,
      );
    } else if (b.type === 'quote') result.push(<blockquote key={n} className="rich-quote" {...edit(b)}>{b.text}</blockquote>);
    else if (b.type === 'button') {
      if (!b.text) continue;
      const href = b.extra || '/contact';
      result.push(
        <p key={n}>
          {/^https?:/.test(href)
            ? <a href={href} className="btn-drop px-7 py-4" target="_blank" rel="noreferrer" {...edit(b)}>{b.text} <ArrowUpRight size={17} /></a>
            : <Link href={href} className="btn-drop px-7 py-4" {...edit(b)}>{b.text} <ArrowUpRight size={17} /></Link>}
        </p>,
      );
    } else if (b.type === 'divider') result.push(<hr key={n} className="rich-divider" />);
    else if (b.type === 'h2' || b.type === 'h3') result.push(<h2 key={n} {...edit(b)}>{linkedText(b.text)}</h2>);
    else if (b.type === 'h4' || b.type === 'h5') result.push(<h3 key={n} {...edit(b)}>{linkedText(b.text)}</h3>);
    else {
      const paras = b.text.split(/\r?\n\s*\r?\n/).filter((p) => p.trim().length > 0);
      if (paras.length > 1) {
        paras.forEach((para, k) => {
          result.push(
            <p key={`${n}-${k}`} {...(k === 0 ? edit(b) : {})}>
              {linkedText(para)}
            </p>
          );
        });
      } else {
        result.push(
          <p key={n} {...edit(b)}>
            {linkedText(b.text)}
          </p>
        );
      }
    }
  }
  return <div className="rich-copy">{result}</div>;
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
