import { NotFoundContent } from "@/components/not-found-content";

// Rendered inside the [locale] layout (header, footer, language switcher).
// Next.js sends status 404 and a noindex robots tag for not-found pages.
export default function NotFoundPage() {
  return <NotFoundContent />;
}
