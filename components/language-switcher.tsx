'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { locales, localeNames, type Locale } from '@/lib/locales';

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const handleLanguageChange = (newLocale: Locale) => {
    const pathWithoutLocale = pathname.replace(/^\/(de|en|mk)/, '');
    router.push(`/${newLocale}${pathWithoutLocale || '/'}`);
  };

  return (
    <div className="flex gap-2">
      {locales.map((loc) => (
        <button
          key={loc}
          onClick={() => handleLanguageChange(loc)}
          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
            locale === loc
              ? 'bg-primary text-primary-foreground'
              : 'bg-border text-foreground hover:bg-input'
          }`}
        >
          {localeNames[loc]}
        </button>
      ))}
    </div>
  );
}
