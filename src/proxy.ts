import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_ADMIN_PATHS = ['/admin/login', '/admin/register'];

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Fast path: no session cookie at all means the workspace can't be opened, so
  // redirect before rendering anything. Expired/revoked sessions are caught by
  // the server-side check in src/app/admin/page.tsx.
  if (
    pathname.startsWith('/admin') &&
    !PUBLIC_ADMIN_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/')) &&
    !req.cookies.get('cms_session')?.value
  ) {
    const url = req.nextUrl.clone();
    url.pathname = '/admin/login';
    url.search = '';
    const res = NextResponse.redirect(url);
    res.headers.set('Cache-Control', 'private, no-store');
    return res;
  }

  const headers = new Headers(req.headers);
  headers.delete('x-cms-preview');
  headers.delete('x-cms-path');
  headers.set('x-cms-path', pathname);
  const preview = req.nextUrl.searchParams.get('__cms_preview');
  if (preview) headers.set('x-cms-preview', preview);
  const res = NextResponse.next({ request: { headers } });
  if (preview || pathname.startsWith('/admin')) {
    res.headers.set('X-Robots-Tag', 'noindex, nofollow');
    res.headers.set('Cache-Control', 'private, no-store');
    res.headers.set('Content-Security-Policy', "frame-ancestors 'self'");
  }
  return res;
}
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|images|icon.svg|icon.png|favicon.ico|favicon.svg).*)'],
};
