export const kinds = ['page', 'projects', 'blog', 'careers', 'global'] as const;
export type Kind = (typeof kinds)[number];
export type Role = 'admin' | 'publisher' | 'editor';
export type Section = {
  id: string;
  type: 'text' | 'hero' | 'cta' | 'image';
  image: string;
  alt: string;
  title: string;
  body: string;
  href: string;
  background: string;
  color: string;
  padding: number;
  align: 'left' | 'center';
};
export type Content = {
  title: string;
  summary: string;
  image: string;
  alt: string;
  category: string;
  tags: string;
  date: string;
  apply: string;
  source: string;
  archive: boolean;
  blocks: { type: string; text: string }[];
  fields: Record<string, string>;
  styles: Record<
    string,
    {
      color?: string;
      background?: string;
      fontSize?: number;
      fontFamily?: string;
      padding?: number;
    }
  >;
  sections: Section[];
  seoTitle: string;
  seoDescription: string;
  canonical: string;
};
export type Document = {
  id: string;
  kind: Kind;
  slug: string;
  draft: Content;
  published: Content | null;
  revision: number;
  deleted: boolean;
  updated: string;
};
export const emptyContent = (title = ''): Content => ({
  title,
  summary: '',
  image: '',
  alt: '',
  category: '',
  tags: '',
  date: '',
  apply: '',
  source: '',
  archive: false,
  blocks: [],
  fields: {},
  styles: {},
  sections: [],
  seoTitle: '',
  seoDescription: '',
  canonical: '',
});
export function safeUrl(value: string, image = false) {
  if (!value) return true;
  if (image)
    return (
      /^\/images\/[a-zA-Z0-9_./-]+$/.test(value) ||
      /^\/api\/cms-media\/[a-f0-9-]+$/.test(value) ||
      /^https?:\/\/[^\s\\]+$/i.test(value)
    );
  return (
    /^\/(?!\/)[^\s\\]*$/.test(value) ||
    /^https:\/\/[^\s\\]+$/.test(value) ||
    /^(mailto:|tel:)[^\s<>]+$/.test(value)
  );
}
const text = (v: unknown, max = 10000): string => {
  if (typeof v !== 'string' || v.length > max)
    throw new Error('Invalid text or text too long');
  return v;
};
const color = (v: unknown) => {
  const s = text(v, 9);
  if (s && !/^#[0-9a-f]{3,8}$/i.test(s)) throw new Error('Use a hex color');
  return s;
};
const number = (v: unknown, max: number) => {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > max)
    throw new Error('Invalid size');
  return v;
};
export function validateContent(raw: unknown): Content {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw))
    throw new Error('Invalid content');
  const r = raw as Record<string, unknown>,
    out = emptyContent();
  for (const key of [
    'title',
    'summary',
    'image',
    'alt',
    'category',
    'tags',
    'date',
    'apply',
    'source',
    'seoTitle',
    'seoDescription',
    'canonical',
  ] as const)
    out[key] = text(r[key] ?? '', key === 'summary' ? 10000 : 2000);
  if (!out.title.trim()) throw new Error('Title is required');
  if (
    !safeUrl(out.image, true) ||
    ![out.apply, out.source, out.canonical].every((v) => safeUrl(v))
  )
    throw new Error('Invalid URL');
  out.archive = r.archive === true;
  if (!Array.isArray(r.blocks) || r.blocks.length > 500)
    throw new Error('Invalid rich text');
  out.blocks = r.blocks.map((b) => {
    if (!b || !['p', 'h2', 'h3', 'h4', 'h5', 'li'].includes(b.type))
      throw new Error('Unsupported rich text block');
    return { type: b.type, text: text(b.text) };
  });
  if (
    !r.fields ||
    typeof r.fields !== 'object' ||
    Array.isArray(r.fields) ||
    Object.keys(r.fields).length > 100
  )
    throw new Error('Invalid fields');
  out.fields = Object.fromEntries(
    Object.entries(r.fields).map(([k, v]) => {
      if (!/^[a-zA-Z0-9.-]{1,100}$/.test(k)) throw new Error('Invalid field');
      const value = text(v);
      if (k.endsWith('.href') && !safeUrl(value))
        throw new Error('Invalid link URL');
      return [k, value];
    }),
  );
  if (!r.styles || typeof r.styles !== 'object' || Array.isArray(r.styles))
    throw new Error('Invalid styles');
  out.styles = Object.fromEntries(
    Object.entries(r.styles)
      .slice(0, 100)
      .map(([k, v]) => {
        const s = v as Record<string, unknown>;
        if (
          s.fontFamily &&
          ![
            'var(--font-grotesk)',
            'var(--font-fraunces)',
            'var(--font-plex)',
          ].includes(String(s.fontFamily))
        )
          throw new Error('Unsupported font');
        return [
          k,
          {
            ...(s.fontFamily ? { fontFamily: String(s.fontFamily) } : {}),
            ...(s.color ? { color: color(s.color) } : {}),
            ...(s.background ? { background: color(s.background) } : {}),
            ...(s.fontSize !== undefined
              ? { fontSize: number(s.fontSize, 160) }
              : {}),
            ...(s.padding !== undefined
              ? { padding: number(s.padding, 200) }
              : {}),
          },
        ];
      }),
  );
  if (!Array.isArray(r.sections) || r.sections.length > 50)
    throw new Error('Invalid sections');
  out.sections = r.sections.map((s) => {
    if (!['text', 'hero', 'cta', 'image'].includes(s.type) || !safeUrl(s.href))
      throw new Error('Unsupported section');
    if (!safeUrl(s.image || '', true)) throw new Error('Invalid image URL');
    return {
      image: text(s.image || ''),
      alt: text(s.alt || ''),
      id: text(s.id, 100),
      type: s.type,
      title: text(s.title),
      body: text(s.body),
      href: text(s.href),
      color: color(s.color),
      background: color(s.background),
      padding: number(s.padding, 200),
      align: s.align === 'center' ? 'center' : 'left',
    };
  });
  return out;
}
export function validateSlug(slug: unknown, kind: Kind) {
  const s = text(slug, 180);
  if (kind === 'global' && s === 'site') return s;
  if (kind === 'page' && s === '/') return s;
  if (
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s) ||
    ['admin', 'api', 'images', '_next'].includes(s)
  )
    throw new Error('Invalid or reserved slug');
  return s;
}
export const documentPath = (d: Pick<Document, 'kind' | 'slug'>) =>
  d.kind === 'global'
    ? '/'
    : d.kind === 'page'
      ? d.slug === '/'
        ? '/'
        : `/${d.slug}`
      : `/${d.kind}/${d.slug}`;
