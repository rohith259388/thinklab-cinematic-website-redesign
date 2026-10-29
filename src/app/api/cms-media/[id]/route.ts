import { query } from '@/lib/cms/store';
import { session } from '@/lib/cms/auth';
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^[a-f0-9-]{36}$/.test(id)) return new Response(null, { status: 404 });
  try {
    const publicRef = (
      await query(
        'SELECT id FROM cms_documents WHERE deleted=false AND published::text LIKE $1 LIMIT 1',
        ['%/api/cms-media/' + id + '%'],
      )
    ).rowCount;
    if (!publicRef && !(await session()))
      return new Response(null, { status: 404 });
    const row = (
      await query('SELECT bytes,mime FROM cms_media WHERE id=$1', [id])
    ).rows[0];
    if (!row) return new Response(null, { status: 404 });
    return new Response(row.bytes, {
      headers: {
        'Content-Type': row.mime,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'private, no-store',
        'Content-Security-Policy': "default-src 'none'; sandbox",
      },
    });
  } catch {
    return new Response(null, { status: 503 });
  }
}
