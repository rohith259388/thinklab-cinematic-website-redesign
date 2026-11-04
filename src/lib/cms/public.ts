import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { getDb, document } from './store';
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

async function withQuickTimeout<T>(promise: Promise<T>, ms = 2000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('DB lookup timed out')), ms)
    ),
  ]);
}

export async function publicDocuments(kind: Kind) {
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
  if (!uri) return null;
  try {
    const list = await withQuickTimeout(
      getDb().then((db) =>
        db
          .collection('cms_documents')
          .find({
            kind,
            deleted: false,
            published: { $ne: null },
          })
          .sort({ updated: -1 })
          .toArray()
      ),
      2000
    );

    return list.map((d) => ({
      id: d.id,
      kind: d.kind,
      slug: d.slug,
      draft: d.draft,
      published: d.published,
      revision: d.revision ?? 1,
      deleted: d.deleted ?? false,
      updated: d.updated instanceof Date ? d.updated.toISOString() : String(d.updated || ''),
    })) as Document[];
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

export async function siteContent(slug = '/') {
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
  if (!uri) return { page: null, global: null };
  try {
    const rows = await withQuickTimeout(
      getDb().then((db) =>
        db
          .collection('cms_documents')
          .find({
            deleted: false,
            published: { $ne: null },
            $or: [
              { kind: 'page', slug },
              { kind: 'global', slug: 'site' },
            ],
          })
          .toArray()
      ),
      2000
    );

    const page = rows.find((r) => r.kind === 'page' && r.slug === slug)?.published as Content | null;
    const global = rows.find((r) => r.kind === 'global' && r.slug === 'site')?.published as Content | null;
    return { page: page || null, global: global || null };
  } catch (err) {
    console.warn('[cms] Database connection unavailable for siteContent, using defaults.');
    return { page: null, global: null };
  }
}
