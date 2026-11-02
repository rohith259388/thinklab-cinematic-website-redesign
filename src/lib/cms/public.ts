import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { query, document } from './store';
import { session } from './auth';
import { emptyContent, type Content, type Kind, type Document } from './schema';
import { projects, articles, careers } from '../live';

export const previewDocument = cache(async () => {
  const id = (await headers()).get('x-cms-preview');
  if (!id) return null;
  try {
    if (!(await session())) notFound();
    const d = await document(id);
    if (!d || d.deleted) notFound();
    return d;
  } catch {
    return null;
  }
});

export async function publicDocuments(kind: Kind) {
  if (!process.env.DATABASE_URL) return null;
  try {
    return (
      await query(
        'SELECT * FROM cms_documents WHERE kind=$1 AND deleted=false AND published IS NOT NULL ORDER BY updated DESC',
        [kind],
      )
    ).rows as Document[];
  } catch (err) {
    console.warn(`[cms] Database connection unavailable for ${kind}, using static content fallback.`);
    return null;
  }
}

export async function entries(kind: 'projects' | 'blog' | 'careers') {
  const rows = await publicDocuments(kind);
  const preview = await previewDocument();
  const fallback = { projects, blog: articles, careers }[kind].map((e) => ({
    ...emptyContent(),
    ...e,
    alt: e.title,
  }));
  const result = rows
    ? rows
        .map((d) => ({ ...d.published!, slug: d.slug }))
        .sort((a, b) => {
          const ai = fallback.findIndex((e) => e.slug === a.slug),
            bi = fallback.findIndex((e) => e.slug === b.slug);
          return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi);
        })
    : fallback;
  if (preview?.kind === kind)
    return [
      ...result.filter((e) => e.slug !== preview.slug),
      { ...preview.draft, slug: preview.slug },
    ];
  return result;
}

export const siteContent = cache(async () => {
  const h = await headers();
  const path = h.get('x-cms-path') || '/';
  const preview = await previewDocument();
  let page: Content | null = null,
    global: Content | null = null;
  if (process.env.DATABASE_URL) {
    try {
      const rows = (
        await query(
          "SELECT * FROM cms_documents WHERE deleted=false AND ((kind='page' AND slug=$1) OR kind='global')",
          [path === '/' ? '/' : path.slice(1)],
        )
      ).rows as Document[];
      const pageDoc = rows.find((d) => d.kind === 'page');
      if (pageDoc && !pageDoc.published && preview?.id !== pageDoc.id) notFound();
      page = pageDoc?.published || null;
      global = rows.find((d) => d.kind === 'global')?.published || null;
    } catch (err) {
      console.warn('[cms] Database connection unavailable, using static content fallback.');
    }
  }
  if (preview && preview.kind !== 'global') page = preview.draft;
  if (preview?.kind === 'global') global = preview.draft;
  return { page, global, previewId: preview?.id || null };
});
