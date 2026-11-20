'use client';
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { emptyContent, type Content } from '@/lib/cms/schema';
import { builtInPages, newSection, pageTemplates, slugify } from '@/lib/cms/blocks';
import { sectionIcons } from './shared';
import SeoFields from './SeoFields';

/** “New page” dialog: name → address → starting layout. */
export default function PageModal({
  existingSlugs,
  busy,
  onClose,
  onSubmit,
}: {
  existingSlugs: string[];
  busy: boolean;
  onClose: () => void;
  onSubmit: (data: { title: string; slug: string; content: Content }) => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [template, setTemplate] = useState('landing');
  const [menu, setMenu] = useState(true);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const key = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [onClose]);

  const taken = [...builtInPages, ...existingSlugs, 'admin', 'api', 'images'];

  const submit = async () => {
    setError('');
    const clean = slugify(slug);
    if (!title.trim()) return setError('Please give the page a name.');
    if (!clean) return setError('Please enter a web address for the page.');
    if (taken.includes(clean)) return setError('That web address is already used. Try another one.');
    const tpl = pageTemplates.find((t) => t.id === template) ?? pageTemplates[0];
    const content = emptyContent(title.trim());
    // Every page gets an FAQ section, whichever layout was picked.
    const types = tpl.sections.includes('faq') ? tpl.sections : [...tpl.sections, 'faq' as const];
    content.sections = types.map((type) => {
      const s = newSection(type);
      if (type === 'hero') {
        s.title = title.trim();
        s.kicker = title.trim().toUpperCase();
      }
      return s;
    });
    content.seoTitle = seoTitle.trim() || title.trim();
    content.seoDescription = seoDescription.trim();
    content.summary = seoDescription.trim();
    if (menu) content.fields = { 'page.menu': 'show' };
    await onSubmit({ title: title.trim(), slug: clean, content });
  };

  return (
    <div className="cms-modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form
        className="cms-modal cms-page-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Create a new page"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <header>
          <div>
            <h2>Create a new page</h2>
            <p>Give it a name, pick a starting layout, then edit everything on the page.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </header>
        <div className="cms-page-modal-body">
          <label className="cms-field">
            <span className="cms-step">1</span> Page name
            <input
              autoFocus
              placeholder="e.g. SEO Services in Hyderabad"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
            />
          </label>
          <label className="cms-field">
            <span className="cms-step">2</span> Web address
            <span className="cms-slug-input">
              <span>thinklabdigitalsolutions.com/</span>
              <input
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'));
                }}
              />
            </span>
            <small>Filled in automatically. Can’t be changed after the page is created.</small>
          </label>
          <div className="cms-field">
            <span>
              <span className="cms-step">3</span> Starting layout
            </span>
            <div className="cms-template-grid">
              {pageTemplates.map((t) => (
                <button
                  type="button"
                  key={t.id}
                  className={template === t.id ? 'active' : ''}
                  onClick={() => setTemplate(t.id)}
                  aria-pressed={template === t.id}
                >
                  <span className="cms-template-preview">
                    {t.sections.map((type, i) => {
                      const Icon = sectionIcons[type];
                      return <Icon key={i} size={12} />;
                    })}
                  </span>
                  <strong>{t.label}</strong>
                  <small>{t.description}</small>
                </button>
              ))}
            </div>
          </div>
          <div className="cms-field">
            <span>
              <span className="cms-step">4</span> How it appears in Google
            </span>
            <SeoFields
              title={seoTitle}
              description={seoDescription}
              fallbackTitle={title}
              fallbackDescription=""
              path={'/' + (slugify(slug) || 'new-page')}
              onChange={(p) => {
                if (p.seoTitle !== undefined) setSeoTitle(p.seoTitle);
                if (p.seoDescription !== undefined) setSeoDescription(p.seoDescription);
              }}
            />
          </div>
          <label className="cms-check">
            <input type="checkbox" checked={menu} onChange={(e) => setMenu(e.target.checked)} />
            Show this page in the website menu (once published)
          </label>
          {error && <p className="cms-form-error">{error}</p>}
        </div>
        <footer>
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="cms-primary" disabled={busy}>
            {busy ? 'Creating…' : 'Create page'}
          </button>
        </footer>
      </form>
    </div>
  );
}
