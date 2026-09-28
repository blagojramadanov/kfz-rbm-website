'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { locales, localeNames, type Locale } from '@/lib/locales';
import { cn } from '@/lib/utils';

/** `size="lg"`: full-width, 44px touch targets (mobile menu). */
export function LanguageSwitcher({ size = 'sm' }: { size?: 'sm' | 'lg' }) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const handleLanguageChange = (newLocale: Locale) => {
    const pathWithoutLocale = pathname.replace(/^\/(de|en|mk)/, '');
    router.push(`/${newLocale}${pathWithoutLocale || '/'}`);
  };

  return (
    <div className={cn('flex gap-2', size === 'lg' && 'w-full')}>
      {locales.map((loc) => (
        <button
          key={loc}
          type="button"
          lang={loc}
          aria-current={locale === loc ? 'true' : undefined}
          onClick={() => handleLanguageChange(loc)}
          className={cn(
            'rounded font-medium transition-colors',
            size === 'lg' ? 'flex-1 min-h-11 px-2 text-sm' : 'px-3 py-1 text-sm',
            locale === loc
              ? 'bg-primary text-primary-foreground'
              : 'bg-border text-foreground hover:bg-input'
          )}
        >
          {localeNames[loc]}
        </button>
      ))}
    </div>
  );
}
