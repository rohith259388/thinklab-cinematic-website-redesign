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
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error('DB lookup timed out')), ms);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

// Every published document, kept in memory for a short time. Pages read from this
// snapshot instead of querying MongoDB several times per request, so most page views
// never touch the database. It holds plain data only (no sockets), which is safe to
// share between requests on Cloudflare Workers. Publishing clears it in the isolate
// that handled the publish; other isolates pick the change up within PUBLISHED_TTL_MS.
const PUBLISHED_TTL_MS = 15_000;
type Snapshot = { at: number; docs: Document[] };
const snap = globalThis as typeof globalThis & { __cmsPublished?: Snapshot | null };

export function invalidatePublishedCache() {
  snap.__cmsPublished = null;
}

const toDocument = (d: Record<string, any>): Document =>
  ({
    id: d.id,
    kind: d.kind,
    slug: d.slug,
    draft: null,
    published: d.published,
    revision: d.revision ?? 1,
    deleted: false,
    updated: d.updated instanceof Date ? d.updated.toISOString() : String(d.updated || ''),
  }) as unknown as Document;

/** Published documents, or null when no database is configured or it is unreachable. */
const publishedDocuments = cache(async (): Promise<Document[] | null> => {
  const uri = process.env.MONGODB_URI || process.env.DATABASE_URL;
  if (!uri) return null;
  const current = snap.__cmsPublished;
  if (current && Date.now() - current.at < PUBLISHED_TTL_MS) return current.docs;
  try {
    const rows = await withQuickTimeout(
      getDb().then((db) =>
        db
          .collection('cms_documents')
          .find(
            { deleted: false, published: { $ne: null } },
            { projection: { _id: 0, id: 1, kind: 1, slug: 1, published: 1, revision: 1, updated: 1 } },
          )
          .sort({ updated: -1 })
          .toArray(),
      ),
      4000,
    );
    const docs = rows.map(toDocument);
    snap.__cmsPublished = { at: Date.now(), docs };
    return docs;
  } catch {
    // Serve the last good snapshot rather than silently reverting to built-in defaults.
    if (current) return current.docs;
    console.warn('[cms] Database unavailable, using static content fallback.');
    return null;
  }
});

export async function publicDocuments(kind: Kind) {
  const docs = await publishedDocuments();
  return docs ? docs.filter((d) => d.kind === kind) : null;
}

function parseItemTimestamp(item: { updated?: string | Date; date?: string }): number {
  if (item.updated) {
    const t = new Date(item.updated).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  if (item.date) {
    const t = Date.parse(item.date);
    if (!isNaN(t) && t > 0) return t;
  }
  return 0;
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
        .map((d) => ({ ...d.published!, slug: d.slug, updated: d.updated }))
        .sort((a, b) => {
          const ai = fallback.findIndex((e) => e.slug === a.slug);
          const bi = fallback.findIndex((e) => e.slug === b.slug);

          // 1. If BOTH are newly created CMS items (not in legacy static seed array),
          // sort the newer one on top (descending timestamp).
          if (ai < 0 && bi < 0) {
            return parseItemTimestamp(b) - parseItemTimestamp(a);
          }
          // 2. If 'a' is newly created in CMS, 'a' comes first (top of the list).
          if (ai < 0) return -1;
          // 3. If 'b' is newly created in CMS, 'b' comes first (top of the list).
          if (bi < 0) return 1;

          // 4. Both are legacy items: preserve the established curation order.
          return ai - bi;
        })
    : fallback;

  // In preview mode: place the draft being previewed on the very top of the list!
  if (preview?.kind === kind && preview.draft) {
    const previewItem = { ...preview.draft, slug: preview.slug };
    return [
      previewItem,
      ...result.filter((e) => e.slug !== preview.slug),
    ];
  }
  return result;
}

/** Page slug for the current request, derived from the path the proxy forwards. */
async function currentSlug() {
  const path = (await headers()).get('x-cms-path') || '/';
  const clean = path.replace(/\/+$/, '') || '/';
  return clean === '/' ? '/' : clean.slice(1);
}

export const siteContent = cache(async (slugOverride?: string) => {
  const slug = slugOverride ?? (await currentSlug());
  const [docs, preview] = await Promise.all([publishedDocuments(), previewDocument()]);
  let page = (docs?.find((d) => d.kind === 'page' && d.slug === slug)?.published ?? null) as Content | null;
  let global = (docs?.find((d) => d.kind === 'global' && d.slug === 'site')?.published ?? null) as Content | null;
  if (preview?.kind === 'page' && preview.slug === slug) page = preview.draft;
  if (preview?.kind === 'global') global = preview.draft;
  // Custom pages the editor chose to show in the main menu.
  const menu = (docs ?? [])
    .filter((d) => d.kind === 'page' && d.slug !== '/' && d.published?.fields['page.menu'] === 'show')
    .map((d) => ({ title: d.published!.fields['page.menuLabel'] || d.published!.title, href: `/${d.slug}` }))
    .sort((a, b) => a.title.localeCompare(b.title));
  return { page, global, previewId: preview?.id || null, menu };
});
