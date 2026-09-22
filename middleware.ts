import createMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';

const handleI18nRouting = createMiddleware({
  locales: ['de', 'en', 'mk'],
  defaultLocale: 'de',
  localePrefix: 'as-needed',
});

export function middleware(request: NextRequest) {
  return handleI18nRouting(request);
}

export const config = {
  matcher: [
    '/',
    '/(de|en|mk)/:path*',
  ],
};
