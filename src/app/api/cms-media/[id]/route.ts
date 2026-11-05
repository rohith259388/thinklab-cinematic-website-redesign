import { getDb, releaseDb } from '@/lib/cms/store';
import { session } from '@/lib/cms/auth';

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^[a-f0-9-]{36}$/.test(id)) return new Response(null, { status: 404 });
  try {
    const db = await getDb();
    const mediaDoc = await db.collection('cms_media').findOne({ id });
    if (!mediaDoc) return new Response(null, { status: 404 });

    const publicRef = await db.collection('cms_documents').findOne({
      deleted: false,
      $or: [
        { 'published.image': { $regex: id } },
        { 'published.sections.image': { $regex: id } },
        { 'published.blocks.text': { $regex: id } },
      ],
    });

    if (!publicRef && !(await session())) {
      return new Response(null, { status: 404 });
    }

    const buffer = Buffer.isBuffer(mediaDoc.bytes)
      ? mediaDoc.bytes
      : mediaDoc.bytes?.buffer
        ? Buffer.from(mediaDoc.bytes.buffer)
        : Buffer.from(mediaDoc.bytes);

    return new Response(buffer, {
      headers: {
        'Content-Type': mediaDoc.mime,
        'X-Content-Type-Options': 'nosniff',
        // Asset ids are random UUIDs and their bytes never change, so published
        // images can be cached by browsers and Cloudflare's edge indefinitely.
        'Cache-Control': publicRef
          ? 'public, max-age=31536000, immutable'
          : 'private, no-store',
        'Content-Security-Policy': "default-src 'none'; sandbox",
      },
    });
  } catch {
    return new Response(null, { status: 503 });
  } finally {
    await releaseDb();
  }
}
