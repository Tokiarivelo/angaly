import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Pass-through for now. Phase 1 (auth) adds session verification + role-based
// redirects for the (client) and (admin) route groups here — see
// docs/features/auth.md and docs/pages/authentification.md.
export function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
