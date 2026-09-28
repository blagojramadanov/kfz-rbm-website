import { notFound } from "next/navigation";

// Every URL under /{locale}/ without a matching route shows the styled 404
// from app/[locale]/not-found.tsx (with header, footer and language switcher).
export default function CatchAllPage() {
  notFound();
}
