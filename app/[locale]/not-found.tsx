import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";

export default function NotFoundPage() {
  const t = useTranslations("pages.notFound");

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
        <p className="text-2xl font-semibold text-foreground mb-2">
          {t("title")}
        </p>
        <p className="text-muted-foreground mb-8">
          {t("description")}
        </p>
        <Link href="/" className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary-hover transition">
          {t("backHome")}
        </Link>
      </div>
    </div>
  );
}
