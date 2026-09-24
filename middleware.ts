import createMiddleware from 'next-intl/middleware';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const handleI18nRouting = createMiddleware({
  locales: ['de', 'en', 'mk'],
  defaultLocale: 'de',
  localePrefix: 'always',
});

// Server-side route guard: /{locale}/dashboard/** needs a session, /{locale}/admin/**
// needs an admin. The client-side guards in the pages/layouts stay as a second layer.
// Paths without a locale prefix are redirected by the i18n middleware first and then
// hit this guard. Server actions have their own checks (lib/auth-guards.ts): they are
// public endpoints that can be called from any URL, so this guard does not cover them.
const PROTECTED = /^\/(de|en|mk)\/(dashboard|admin)(\/|$)/i;

// Next.js routes on the decoded path, so the guard must match on it too: without this,
// /de/%61dmin (an encoded "a") or /de//admin would skip the check and still reach the page.
function normalizePath(pathname: string): string | null {
  let path = pathname;
  for (let i = 0; i < 3; i++) {
    try {
      const decoded = decodeURIComponent(path);
      if (decoded === path) break;
      path = decoded;
    } catch {
      return null; // malformed percent-encoding
    }
  }
  const segments: string[] = [];
  for (const segment of path.split(/[\\/]+/)) {
    if (segment === "" || segment === ".") continue;
    if (segment === "..") segments.pop();
    else segments.push(segment);
  }
  return "/" + segments.join("/");
}

export async function middleware(request: NextRequest) {
  const path = normalizePath(request.nextUrl.pathname);
  if (path === null) return new NextResponse("Bad request", { status: 400 });

  const match = PROTECTED.exec(path);
  if (!match) return handleI18nRouting(request);

  const locale = match[1].toLowerCase();
  const area = match[2].toLowerCase();
  const redirectTo = (path: string) => NextResponse.redirect(new URL(`/${locale}${path}`, request.url));

  // Cookies the Supabase client refreshes (expired access token) must reach both the
  // downstream request and the browser, otherwise the refresh token is used twice.
  const refreshedCookies: { name: string; value: string; options?: CookieOptions }[] = [];
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            refreshedCookies.push({ name, value, options });
          });
        },
      },
    },
  );

  try {
    // getUser() validates the token with Supabase (getSession() would only decode the cookie).
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return redirectTo('/login');

    if (area === 'admin') {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      // Logged in but not an admin: back to the customer dashboard.
      if (profile?.role !== 'ADMIN') return redirectTo('/dashboard');
    }
  } catch {
    // Fail closed if Supabase cannot be reached.
    return redirectTo('/login');
  }

  const response = handleI18nRouting(request);
  refreshedCookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
  // Never let a CDN or shared cache keep a response that was only allowed for this user.
  response.headers.set('Cache-Control', 'private, no-cache, no-store, max-age=0, must-revalidate');
  return response;
}

export const config = {
  matcher: [
    '/((?!_next|api|.*\\..*|favicon\\.ico).*)',
  ],
};
