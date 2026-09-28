import { Inter } from "next/font/google";
import { NextIntlClientProvider, type AbstractIntlMessages } from "next-intl";
import "@/app/globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ToastProvider } from "@/components/ui/toast";
import { AuthProvider } from "@/lib/auth-context";
import { FavoritesProvider } from "@/lib/favorites-context";

// Cyrillic subset for Macedonian; otherwise mk text falls back to a system font.
const inter = Inter({
  subsets: ["latin", "latin-ext", "cyrillic"],
  variable: "--font-sans",
  display: "swap",
});

/**
 * Document, providers, header and footer. Used by the [locale] layout and by the
 * root not-found page (URLs outside the locale routes), so both look the same.
 */
export function SiteShell({
  locale,
  messages,
  children,
}: {
  locale: string;
  messages: AbstractIntlMessages;
  children: React.ReactNode;
}) {
  return (
    <html lang={locale} className={inter.variable} suppressHydrationWarning>
      <body className="font-sans">
        <NextIntlClientProvider messages={messages} locale={locale}>
          <ToastProvider>
            <AuthProvider>
              <FavoritesProvider>
                <Navbar />
                <main className="min-h-screen">{children}</main>
                <Footer />
              </FavoritesProvider>
            </AuthProvider>
          </ToastProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
