import { getDb } from '@/lib/cms/store';
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
        'Cache-Control': 'private, no-store',
        'Content-Security-Policy': "default-src 'none'; sandbox",
      },
    });
  } catch {
    return new Response(null, { status: 503 });
  }
}
