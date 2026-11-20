'use client';
/* eslint-disable @next/next/no-img-element -- CMS images come from uploads or editor-supplied URLs */
import { Suspense, useState, type CSSProperties, type ReactNode } from 'react';
import Link from 'next/link';
import { ArrowUpRight, ChevronDown } from 'lucide-react';
import LeadForm from '@/components/ui/LeadForm';
import type { Section } from '@/lib/cms/schema';
import { faqGroups, videoEmbed, type FaqGroup } from '@/lib/cms/blocks';

export type EditProps = { 'data-cms-edit'?: string; 'data-cms-global'?: string };

/** Paragraphs separated by blank lines; single line breaks are kept. */
export function Paragraphs({ text, className, edit }: { text: string; className?: string; edit?: EditProps }) {
  if (!text.trim()) return null;
  return (
    <div className={className} {...edit}>
      {text.split(/\n{2,}/).map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}

function Button({ href, label }: { href: string; label: string }) {
  if (!label || !href) return null;
  const external = /^https?:/.test(href);
  return external ? (
    <a href={href} className="btn-drop cms-s-btn" target="_blank" rel="noreferrer">
      {label} <ArrowUpRight size={17} />
    </a>
  ) : (
    <Link href={href} className="btn-drop cms-s-btn">
      {label} <ArrowUpRight size={17} />
    </Link>
  );
}

export function SectionView({
  section: s,
  preview,
  global,
}: {
  section: Section;
  preview: boolean;
  global: boolean;
}) {
  if (s.hidden && !preview) return null;
  const g = global ? 'true' : 'false';
  // Attributes that make a piece of text editable by clicking it in the Studio preview.
  const e = (path: string): EditProps =>
    preview ? { 'data-cms-edit': `s:${s.id}:${path}`, 'data-cms-global': g } : {};
  // Non-text parts (images): clicking them reveals their control in the Studio panel.
  const pick = (path: string) =>
    preview ? { 'data-cms-pick': `s:${s.id}:${path}`, 'data-cms-global': g } : {};
  const head = (
    <>
      {s.kicker && (
        <p className="micro-label cms-s-kicker" {...e('kicker')}>
          {s.kicker}
        </p>
      )}
      {s.title && s.type !== 'quote' && (
        <h2 className={s.type === 'hero' ? 'cms-s-hero-title' : 'cms-s-title'} {...e('title')}>
          {s.title}
        </h2>
      )}
    </>
  );
  const cols = { '--cms-cols': s.layout && /^[234]$/.test(s.layout) ? s.layout : '3' } as CSSProperties;
  let body: ReactNode = null;

  switch (s.type) {
    case 'hero':
      body = (
        <div className="cms-s-wrap">
          {head}
          <Paragraphs text={s.body} className="cms-s-lead" edit={e('body')} />
          <Button href={s.href} label={s.label} />
        </div>
      );
      break;
    case 'text':
      body = (
        <div className="cms-s-wrap cms-s-narrow">
          {head}
          <Paragraphs text={s.body} className="cms-s-copy" edit={e('body')} />
        </div>
      );
      break;
    case 'image':
      body = (
        <figure className="cms-s-wrap cms-s-figure">
          {s.image ? (
            <img src={s.image} alt={s.alt} loading="lazy" {...pick('image')} />
          ) : (
            preview && <div className="cms-s-placeholder">Choose an image in the editor →</div>
          )}
          {(s.title || s.body) && (
            <figcaption>
              {s.title && <strong {...e('title')}>{s.title}</strong>}
              <Paragraphs text={s.body} edit={e('body')} />
            </figcaption>
          )}
        </figure>
      );
      break;
    case 'imageText':
      body = (
        <div className={`cms-s-wrap cms-s-split ${s.layout === 'right' ? 'is-reversed' : ''}`}>
          <div className="cms-s-split-media">
            {s.image ? (
              <img src={s.image} alt={s.alt} loading="lazy" {...pick('image')} />
            ) : (
              preview && <div className="cms-s-placeholder">Choose an image →</div>
            )}
          </div>
          <div>
            {head}
            <Paragraphs text={s.body} className="cms-s-copy" edit={e('body')} />
            <Button href={s.href} label={s.label} />
          </div>
        </div>
      );
      break;
    case 'features':
      body = (
        <div className="cms-s-wrap">
          {head}
          <Paragraphs text={s.body} className="cms-s-lead" edit={e('body')} />
          <div className="cms-s-grid" style={cols}>
            {s.items.map((it, i) => {
              const card = (
                <>
                  {it.image && <img src={it.image} alt="" loading="lazy" className="cms-s-card-img" {...pick(`items:${i}:image`)} />}
                  <span className="cms-s-index">{String(i + 1).padStart(2, '0')}</span>
                  <h3 {...e(`items:${i}:title`)}>{it.title}</h3>
                  <Paragraphs text={it.body} edit={e(`items:${i}:body`)} />
                  {it.href && <ArrowUpRight className="cms-s-card-arrow" size={18} />}
                </>
              );
              return it.href && !preview ? (
                <Link key={i} href={it.href} className="cms-s-card">
                  {card}
                </Link>
              ) : (
                <div key={i} className="cms-s-card">
                  {card}
                </div>
              );
            })}
          </div>
        </div>
      );
      break;
    case 'stats':
      body = (
        <div className="cms-s-wrap">
          {head}
          <div className="cms-s-grid cms-s-stats" style={cols}>
            {s.items.map((it, i) => (
              <div key={i}>
                <strong {...e(`items:${i}:title`)}>{it.title}</strong>
                <span {...e(`items:${i}:body`)}>{it.body}</span>
              </div>
            ))}
          </div>
        </div>
      );
      break;
    case 'faq':
      body = <FaqSection section={s} head={head} edit={e} preview={preview} />;
      break;
    case 'testimonials':
      body = (
        <div className="cms-s-wrap">
          {head}
          <div className="cms-s-grid" style={cols}>
            {s.items.map((it, i) => (
              <blockquote key={i} className="cms-s-card cms-s-testimonial">
                <Paragraphs text={it.body} edit={e(`items:${i}:body`)} />
                <footer>
                  {it.image && <img src={it.image} alt="" loading="lazy" {...pick(`items:${i}:image`)} />}
                  <span {...e(`items:${i}:title`)}>{it.title}</span>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      );
      break;
    case 'gallery':
      body = (
        <div className="cms-s-wrap">
          {head}
          <div className="cms-s-grid cms-s-gallery" style={cols}>
            {s.items.map((it, i) => (
              <figure key={i}>
                {it.image ? (
                  <img src={it.image} alt={it.title} loading="lazy" {...pick(`items:${i}:image`)} />
                ) : (
                  preview && <div className="cms-s-placeholder">Image {i + 1}</div>
                )}
                {it.title && <figcaption {...e(`items:${i}:title`)}>{it.title}</figcaption>}
              </figure>
            ))}
          </div>
        </div>
      );
      break;
    case 'logos':
      body = (
        <div className="cms-s-wrap">
          {head}
          <div className="cms-s-logos">
            {s.items.map((it, i) =>
              it.image ? (
                <img key={i} src={it.image} alt={it.title} loading="lazy" {...pick(`items:${i}:image`)} />
              ) : (
                <span key={i} {...e(`items:${i}:title`)}>
                  {it.title}
                </span>
              ),
            )}
            {preview && s.items.length === 0 && <div className="cms-s-placeholder">Add logos in the editor →</div>}
          </div>
        </div>
      );
      break;
    case 'cta':
      body = (
        <div className="cms-s-wrap cms-s-cta">
          {head}
          <Paragraphs text={s.body} className="cms-s-lead" edit={e('body')} />
          <Button href={s.href} label={s.label} />
        </div>
      );
      break;
    case 'quote':
      body = (
        <figure className="cms-s-wrap cms-s-quote">
          <blockquote {...e('body')}>{s.body}</blockquote>
          {s.title && <figcaption {...e('title')}>— {s.title}</figcaption>}
        </figure>
      );
      break;
    case 'video': {
      const src = videoEmbed(s.href);
      body = (
        <div className="cms-s-wrap">
          {head}
          {src ? (
            <div className="cms-s-video">
              <iframe
                src={src}
                title={s.title || 'Video'}
                loading="lazy"
                allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                style={preview ? { pointerEvents: 'none' } : undefined}
              />
            </div>
          ) : (
            preview && <div className="cms-s-placeholder">Paste a YouTube or Vimeo link in the editor →</div>
          )}
          <Paragraphs text={s.body} className="cms-s-copy" edit={e('body')} />
        </div>
      );
      break;
    }
    case 'contact':
      body = (
        <div className="cms-s-wrap cms-s-faq">
          <div>
            {head}
            <Paragraphs text={s.body} className="cms-s-copy" edit={e('body')} />
          </div>
          <div className="cms-s-form">
            <Suspense fallback={null}>
              <LeadForm source="custom-page" />
            </Suspense>
          </div>
        </div>
      );
      break;
    case 'divider':
      body = <hr className="cms-s-wrap cms-s-divider" />;
      break;
  }

  return (
    <section
      data-cms-section={s.id}
      data-cms-global={g}
      className={`cms-s cms-s-${s.type}${s.hidden ? ' is-hidden' : ''}`}
      style={{
        background: s.background || undefined,
        color: s.color || undefined,
        paddingTop: s.padding,
        paddingBottom: s.padding,
        textAlign: s.align,
        backgroundImage:
          s.type === 'hero' && s.image
            ? `linear-gradient(rgba(10,9,16,.55), rgba(10,9,16,.75)), url("${s.image.replace(/"/g, '')}")`
            : undefined,
      }}
    >
      {s.hidden && preview && <span className="cms-s-hidden-badge">Hidden from visitors</span>}
      {body}
    </section>
  );
}

/** FAQPage structured data so Google can show the questions in search results. */
export function faqSchema(items: Section['items']) {
  const qa = items.filter((it) => it.title.trim() && it.body.trim());
  if (!qa.length) return null;
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: qa.map((it) => ({
      '@type': 'Question',
      name: it.title,
      acceptedAnswer: { '@type': 'Answer', text: it.body },
    })),
  }).replace(/</g, '\\u003c');
}

/**
 * Category-wise FAQ: category tabs beside one card of questions. With a single
 * category the tabs are hidden and it reads as a plain FAQ.
 */
function FaqSection({
  section: s,
  head,
  edit,
  preview,
}: {
  section: Section;
  head: ReactNode;
  edit: (path: string) => EditProps;
  preview: boolean;
}) {
  const groups = faqGroups(s.items);
  const [active, setActive] = useState(0);
  const current = Math.min(active, Math.max(0, groups.length - 1));
  const showTabs = groups.length > 1;
  const schema = !preview && !s.hidden ? faqSchema(s.items) : null;
  return (
    <div className="cms-s-wrap cms-s-faq">
      <div className="cms-s-faq-side">
        {head}
        <Paragraphs text={s.body} className="cms-s-copy" edit={edit('body')} />
        {showTabs && (
          <div className="cms-s-faq-tabs" role="tablist" aria-label="FAQ categories">
            {groups.map((g, i) => (
              <button
                key={g.name + i}
                type="button"
                role="tab"
                aria-selected={i === current}
                data-cms-toggle=""
                className={i === current ? 'active' : ''}
                onClick={() => setActive(i)}
              >
                <span>{g.name || 'General'}</span>
                <small>{g.questions.length}</small>
              </button>
            ))}
          </div>
        )}
      </div>
      <div role={showTabs ? 'tabpanel' : undefined}>
        {groups.length === 0 ? (
          preview && <div className="cms-s-placeholder">Add questions in the editor →</div>
        ) : (
          <FaqList key={current} questions={groups[current].questions} edit={edit} />
        )}
      </div>
      {schema && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: schema }} />}
    </div>
  );
}

/**
 * Category FAQ for articles (blog, projects, careers): category pills above one
 * card of questions. `edit` builds the in-place edit attributes for a question path.
 */
export function ArticleFaq({
  heading,
  items,
  edit,
  headingEdit,
}: {
  heading: string;
  items: Section['items'];
  edit: (path: string) => EditProps;
  headingEdit?: EditProps;
}) {
  const groups = faqGroups(items);
  const [active, setActive] = useState(0);
  const current = Math.min(active, Math.max(0, groups.length - 1));
  const showTabs = groups.length > 1;
  return (
    <div className="rich-faqs">
      {heading && <h2 {...headingEdit}>{heading}</h2>}
      {showTabs && (
        <div className="cms-s-faq-tabs is-row" role="tablist" aria-label="FAQ categories">
          {groups.map((g, i) => (
            <button
              key={g.name + i}
              type="button"
              role="tab"
              aria-selected={i === current}
              data-cms-toggle=""
              className={i === current ? 'active' : ''}
              onClick={() => setActive(i)}
            >
              <span>{g.name || 'General'}</span>
              <small>{g.questions.length}</small>
            </button>
          ))}
        </div>
      )}
      {groups.length > 0 && <FaqList key={current} questions={groups[current].questions} edit={edit} />}
    </div>
  );
}

function FaqList({
  questions,
  edit,
}: {
  questions: FaqGroup['questions'];
  edit: (path: string) => EditProps;
}) {
  // All questions start closed; clicking a question or its arrow opens/closes it.
  const [open, setOpen] = useState(-1);
  return (
    <div className="cms-s-faq-list">
      {questions.map(({ item: it, index: i }) => {
        const isOpen = open === i;
        return (
          <div key={i} className={isOpen ? 'is-open' : ''}>
            <button
              type="button"
              data-cms-toggle=""
              onClick={() => setOpen(isOpen ? -1 : i)}
              aria-expanded={isOpen}
            >
              <span {...edit(`items:${i}:title`)}>{it.title}</span>
              <ChevronDown size={20} aria-hidden="true" className="cms-s-faq-arrow" />
            </button>
            <div className="cms-s-faq-answer" hidden={!isOpen}>
              <Paragraphs text={it.body} edit={edit(`items:${i}:body`)} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
