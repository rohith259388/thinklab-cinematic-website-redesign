import { NextRequest, NextResponse } from 'next/server';
export function proxy(req: NextRequest) {
  const headers = new Headers(req.headers);
  headers.delete('x-cms-preview');
  headers.delete('x-cms-path');
  headers.set('x-cms-path', req.nextUrl.pathname);
  const preview = req.nextUrl.searchParams.get('__cms_preview');
  if (preview) headers.set('x-cms-preview', preview);
  const res = NextResponse.next({ request: { headers } });
  if (preview || req.nextUrl.pathname.startsWith('/admin')) {
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    res.headers.set('Cache-Control', 'private, no-store');
    res.headers.set('Content-Security-Policy', "frame-ancestors 'self'");
  }
  return res;
}
export const config = {
  matcher: ['/((?!_next/static|_next/image|images|icon.svg).*)'],
};
