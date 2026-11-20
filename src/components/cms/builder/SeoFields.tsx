'use client';

const TITLE_MAX = 60;
const DESC_MAX = 160;

function Counter({ length, max }: { length: number; max: number }) {
  const state = length === 0 ? 'empty' : length > max ? 'over' : length < max * 0.5 ? 'short' : 'good';
  return (
    <span className={`cms-seo-count is-${state}`}>
      {length}/{max}
      {state === 'over' ? ' · too long, Google will cut it off' : state === 'short' ? ' · could be longer' : state === 'good' ? ' · good length' : ''}
    </span>
  );
}

/**
 * Meta title + meta description with live counters and a preview of how the
 * page will look in Google results.
 */
export default function SeoFields({
  title,
  description,
  fallbackTitle,
  fallbackDescription,
  path,
  onChange,
}: {
  title: string;
  description: string;
  fallbackTitle: string;
  fallbackDescription: string;
  path: string;
  onChange: (patch: { seoTitle?: string; seoDescription?: string }) => void;
}) {
  const shownTitle = title || fallbackTitle || 'Page title';
  const shownDesc =
    description || fallbackDescription || 'Add a meta description so Google shows a helpful summary of this page.';
  return (
    <div className="cms-seo">
      <label className="cms-field">
        <span className="cms-seo-label">
          Meta title <Counter length={title.length} max={TITLE_MAX} />
        </span>
        <input
          value={title}
          placeholder={fallbackTitle || 'e.g. SEO Services in Hyderabad | Thinklab'}
          maxLength={200}
          onChange={(e) => onChange({ seoTitle: e.target.value })}
        />
        <small>The blue headline people see in Google. Include your main keyword.</small>
      </label>
      <label className="cms-field">
        <span className="cms-seo-label">
          Meta description <Counter length={description.length} max={DESC_MAX} />
        </span>
        <textarea
          rows={3}
          value={description}
          placeholder={fallbackDescription || 'One or two sentences that make people want to click.'}
          maxLength={500}
          onChange={(e) => onChange({ seoDescription: e.target.value })}
        />
        <small>The grey text under the headline in Google.</small>
      </label>
      <div className="cms-seo-preview" aria-label="Google preview">
        <small>Google preview</small>
        <span className="cms-seo-url">thinklabdigitalsolutions.com{path === '/' ? '' : path.replace(/\//g, ' › ')}</span>
        <strong>{shownTitle.length > TITLE_MAX ? shownTitle.slice(0, TITLE_MAX - 1) + '…' : shownTitle}</strong>
        <p>{shownDesc.length > DESC_MAX ? shownDesc.slice(0, DESC_MAX - 1) + '…' : shownDesc}</p>
      </div>
    </div>
  );
}
