import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Session verification + role-based redirects for the (client)/(admin) route
 * groups live in their own layout.tsx (apps/web/src/app/(client)/layout.tsx,
 * apps/web/src/app/(admin)/layout.tsx), not here — those pages share no
 * common URL prefix (`/mes-favoris`, `/pattern-studio`, `/espace-client`,
 * `/creations/[slug]/personnaliser`, ...; Next.js route groups add no URL
 * segment), so middleware has no reliable way to detect group membership
 * from the pathname alone, while every page nested under a group's folder is
 * guaranteed to go through its layout regardless of URL — see
 * docs/pages/authentification.md "Points d'attention".
 *
 * This middleware's only remaining job: stamp the current pathname onto a
 * request header so those layouts (which don't otherwise receive the URL)
 * can build an accurate `redirectTo` back to the page the visitor came from.
 */
export function middleware(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set('x-pathname', request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
