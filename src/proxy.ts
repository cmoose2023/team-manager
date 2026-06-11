import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Amplify v6 with ssr:true stores the access token in a predictable cookie name.
// We use the clientId env var to build the key deterministically.
function getAccessToken(request: NextRequest): string | null {
  const clientId = process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID;
  if (!clientId) return null;
  return (
    request.cookies.get(`CognitoIdentityServiceProvider.${clientId}.accessToken`)
      ?.value ?? null
  );
}

// Decode JWT payload without signature verification.
// Verification happens inside API routes — proxy only needs groups for routing.
function decodeGroups(token: string): string[] {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64)) as Record<string, unknown>;
    return (payload['cognito:groups'] as string[] | undefined) ?? [];
  } catch {
    return [];
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = getAccessToken(request);
  const isAuthenticated = !!accessToken;

  // ── Unauthenticated ────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    if (pathname === '/login') return NextResponse.next();
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // ── Authenticated on login or root → route to correct home ────────────────
  if (pathname === '/login' || pathname === '/') {
    const groups = decodeGroups(accessToken);
    const dest = groups.includes('Admins') ? '/admin' : '/dashboard';
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // ── Guard /admin routes — engineers get redirected to /dashboard ───────────
  if (pathname.startsWith('/admin')) {
    const groups = decodeGroups(accessToken);
    if (!groups.includes('Admins')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files; protect everything else
    '/((?!api|_next/static|_next/image|favicon.ico|INV_CircleLogo.svg).*)',
  ],
};
