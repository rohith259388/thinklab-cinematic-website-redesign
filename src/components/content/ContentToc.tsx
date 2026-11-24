'use client';

import { useEffect, useState, type MouseEvent } from 'react';
import { ChevronDown } from 'lucide-react';
import type { TocEntry } from '@/lib/cms/structure';

/**
 * "On this page" navigation built from the article's own headings. Desktop: a sticky list in the
 * side column with the current section highlighted and a reading-progress rail. Mobile: a
 * collapsible panel above the article.
 */
export default function ContentToc({ toc, mobile = false }: { toc: TocEntry[]; mobile?: boolean }) {
  const [active, setActive] = useState(toc[0]?.id ?? '');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (mobile) return;
    const heads = toc.map((t) => document.getElementById(t.id)).filter((el): el is HTMLElement => Boolean(el));
    if (!heads.length) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const line = window.innerHeight * 0.3;
      let current = heads[0].id;
      for (const h of heads) if (h.getBoundingClientRect().top <= line) current = h.id;
      setActive(current);
      const article = heads[0].closest('.rich-copy');
      if (article) {
        const r = article.getBoundingClientRect();
        setProgress(Math.min(1, Math.max(0, (line - r.top) / Math.max(1, r.height - line))));
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [toc, mobile]);

  const go = (e: MouseEvent<HTMLAnchorElement>, id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    const y = el.getBoundingClientRect().top + window.scrollY - 140;
    if (window.__lenis) window.__lenis.scrollTo(y, { force: true });
    else window.scrollTo({ top: y, behavior: 'smooth' });
    history.replaceState(null, '', `#${id}`);
  };

  const list = (
    <ol className="rx-toc-list">
      {toc.map((t, i) => (
        <li key={t.id} className={!mobile && t.id === active ? 'is-active' : undefined}>
          <a href={`#${t.id}`} onClick={(e) => go(e, t.id)}>
            <span className="rx-toc-num">{t.num ?? String(i + 1).padStart(2, '0')}</span>
            <span>{t.title}</span>
          </a>
        </li>
      ))}
    </ol>
  );

  if (mobile)
    return (
      <details className="rx-toc rx-toc--mobile">
        <summary data-cms-toggle="">
          <span className="micro-label">On this page · {toc.length} sections</span>
          <ChevronDown size={18} aria-hidden="true" />
        </summary>
        {list}
      </details>
    );

  return (
    <nav className="rx-toc" aria-label="On this page">
      <span className="micro-label">On this page</span>
      <div className="rx-toc-rail" aria-hidden="true">
        <i style={{ transform: `scaleY(${progress})` }} />
      </div>
      {list}
    </nav>
  );
}
