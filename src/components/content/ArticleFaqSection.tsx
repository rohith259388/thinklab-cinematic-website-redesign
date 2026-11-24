'use client';

import { useId, useState } from 'react';
import { Plus } from 'lucide-react';
import { faqGroups } from '@/lib/cms/blocks';
import type { ArticleFaqData } from '@/lib/cms/schema';

type EditProps = { 'data-cms-edit'?: string };

/**
 * FAQ shown at the end of a blog article: optional category pills above one card of
 * numbered questions. Answers slide open (CSS grid-rows trick, no height measuring).
 * In the CMS preview, `editable` adds click-to-edit paths ("q:heading", "q:items:<i>:title|body").
 */
export default function ArticleFaqSection({ faq, editable = false }: { faq: ArticleFaqData; editable?: boolean }) {
  const groups = faqGroups(faq.items);
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(-1);
  const baseId = useId();
  const current = Math.min(active, Math.max(0, groups.length - 1));
  const edit = (path: string): EditProps => (editable ? { 'data-cms-edit': `q:${path}` } : {});
  const total = faq.items.length;
  if (!total) return null;

  return (
    <section className="article-faq" aria-labelledby={`${baseId}-h`}>
      <header className="article-faq-head">
        <span className="article-faq-kicker">
          FAQ <i aria-hidden="true" /> {total} question{total === 1 ? '' : 's'}
        </span>
        <h2 id={`${baseId}-h`} {...edit('heading')}>
          {faq.heading || 'Frequently asked questions'}
        </h2>
      </header>

      {groups.length > 1 && (
        <div className="article-faq-tabs" role="tablist" aria-label="FAQ categories">
          {groups.map((g, i) => (
            <button
              key={g.name + i}
              type="button"
              role="tab"
              aria-selected={i === current}
              data-cms-toggle=""
              className={i === current ? 'is-active' : ''}
              onClick={() => {
                setActive(i);
                setOpen(-1);
              }}
            >
              {g.name || 'General'}
              <small>{g.questions.length}</small>
            </button>
          ))}
        </div>
      )}

      <div className="article-faq-list">
        {groups[current]?.questions.map(({ item, index }, n) => {
          const isOpen = open === index;
          const panelId = `${baseId}-a${index}`;
          return (
            <div key={index} className={`article-faq-item${isOpen ? ' is-open' : ''}`}>
              <button
                type="button"
                className="article-faq-q"
                data-cms-toggle=""
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? -1 : index)}
              >
                <span className="article-faq-num" aria-hidden="true">
                  {String(n + 1).padStart(2, '0')}
                </span>
                <span className="article-faq-title" {...edit(`items:${index}:title`)}>
                  {item.title}
                </span>
                <span className="article-faq-icon" aria-hidden="true">
                  <Plus size={16} strokeWidth={1.8} />
                </span>
              </button>
              <div id={panelId} role="region" className="article-faq-a" aria-hidden={!isOpen}>
                <div>
                  <div className="article-faq-a-inner" {...edit(`items:${index}:body`)}>
                    {item.body
                      .split(/\n\s*\n/)
                      .filter((p) => p.trim())
                      .map((p, i) => (
                        <p key={i}>{p}</p>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
