import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Create a Supabase client that reads/writes cookies on the request/response.
  // This also refreshes expiring tokens automatically (setAll fires on refresh).
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getSession() reads from the cookie — no network call needed for routing.
  const { data: { session } } = await supabase.auth.getSession();
  const { pathname } = request.nextUrl;

  // ── Unauthenticated ──────────────────────────────────────────────────────────
  if (!session) {
    if (pathname === '/login') return response;
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // ── Authenticated on login or root → route to correct home ──────────────────
  if (pathname === '/login' || pathname === '/') {
    const isAdmin = session.user.user_metadata?.isAdmin === true;
    return NextResponse.redirect(new URL(isAdmin ? '/admin/team' : '/dashboard', request.url));
  }

  // ── Guard /admin routes — engineers get redirected to /dashboard ─────────────
  if (pathname.startsWith('/admin')) {
    const isAdmin = session.user.user_metadata?.isAdmin === true;
    if (!isAdmin) return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files; protect everything else
    '/((?!api|_next/static|_next/image|favicon.ico|INV_CircleLogo.svg).*)',
  ],
};
