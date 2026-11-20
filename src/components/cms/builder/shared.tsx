'use client';
import { useState, type ComponentType } from 'react';
import {
  LayoutTemplate,
  Type,
  Image as ImageIcon,
  Columns2,
  LayoutGrid,
  ChartColumn,
  MessageCircleQuestionMark,
  MessageSquareQuote,
  Images,
  Award,
  Megaphone,
  Quote,
  CirclePlay,
  Mail,
  SeparatorHorizontal,
} from 'lucide-react';
import type { SectionType } from '@/lib/cms/schema';

export const sectionIcons: Record<SectionType, ComponentType<{ size?: number }>> = {
  hero: LayoutTemplate,
  text: Type,
  image: ImageIcon,
  imageText: Columns2,
  features: LayoutGrid,
  stats: ChartColumn,
  faq: MessageCircleQuestionMark,
  testimonials: MessageSquareQuote,
  gallery: Images,
  logos: Award,
  cta: Megaphone,
  quote: Quote,
  video: CirclePlay,
  contact: Mail,
  divider: SeparatorHorizontal,
};

export type SiteLink = { label: string; href: string };

export const baseLinks: SiteLink[] = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Services', href: '/services' },
  { label: 'Projects', href: '/projects' },
  { label: 'Reviews', href: '/reviews' },
  { label: 'Insights (blog)', href: '/blog' },
  { label: 'Careers', href: '/careers' },
  { label: 'Contact', href: '/contact' },
];

/**
 * Pick a page of the website from a list, or type any other web address,
 * email (mailto:) or phone number (tel:).
 */
export function LinkField({
  label,
  value,
  onChange,
  links,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  links: SiteLink[];
}) {
  const known = links.some((l) => l.href === value);
  const [custom, setCustom] = useState(!known && value !== '');
  return (
    <label className="cms-field">
      {label}
      <select
        value={custom ? '__custom' : value}
        onChange={(e) => {
          if (e.target.value === '__custom') {
            setCustom(true);
            return;
          }
          setCustom(false);
          onChange(e.target.value);
        }}
      >
        <option value="">— No link —</option>
        {links.map((l) => (
          <option key={l.href} value={l.href}>
            {l.label}
          </option>
        ))}
        <option value="__custom">Other web address, email or phone…</option>
      </select>
      {custom && (
        <input
          placeholder="https://example.com · mailto:you@site.com · tel:+91…"
          value={value}
          onChange={(e) => onChange(e.target.value.trim())}
          onBlur={(e) => onChange(normalizeLink(e.target.value))}
        />
      )}
    </label>
  );
}

/** Turns what people naturally type ("example.com", "me@site.com") into a valid link. */
export function normalizeLink(raw: string) {
  const v = raw.trim();
  if (!v || /^(\/|https?:\/\/|mailto:|tel:)/i.test(v)) return v.replace(/^http:\/\//i, 'https://');
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'mailto:' + v;
  if (/^\+?[\d\s()-]{7,}$/.test(v)) return 'tel:' + v.replace(/[\s()-]/g, '');
  if (/^[\w-]+(\.[\w-]+)+/.test(v)) return 'https://' + v;
  return '/' + v.replace(/^\/+/, '');
}

/** Color swatch + hex input with a “default” reset. */
export function ColorField({
  label,
  value,
  onChange,
  fallback,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  fallback: string;
}) {
  return (
    <label className="cms-field cms-color-field">
      {label}
      <span>
        <input type="color" value={value || fallback} onChange={(e) => onChange(e.target.value)} />
        <input
          value={value}
          placeholder="Default"
          maxLength={9}
          onChange={(e) => onChange(e.target.value.trim())}
        />
        {value && (
          <button type="button" onClick={() => onChange('')}>
            Reset
          </button>
        )}
      </span>
    </label>
  );
}

export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="cms-field">
      {label}
      <div className="cms-segmented" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            className={value === o.value ? 'active' : ''}
            onClick={() => onChange(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
